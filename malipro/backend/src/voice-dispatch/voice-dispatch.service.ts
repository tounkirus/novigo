import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { PushService } from "../common/push/push.service";
import {
  AnnouncementInput, VoiceLanguage, buildAnnouncement, pushTitle,
} from "./announcement.builder";

/// Réglages par défaut d'un prestataire qui n'a jamais rien changé.
export const VOICE_DEFAULTS = {
  enabled: true,
  language: "fr" as VoiceLanguage,
  voice: "FEMALE",
  speed: 1,
  volume: 1,
  repeatCount: 1,
};

/// Délai de réponse annoncé par défaut (§4 du cahier des charges).
export const DEFAULT_RESPONSE_SECONDS = 20;

export interface AnnounceRequest extends AnnouncementInput {
  partnerId: string;
  missionId?: string | null;
  orderId?: string | null;
}

/// VOICE DISPATCH — annonce vocale des missions.
///
/// Le prestataire est informé **sans regarder son écran** : le serveur pousse le
/// texte déjà composé (l'appareil ne fabrique aucune phrase), l'application le
/// prononce. Deux canaux complémentaires : Socket.IO quand l'app est vivante,
/// notification push (FCM/APNs) sinon — écran verrouillé compris.
@Injectable()
export class VoiceDispatchService {
  private readonly logger = new Logger("VoiceDispatch");
  /// Annonces envoyées en attente d'accusé de lecture (réessai automatique).
  private readonly pending = new Map<string, NodeJS.Timeout>();

  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private push: PushService,
  ) {}

  // ── Paramètres ────────────────────────────────────────────────────────────

  /// Réglages du prestataire (valeurs par défaut s'il n'a jamais rien changé).
  async settings(partnerId: string) {
    const row = await this.prisma.voiceSettings
      .findUnique({ where: { partnerId } })
      .catch(() => null);
    return VoiceDispatchService.mapSettings(row, partnerId);
  }

  async updateSettings(partnerId: string, dto: Partial<typeof VOICE_DEFAULTS>) {
    const data = {
      enabled: dto.enabled ?? undefined,
      language: dto.language ?? undefined,
      voice: dto.voice ?? undefined,
      // Bornes : une vitesse ou un volume hors plage rendrait l'annonce inaudible.
      speed: dto.speed != null ? Math.min(2, Math.max(0.5, dto.speed)) : undefined,
      volume: dto.volume != null ? Math.min(1, Math.max(0, dto.volume)) : undefined,
      repeatCount: dto.repeatCount != null ? Math.min(3, Math.max(1, dto.repeatCount)) : undefined,
    };
    const row = await this.prisma.voiceSettings.upsert({
      where: { partnerId },
      update: data,
      create: { partnerId, ...VOICE_DEFAULTS, ...data },
    });
    return VoiceDispatchService.mapSettings(row, partnerId);
  }

  // ── Envoi ─────────────────────────────────────────────────────────────────

  /// Compose et envoie l'annonce. Best-effort : une panne vocale ne doit jamais
  /// empêcher la mission d'exister (le prestataire la voit toujours à l'écran).
  async announce(req: AnnounceRequest) {
    const settings = await this.settings(req.partnerId);
    const language = settings.language as VoiceLanguage;
    const responseSeconds = req.responseSeconds ?? DEFAULT_RESPONSE_SECONDS;
    const text = buildAnnouncement({ ...req, responseSeconds }, language);

    if (!settings.enabled) {
      // Désactivé par le prestataire : on trace le fait de ne PAS avoir parlé.
      const skipped = await this.log({ ...req, language, text, channel: "NONE", status: "SKIPPED", responseSeconds });
      return { id: skipped?.id ?? null, text, language, skipped: true, channel: "NONE" };
    }

    // Le journal est écrit AVANT l'envoi : l'annonce part avec son identifiant,
    // donc l'application peut accuser réception quel que soit le canal. Sans cela,
    // une annonce reçue par Socket.IO restait à jamais « SENT » et le réessai
    // automatique la faisait entendre deux fois.
    const row = await this.log({ ...req, language, text, channel: "PENDING", status: "SENT", responseSeconds });

    const payload = {
      id: row?.id ?? null,
      text,
      language,
      voice: settings.voice,
      speed: settings.speed,
      volume: settings.volume,
      repeatCount: settings.repeatCount,
      kind: req.kind,
      missionId: req.missionId ?? null,
      orderId: req.orderId ?? null,
      responseSeconds,
      serviceLabel: req.serviceLabel ?? null,
      zone: req.zone ?? null,
      payout: req.payout ?? null,
      distanceMeters: req.distanceMeters ?? null,
    };

    let realtimeOk = false;
    try {
      this.realtime.emitToUsers([req.partnerId], "voice.dispatch", payload);
      realtimeOk = true;
    } catch (e: any) {
      this.logger.warn(`temps réel indisponible: ${e.message}`);
    }

    const pushOk = await this.sendPush(req.partnerId, text, language, req, payload);
    const channel = realtimeOk && pushOk ? "BOTH" : realtimeOk ? "REALTIME" : pushOk ? "PUSH" : "NONE";

    if (row?.id) {
      await this.prisma.voiceAnnouncement
        .update({ where: { id: row.id }, data: { channel } })
        .catch(() => undefined);
      this.scheduleRetry(row.id, req.partnerId, payload, responseSeconds);
    }

    this.logger.log(`[${req.kind}] ${req.partnerId} ← « ${text} » (${channel})`);
    return { id: row?.id ?? null, text, language, skipped: false, channel };
  }

  /// Annonce de test déclenchée par le prestataire lui-même (§6 : /test).
  test(partnerId: string) {
    return this.announce({ partnerId, kind: "TEST" });
  }

  // ── Accusé de lecture + journal ───────────────────────────────────────────

  /// L'application confirme (ou non) que l'annonce a bien été prononcée.
  /// C'est ce qui distingue « envoyée » de « réellement entendue » : téléphone
  /// silencieux, moteur TTS absent, appareil hors ligne… (§9).
  async acknowledge(id: string, partnerId: string, status: "PLAYED" | "FAILED", error?: string) {
    const row = await this.prisma.voiceAnnouncement.findUnique({ where: { id } });
    if (!row || row.partnerId !== partnerId) throw new NotFoundException("Annonce introuvable.");
    this.cancelRetry(id);
    const updated = await this.prisma.voiceAnnouncement.update({
      where: { id },
      data: {
        status,
        error: error ?? null,
        playedAt: status === "PLAYED" ? new Date() : null,
      },
    });
    return VoiceDispatchService.mapAnnouncement(updated);
  }

  /// Journal des annonces d'un prestataire (critère d'acceptation §12).
  async history(partnerId: string, limit = 30) {
    const rows = await this.prisma.voiceAnnouncement
      .findMany({ where: { partnerId }, orderBy: { createdAt: "desc" }, take: Math.min(limit, 100) })
      .catch(() => []);
    return rows.map((r) => VoiceDispatchService.mapAnnouncement(r));
  }

  // ── Internes ──────────────────────────────────────────────────────────────

  private async sendPush(
    partnerId: string,
    text: string,
    language: VoiceLanguage,
    req: AnnounceRequest,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const devices = await this.prisma.deviceToken.findMany({ where: { userId: partnerId } });
      if (!devices.length) return false;
      // Les données voyagent en chaînes : l'app reçoit le texte déjà prêt à lire,
      // y compris écran verrouillé, sans rappeler le serveur.
      const data: Record<string, string> = {
        type: "voice.dispatch",
        announcementId: String(payload.id ?? ""),
        text,
        language,
        voice: String(payload.voice),
        speed: String(payload.speed),
        volume: String(payload.volume),
        repeatCount: String(payload.repeatCount),
        kind: req.kind,
        missionId: req.missionId ?? "",
        responseSeconds: String(payload.responseSeconds),
      };
      await this.push.sendToTokens(devices.map((d) => d.token), pushTitle(req, language), text, data);
      return true;
    } catch (e: any) {
      this.logger.warn(`push vocal échoué: ${e.message}`);
      return false;
    }
  }

  private async log(input: {
    partnerId: string;
    missionId?: string | null;
    orderId?: string | null;
    kind: string;
    language: string;
    text: string;
    channel: string;
    status: string;
    responseSeconds?: number;
  }) {
    try {
      return await this.prisma.voiceAnnouncement.create({
        data: {
          partnerId: input.partnerId,
          missionId: input.missionId ?? null,
          orderId: input.orderId ?? null,
          kind: input.kind,
          language: input.language,
          text: input.text,
          channel: input.channel,
          status: input.status,
          responseSeconds: input.responseSeconds ?? null,
        },
        select: { id: true },
      });
    } catch (e: any) {
      this.logger.warn(`journal vocal indisponible: ${e.message}`);
      return null;
    }
  }

  /// Réessai automatique (§9) : si aucun accusé de lecture n'arrive dans le délai
  /// de réponse, on repousse l'annonce **une seule fois** — un prestataire ne doit
  /// pas être harcelé, mais une notification perdue ne doit pas coûter la mission.
  scheduleRetry(id: string, partnerId: string, payload: Record<string, unknown>, seconds: number) {
    const timer = setTimeout(async () => {
      this.pending.delete(id);
      try {
        const row = await this.prisma.voiceAnnouncement.findUnique({ where: { id } });
        if (!row || row.status !== "SENT") return; // déjà lue ou échouée : rien à refaire
        this.realtime.emitToUsers([partnerId], "voice.dispatch", { ...payload, retry: true });
        this.logger.log(`réessai annonce ${id} (aucun accusé en ${seconds} s)`);
      } catch (e: any) {
        this.logger.debug(`réessai ${id} ignoré: ${e.message}`);
      }
    }, Math.max(5, seconds) * 1000);
    // Ne retient pas le process au moment de l'arrêt.
    timer.unref?.();
    this.pending.set(id, timer);
  }

  private cancelRetry(id: string) {
    const t = this.pending.get(id);
    if (t) {
      clearTimeout(t);
      this.pending.delete(id);
    }
  }

  private static mapSettings(row: any, partnerId: string) {
    return {
      partnerId,
      enabled: row?.enabled ?? VOICE_DEFAULTS.enabled,
      language: row?.language ?? VOICE_DEFAULTS.language,
      voice: row?.voice ?? VOICE_DEFAULTS.voice,
      speed: row?.speed ?? VOICE_DEFAULTS.speed,
      volume: row?.volume ?? VOICE_DEFAULTS.volume,
      repeatCount: row?.repeatCount ?? VOICE_DEFAULTS.repeatCount,
      updatedAt: row?.updatedAt ?? null,
      /// Vrai tant que le prestataire n'a rien personnalisé.
      isDefault: !row,
    };
  }

  private static mapAnnouncement(r: any) {
    return {
      id: r.id,
      kind: r.kind,
      language: r.language,
      text: r.text,
      channel: r.channel,
      status: r.status,
      missionId: r.missionId,
      responseSeconds: r.responseSeconds,
      error: r.error,
      playedAt: r.playedAt,
      createdAt: r.createdAt,
    };
  }
}

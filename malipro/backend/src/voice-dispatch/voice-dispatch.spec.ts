import { NotFoundException } from "@nestjs/common";
import { buildAnnouncement, pushTitle } from "./announcement.builder";
import { VoiceDispatchService, VOICE_DEFAULTS } from "./voice-dispatch.service";
import { fakePrisma } from "../brain/fake-prisma";

describe("Fabrique d'annonces", () => {
  it("annonce une livraison en français, comme au cahier des charges", () => {
    const texte = buildAnnouncement(
      {
        kind: "MISSION_ASSIGNED",
        family: "DELIVERY",
        serviceLabel: "Livraison de repas",
        zone: "ACI 2000",
        distanceMeters: 2000,
        payout: 2500,
        responseSeconds: 20,
      },
      "fr",
    );
    expect(texte).toBe(
      "Nouvelle livraison disponible à ACI 2000. Distance 2 kilomètres. " +
        "Gain estimé 2500 francs CFA. Vous avez 20 secondes pour répondre.",
    );
  });

  it("annonce une demande d'artisan", () => {
    const texte = buildAnnouncement(
      { kind: "MISSION_ASSIGNED", family: "HOME_SERVICE", serviceLabel: "Plombier", zone: "Magnambougou", payout: 15000 },
      "fr",
    );
    expect(texte).toBe("Nouvelle demande de plombier à Magnambougou. Gain estimé 15000 francs CFA.");
  });

  it("adapte la distance : mètres, kilomètre singulier, pluriel", () => {
    const km = (m: number) =>
      buildAnnouncement({ kind: "MISSION_ASSIGNED", zone: "Sotuba", distanceMeters: m }, "fr");
    expect(km(800)).toContain("800 mètres");
    expect(km(1500)).toContain("1,5 kilomètre.");
    expect(km(4000)).toContain("4 kilomètres");
  });

  it("n'énonce que ce qui est connu (aucun trou de phrase)", () => {
    expect(buildAnnouncement({ kind: "MISSION_ASSIGNED" }, "fr")).toBe("Nouvelle livraison disponible.");
  });

  it("produit une annonce de test et un titre push par langue", () => {
    expect(buildAnnouncement({ kind: "TEST" }, "fr")).toContain("test des annonces vocales");
    expect(buildAnnouncement({ kind: "TEST" }, "bm")).toContain("NOVIGO");
    expect(pushTitle({ kind: "MISSION_ASSIGNED" }, "fr")).toBe("Nouvelle mission NOVIGO");
    expect(pushTitle({ kind: "TEST" }, "bm")).toContain("NOVIGO");
  });

  it("parle bambara quand la langue est bm", () => {
    const texte = buildAnnouncement(
      { kind: "MISSION_ASSIGNED", zone: "ACI 2000", distanceMeters: 2000, payout: 2500, responseSeconds: 20 },
      "bm",
    );
    expect(texte).toContain("ACI 2000");
    expect(texte).toContain("2500");
    expect(texte).not.toContain("Nouvelle livraison"); // vraiment une autre langue
  });
});

describe("VoiceDispatchService", () => {
  const build = (seed: Record<string, any[]> = {}) => {
    const prisma = fakePrisma({ ...seed, voiceSettings: seed.voiceSettings ?? [], voiceAnnouncement: [], deviceToken: seed.deviceToken ?? [] } as any);
    const realtime = { emitToUsers: jest.fn() } as any;
    const push = { sendToTokens: jest.fn().mockResolvedValue(undefined) } as any;
    return { svc: new VoiceDispatchService(prisma, realtime, push), prisma, realtime, push };
  };

  it("renvoie les réglages par défaut tant que rien n'a été personnalisé", async () => {
    const { svc } = build();
    const s = await svc.settings("livreur1");
    expect(s).toMatchObject({ ...VOICE_DEFAULTS, partnerId: "livreur1", isDefault: true });
  });

  it("enregistre les réglages en bornant vitesse, volume et répétitions", async () => {
    const { svc } = build();
    const s = await svc.updateSettings("livreur1", {
      language: "bm", voice: "MALE", speed: 9, volume: -2, repeatCount: 12, enabled: true,
    } as any);
    expect(s.language).toBe("bm");
    expect(s.voice).toBe("MALE");
    expect(s.speed).toBe(2); // plafonné
    expect(s.volume).toBe(0); // plancher
    expect(s.repeatCount).toBe(3); // plafonné
    expect(s.isDefault).toBe(false);
  });

  it("envoie l'annonce en temps réel ET en push, puis la journalise", async () => {
    const { svc, prisma, realtime, push } = build({
      deviceToken: [{ id: "t1", userId: "livreur1", token: "tok-1" }],
    });
    const res = await svc.announce({
      partnerId: "livreur1",
      kind: "MISSION_ASSIGNED",
      family: "DELIVERY",
      serviceLabel: "Livraison de repas",
      zone: "ACI 2000",
      distanceMeters: 2000,
      payout: 2500,
      missionId: "m1",
    });

    expect(res.skipped).toBe(false);
    expect(res.channel).toBe("BOTH");
    expect(res.text).toContain("Nouvelle livraison disponible à ACI 2000");
    // L'identifiant part AVEC l'annonce : sans lui, l'app ne pourrait pas
    // accuser réception et le réessai la ferait entendre une seconde fois.
    expect(realtime.emitToUsers).toHaveBeenCalledWith(
      ["livreur1"], "voice.dispatch",
      expect.objectContaining({ id: res.id, language: "fr", repeatCount: 1 }),
    );
    expect(push.sendToTokens).toHaveBeenCalledWith(
      ["tok-1"], "Nouvelle mission NOVIGO", res.text,
      expect.objectContaining({ type: "voice.dispatch", announcementId: res.id }),
    );
    expect(prisma.voiceAnnouncement.rows[0]).toMatchObject({ status: "SENT", channel: "BOTH", missionId: "m1" });
  });

  it("sans appareil enregistré, l'annonce part quand même en temps réel", async () => {
    const { svc, push } = build();
    const res = await svc.announce({ partnerId: "livreur1", kind: "MISSION_ASSIGNED" });
    expect(res.channel).toBe("REALTIME");
    expect(push.sendToTokens).not.toHaveBeenCalled();
  });

  it("respecte la désactivation : rien n'est prononcé, mais c'est tracé", async () => {
    const { svc, prisma, realtime } = build();
    await svc.updateSettings("livreur1", { enabled: false } as any);
    const res = await svc.announce({ partnerId: "livreur1", kind: "MISSION_ASSIGNED", zone: "Sotuba" });
    expect(res.skipped).toBe(true);
    expect(realtime.emitToUsers).not.toHaveBeenCalled();
    expect(prisma.voiceAnnouncement.rows[0]).toMatchObject({ status: "SKIPPED", channel: "NONE" });
  });

  it("accuse la lecture, ou l'échec avec son motif", async () => {
    const { svc, prisma } = build();
    const sent = await svc.announce({ partnerId: "livreur1", kind: "TEST" });
    const played = await svc.acknowledge(sent.id!, "livreur1", "PLAYED");
    expect(played.status).toBe("PLAYED");
    expect(played.playedAt).toBeTruthy();

    const second = await svc.announce({ partnerId: "livreur1", kind: "TEST" });
    const failed = await svc.acknowledge(second.id!, "livreur1", "FAILED", "TTS_UNAVAILABLE");
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toBe("TTS_UNAVAILABLE");
    expect(prisma.voiceAnnouncement.rows).toHaveLength(2);
  });

  it("refuse l'accusé d'un autre prestataire (cloisonnement)", async () => {
    const { svc } = build();
    const sent = await svc.announce({ partnerId: "livreur1", kind: "TEST" });
    await expect(svc.acknowledge(sent.id!, "intrus", "PLAYED")).rejects.toThrow(NotFoundException);
    await expect(svc.acknowledge("inconnue", "livreur1", "PLAYED")).rejects.toThrow(NotFoundException);
  });

  it("réessaie une fois quand aucun accusé n'arrive", async () => {
    jest.useFakeTimers();
    try {
      const { svc, realtime, prisma } = build();
      await svc.announce({ partnerId: "livreur1", kind: "MISSION_ASSIGNED", responseSeconds: 20 });
      expect(realtime.emitToUsers).toHaveBeenCalledTimes(1);
      expect(prisma.voiceAnnouncement.rows[0].status).toBe("SENT");

      await jest.advanceTimersByTimeAsync(20_000);
      expect(realtime.emitToUsers).toHaveBeenCalledTimes(2);
      expect(realtime.emitToUsers).toHaveBeenLastCalledWith(
        ["livreur1"], "voice.dispatch", expect.objectContaining({ retry: true }),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it("ne réessaie pas une annonce déjà lue", async () => {
    jest.useFakeTimers();
    try {
      const { svc, realtime } = build();
      const sent = await svc.announce({ partnerId: "livreur1", kind: "MISSION_ASSIGNED", responseSeconds: 20 });
      await svc.acknowledge(sent.id!, "livreur1", "PLAYED");
      await jest.advanceTimersByTimeAsync(30_000);
      expect(realtime.emitToUsers).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("restitue le journal des annonces du prestataire", async () => {
    const { svc } = build();
    await svc.announce({ partnerId: "livreur1", kind: "TEST" });
    await svc.announce({ partnerId: "livreur2", kind: "TEST" });
    const journal = await svc.history("livreur1");
    expect(journal).toHaveLength(1);
    expect(journal[0].kind).toBe("TEST");
  });
});

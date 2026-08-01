import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { DecisionRecord } from "./brain.types";

/// JOURNAL DES DÉCISIONS (principes n°3 et « chaque décision doit être enregistrée »).
///
/// Toute sortie d'un moteur passe par ici : entrées observées, sortie produite,
/// raisons lisibles, candidats évalués, carré d'équilibre et latence. C'est ce qui
/// rend une décision NOVIGO explicable a posteriori — à un client, à un livreur,
/// à un commerçant ou à un auditeur.
@Injectable()
export class DecisionLogService {
  private readonly logger = new Logger("Brain/Decisions");

  constructor(private prisma: PrismaService) {}

  /// Écrit la décision. Best-effort : une panne de journal ne doit JAMAIS
  /// empêcher la mission de se dérouler (mais elle est tracée dans les logs).
  async record(decision: DecisionRecord): Promise<string | null> {
    try {
      const row = await this.prisma.brainDecision.create({
        data: {
          kind: decision.kind as any,
          engine: decision.engine,
          engineVersion: decision.engineVersion ?? "1.0.0",
          serviceKey: decision.serviceKey ?? null,
          missionId: decision.missionId ?? null,
          subjectId: decision.subjectId ?? null,
          input: (decision.input ?? {}) as any,
          output: (decision.output ?? {}) as any,
          reasons: decision.reasons ?? [],
          candidates: (decision.candidates ?? undefined) as any,
          score: decision.score ?? null,
          confidence: decision.confidence ?? null,
          balance: (decision.balance ?? undefined) as any,
          latencyMs: decision.latencyMs ?? null,
        },
        select: { id: true },
      });
      return row.id;
    } catch (e: any) {
      this.logger.warn(`journal de décision indisponible (${decision.kind}): ${e.message}`);
      return null;
    }
  }

  /// Explication complète d'une décision.
  async explain(id: string) {
    const row = await this.prisma.brainDecision.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Décision introuvable.");
    return this.map(row);
  }

  /// Décisions prises pour une mission, de la plus récente à la plus ancienne.
  async forMission(missionId: string) {
    const rows = await this.prisma.brainDecision.findMany({
      where: { missionId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.map(r));
  }

  /// Flux d'audit (console d'administration).
  async list(params: { kind?: string; limit?: number } = {}) {
    const rows = await this.prisma.brainDecision.findMany({
      where: params.kind ? { kind: params.kind as any } : {},
      orderBy: { createdAt: "desc" },
      take: Math.min(params.limit ?? 50, 200),
    });
    return rows.map((r) => this.map(r));
  }

  private map(r: any) {
    return {
      id: r.id,
      kind: r.kind,
      engine: r.engine,
      engineVersion: r.engineVersion,
      serviceKey: r.serviceKey,
      missionId: r.missionId,
      subjectId: r.subjectId,
      input: r.input,
      output: r.output,
      reasons: r.reasons,
      candidates: r.candidates,
      score: r.score,
      confidence: r.confidence,
      balance: r.balance,
      latencyMs: r.latencyMs,
      createdAt: r.createdAt,
    };
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

/// Périmètres du Livre de Connaissances.
export type KnowledgeScope = "ZONE" | "PROVIDER" | "MERCHANT" | "CUSTOMER" | "CITY" | "SERVICE";

export interface KnowledgeValue {
  value: number;
  samples: number;
}

/// LIVRE DE CONNAISSANCES NOVIGO (principe n°4).
///
/// Mémoire interne du Brain : moyennes glissantes apprises mission après mission
/// (délais réels par zone, temps de préparation d'un commerçant, performance d'un
/// prestataire, demande horaire d'un quartier…). Toute écriture est *best-effort* :
/// si la base n'est pas joignable, le Brain continue de décider avec ses valeurs
/// par défaut — il ne bloque jamais une mission pour un défaut d'apprentissage.
@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger("Brain/Knowledge");
  /// Cache mémoire (lecture chaude à chaque décision).
  private readonly cache = new Map<string, KnowledgeValue>();

  constructor(private prisma: PrismaService) {}

  private static id(scope: string, key: string, metric: string) {
    return `${scope}:${key}:${metric}`;
  }

  /// Lecture d'une connaissance apprise, ou `fallback` si le Brain n'a rien vu.
  async get(scope: KnowledgeScope, key: string, metric: string, fallback: number): Promise<number> {
    const cached = this.cache.get(KnowledgeService.id(scope, key, metric));
    if (cached) return cached.value;
    try {
      const row = await this.prisma.knowledgeEntry.findUnique({
        where: { scope_key_metric: { scope, key, metric } },
      });
      if (!row) return fallback;
      this.cache.set(KnowledgeService.id(scope, key, metric), {
        value: row.value,
        samples: row.samples,
      });
      return row.value;
    } catch {
      return fallback;
    }
  }

  /// Lecture avec le nombre d'observations (utile pour pondérer la confiance).
  async detail(
    scope: KnowledgeScope,
    key: string,
    metric: string,
    fallback: number,
  ): Promise<KnowledgeValue> {
    const value = await this.get(scope, key, metric, fallback);
    const cached = this.cache.get(KnowledgeService.id(scope, key, metric));
    return { value, samples: cached?.samples ?? 0 };
  }

  /// Enregistre une observation. Moyenne glissante amortie : les 30 premières
  /// observations comptent pleinement, ensuite le poids d'une mission se stabilise
  /// (le Brain apprend vite au début, puis ne sur-réagit plus à un cas isolé).
  async observe(
    scope: KnowledgeScope,
    key: string,
    metric: string,
    observation: number,
    meta?: Record<string, unknown>,
  ): Promise<KnowledgeValue> {
    const cacheId = KnowledgeService.id(scope, key, metric);
    try {
      const row = await this.prisma.knowledgeEntry.findUnique({
        where: { scope_key_metric: { scope, key, metric } },
      });
      const samples = (row?.samples ?? 0) + 1;
      const weight = 1 / Math.min(samples, 30);
      const value = row ? row.value + (observation - row.value) * weight : observation;
      const saved = await this.prisma.knowledgeEntry.upsert({
        where: { scope_key_metric: { scope, key, metric } },
        update: { value, samples, meta: (meta ?? undefined) as any },
        create: { scope, key, metric, value, samples: 1, meta: (meta ?? undefined) as any },
      });
      const out = { value: saved.value, samples: saved.samples };
      this.cache.set(cacheId, out);
      return out;
    } catch (e: any) {
      // Apprentissage indisponible : on garde la dernière valeur connue en mémoire.
      this.logger.debug(`observe ${cacheId} ignoré: ${e.message}`);
      const previous = this.cache.get(cacheId);
      const samples = (previous?.samples ?? 0) + 1;
      const value = previous
        ? previous.value + (observation - previous.value) / Math.min(samples, 30)
        : observation;
      const out = { value, samples };
      this.cache.set(cacheId, out);
      return out;
    }
  }

  /// Incrémente un compteur (demande horaire, annulations…).
  async increment(scope: KnowledgeScope, key: string, metric: string, by = 1): Promise<void> {
    try {
      await this.prisma.knowledgeEntry.upsert({
        where: { scope_key_metric: { scope, key, metric } },
        update: { value: { increment: by }, samples: { increment: 1 } },
        create: { scope, key, metric, value: by, samples: 1 },
      });
      this.cache.delete(KnowledgeService.id(scope, key, metric));
    } catch {
      /* apprentissage best-effort */
    }
  }

  /// Toutes les connaissances d'un périmètre/métrique (classement décroissant).
  async top(scope: KnowledgeScope, metric: string, limit = 20) {
    try {
      return await this.prisma.knowledgeEntry.findMany({
        where: { scope, metric },
        orderBy: { value: "desc" },
        take: limit,
      });
    } catch {
      return [];
    }
  }

  /// Toutes les métriques connues d'une clé (fiche zone / prestataire / commerçant).
  async profile(scope: KnowledgeScope, key: string) {
    try {
      const rows = await this.prisma.knowledgeEntry.findMany({ where: { scope, key } });
      return rows.reduce<Record<string, KnowledgeValue>>((acc, r) => {
        acc[r.metric] = { value: r.value, samples: r.samples };
        return acc;
      }, {});
    } catch {
      return {};
    }
  }

  /// Volume total de connaissances accumulées (tableau de bord Brain).
  async stats() {
    try {
      const [entries, agg] = await Promise.all([
        this.prisma.knowledgeEntry.count(),
        this.prisma.knowledgeEntry.aggregate({ _sum: { samples: true } }),
      ]);
      return { entries, observations: agg._sum.samples ?? 0 };
    } catch {
      return { entries: 0, observations: 0 };
    }
  }
}

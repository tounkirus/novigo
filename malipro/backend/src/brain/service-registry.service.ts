import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { ServiceRuntime } from "./brain.types";
import { SERVICE_CATALOG, ServiceDefinition } from "./service-catalog";

/// REGISTRE DES MÉTIERS (principe n°6 : configuration avant développement).
///
/// Source de vérité = table `ServicePolicy` si elle contient la clé, sinon le
/// catalogue par défaut compilé. Ajouter un métier ne demande donc **aucune**
/// modification des moteurs : une ligne de configuration suffit.
@Injectable()
export class ServiceRegistryService {
  private readonly logger = new Logger("Brain/Services");
  private cache = new Map<string, ServiceRuntime>();
  private loadedAt = 0;
  private static readonly TTL_MS = 60_000;

  constructor(private prisma: PrismaService) {}

  /// Charge (et met en cache 60 s) la configuration effective des métiers.
  async all(): Promise<ServiceRuntime[]> {
    const fresh = Date.now() - this.loadedAt < ServiceRegistryService.TTL_MS;
    if (fresh && this.cache.size) return [...this.cache.values()];

    const merged = new Map<string, ServiceRuntime>(
      SERVICE_CATALOG.map((s) => [s.key, { ...s, fromDatabase: false }]),
    );
    try {
      const rows = await this.prisma.servicePolicy.findMany({ where: { enabled: true } });
      for (const row of rows) {
        const base = merged.get(row.key);
        merged.set(row.key, {
          key: row.key,
          label: row.label,
          family: row.family as ServiceRuntime["family"],
          providerKind: row.providerKind as ServiceRuntime["providerKind"],
          requiresVehicle: row.requiresVehicle,
          skills: row.skills?.length ? row.skills : (base?.skills ?? []),
          equipment: row.equipment?.length ? row.equipment : (base?.equipment ?? []),
          pricing: { ...(base?.pricing ?? {}), ...((row.pricing as object) ?? {}) } as ServiceDefinition["pricing"],
          constraints: {
            ...(base?.constraints ?? {}),
            ...((row.constraints as object) ?? {}),
          } as ServiceDefinition["constraints"],
          orderType: base?.orderType,
          fromDatabase: true,
        });
      }
    } catch (e: any) {
      this.logger.debug(`ServicePolicy illisible, catalogue par défaut utilisé: ${e.message}`);
    }
    this.cache = merged;
    this.loadedAt = Date.now();
    return [...merged.values()];
  }

  /// Configuration d'un métier ; lève 404 si le métier n'est pas déclaré.
  async get(key: string): Promise<ServiceRuntime> {
    const found = (await this.all()).find((s) => s.key === key);
    if (!found) throw new NotFoundException(`Service « ${key} » non déclaré au Brain.`);
    return found;
  }

  /// Déclare ou met à jour un métier (administration). Aucun déploiement requis.
  async upsert(input: {
    key: string;
    label: string;
    family: string;
    providerKind?: string;
    requiresVehicle?: boolean;
    skills?: string[];
    equipment?: string[];
    pricing?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
    enabled?: boolean;
  }) {
    const base = SERVICE_CATALOG.find((s) => s.key === input.key);
    const row = await this.prisma.servicePolicy.upsert({
      where: { key: input.key },
      update: {
        label: input.label,
        family: input.family,
        providerKind: input.providerKind ?? base?.providerKind ?? "DRIVER",
        requiresVehicle: input.requiresVehicle ?? base?.requiresVehicle ?? false,
        skills: input.skills ?? base?.skills ?? [],
        equipment: input.equipment ?? base?.equipment ?? [],
        pricing: (input.pricing ?? base?.pricing ?? {}) as any,
        constraints: (input.constraints ?? base?.constraints ?? {}) as any,
        enabled: input.enabled ?? true,
        version: { increment: 1 },
      },
      create: {
        key: input.key,
        label: input.label,
        family: input.family,
        providerKind: input.providerKind ?? base?.providerKind ?? "DRIVER",
        requiresVehicle: input.requiresVehicle ?? base?.requiresVehicle ?? false,
        skills: input.skills ?? base?.skills ?? [],
        equipment: input.equipment ?? base?.equipment ?? [],
        pricing: (input.pricing ?? base?.pricing ?? {}) as any,
        constraints: (input.constraints ?? base?.constraints ?? {}) as any,
        enabled: input.enabled ?? true,
      },
    });
    this.invalidate();
    return row;
  }

  invalidate(): void {
    this.loadedAt = 0;
    this.cache.clear();
  }
}

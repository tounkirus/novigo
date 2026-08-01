import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { BrainService } from "./brain.service";
import { ServiceRegistryService } from "./service-registry.service";
import { CreateMissionDto, QuoteDto, ServicePolicyDto } from "./brain.dto";

/// API du NOVIGO Brain. Les applications *consomment* des décisions ; elles n'en
/// produisent aucune (principes n°1 et n°2). Toutes les routes sont montées sous
/// /api/v1/brain et tombent naturellement côté Nest dans le routage du Gateway.
@Controller("brain")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrainController {
  constructor(
    private brain: BrainService,
    private registry: ServiceRegistryService,
  ) {}

  /// Métiers pilotés par le Brain (déclarés par configuration).
  @Get("services")
  services() {
    return this.brain.services();
  }

  /// Déclare/modifie un métier sans redéploiement (principe n°6).
  @Post("services")
  @Roles("ADMIN", "SUPER_ADMIN")
  @HttpCode(200)
  upsertService(@Body() dto: ServicePolicyDto) {
    return this.registry.upsert(dto as any);
  }

  /// Devis : tarif juste, délai estimé, détail et raisons.
  @Post("quote")
  @HttpCode(200)
  quote(@CurrentUser() user: AuthUser, @Body() dto: QuoteDto) {
    return this.brain.quote({ ...dto, clientId: user.id });
  }

  /// Crée une mission (livraison, dépannage, course, soin…) et lance l'attribution.
  @Post("missions")
  createMission(@CurrentUser() user: AuthUser, @Body() dto: CreateMissionDto) {
    return this.brain.createMission({
      ...dto,
      clientId: user.id,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      payload: dto.note ? { note: dto.note } : undefined,
    });
  }

  /// Mes missions (client).
  @Get("missions/mine")
  mine(@CurrentUser() user: AuthUser, @Query("limit") limit?: string) {
    return this.brain.listMine(user.id, Number(limit ?? 20));
  }

  /// Missions ouvertes classées POUR le prestataire connecté, avec les raisons.
  @Get("missions/available")
  @Roles("DRIVER", "ARTISAN")
  available(@CurrentUser() user: AuthUser, @Query("limit") limit?: string) {
    return this.brain.openMissionsFor(user.id, Number(limit ?? 20));
  }

  @Get("missions/:id")
  mission(@Param("id") id: string) {
    return this.brain.get(id);
  }

  /// Décisions prises pour cette mission (explicabilité, principe n°3).
  @Get("missions/:id/decisions")
  missionDecisions(@Param("id") id: string) {
    return this.brain.missionDecisions(id);
  }

  /// Proposition de regroupement (Batch Engine).
  @Get("missions/:id/batch")
  batch(@Param("id") id: string) {
    return this.brain.batchFor(id);
  }

  @Post("missions/:id/dispatch")
  @Roles("ADMIN", "SUPER_ADMIN")
  @HttpCode(200)
  dispatch(@Param("id") id: string) {
    return this.brain.dispatch(id);
  }

  @Post("missions/:id/accept")
  @Roles("DRIVER", "ARTISAN")
  @HttpCode(200)
  accept(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.brain.acceptMission(id, user.id);
  }

  @Post("missions/:id/start")
  @Roles("DRIVER", "ARTISAN")
  @HttpCode(200)
  start(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.brain.startMission(id, user.id);
  }

  @Post("missions/:id/complete")
  @Roles("DRIVER", "ARTISAN")
  @HttpCode(200)
  complete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.brain.completeMission(id, user.id);
  }

  @Post("missions/:id/cancel")
  @HttpCode(200)
  cancel(@Param("id") id: string, @CurrentUser() user: AuthUser, @Body() body: { reason?: string }) {
    return this.brain.cancelMission(id, body?.reason, user.id);
  }

  /// Explication d'une décision : entrées observées, sortie, raisons, équilibre.
  @Get("decisions/:id")
  explain(@Param("id") id: string) {
    return this.brain.explain(id);
  }

  /// Ma confiance NOVIGO (client).
  @Get("trust/me")
  myTrust(@CurrentUser() user: AuthUser) {
    return this.brain.trustOf(user.id, "CUSTOMER");
  }

  /// Ce que le Brain a appris du commerçant connecté.
  @Get("insights/merchant")
  @Roles("MERCHANT", "MERCHANT_MANAGER", "ADMIN", "SUPER_ADMIN")
  merchantInsights(@CurrentUser() user: AuthUser) {
    return this.brain.merchantInsights(user.id);
  }

  /// Intelligence de la ville : pointe, quartiers actifs, zones sous-servies.
  @Get("insights/city")
  @Roles("ADMIN", "SUPER_ADMIN", "MERCHANT")
  cityInsights(@Query("zone") zone?: string) {
    return this.brain.cityInsights(zone);
  }

  /// Tableau de bord du Brain (administration).
  @Get("dashboard")
  @Roles("ADMIN", "SUPER_ADMIN")
  dashboard() {
    return this.brain.dashboard();
  }
}

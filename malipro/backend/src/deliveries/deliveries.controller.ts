import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { DeliveriesService } from "./deliveries.service";

@Controller("deliveries")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveriesController {
  constructor(private deliveries: DeliveriesService) {}

  @Get("available")
  @Roles("DRIVER")
  available(@CurrentUser() user: AuthUser) {
    return this.deliveries.available(user.id);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.deliveries.get(id);
  }

  @Post(":id/accept")
  @Roles("DRIVER")
  accept(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.deliveries.accept(id, user.id);
  }

  @Post(":id/reject")
  @Roles("DRIVER")
  reject(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.deliveries.reject(id, user.id);
  }

  @Post(":id/start")
  @Roles("DRIVER")
  start(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.deliveries.start(id, user.id);
  }

  /// « Je suis arrivé » : démarre le compteur d'attente (CDC v0.75 §3).
  @Post(":id/arrive")
  @Roles("DRIVER")
  arrive(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.deliveries.arrive(id, user.id);
  }

  /// Attente écoulée et droits ouverts (§3) : le serveur compte, pas l'appli.
  @Get(":id/waiting")
  @Roles("DRIVER")
  waiting(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.deliveries.waiting(id, user.id);
  }

  /// Abandon pour client absent, après le délai d'attente (§3).
  @Post(":id/absent")
  @Roles("DRIVER")
  absent(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.deliveries.cancelForAbsence(id, user.id);
  }

  @Post(":id/complete")
  @Roles("DRIVER")
  complete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.deliveries.complete(id, user.id);
  }

  @Post(":id/location")
  @Roles("DRIVER")
  location(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { lat: number; lng: number },
  ) {
    return this.deliveries.updateLocation(id, user.id, body.lat, body.lng);
  }

  @Post(":id/issues")
  @Roles("DRIVER", "CUSTOMER")
  reportIssue(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { type: string; description: string },
  ) {
    return this.deliveries.reportIssue(id, user.id, body.type, body.description);
  }
}

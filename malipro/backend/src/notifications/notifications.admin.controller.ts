import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { NotificationsService } from "./notifications.service";

@Controller("admin/notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class NotificationsAdminController {
  constructor(private notifications: NotificationsService) {}

  @Post("broadcast")
  broadcast(@Body() body: { title: string; body: string; targetRole?: string }) {
    return this.notifications.broadcast(body.title, body.body, body.targetRole);
  }
}

import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { NotificationsService } from "./notifications.service";
import { UpdatePreferencesDto } from "./notifications.dto";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: PaginationQuery) {
    return this.notifications.list(u.id, q.page, q.limit);
  }

  @Get("preferences")
  getPreferences(@CurrentUser() u: AuthUser) {
    return this.notifications.getPreferences(u.id);
  }

  @Put("preferences")
  updatePreferences(@CurrentUser() u: AuthUser, @Body() dto: UpdatePreferencesDto) {
    return this.notifications.updatePreferences(u.id, dto);
  }

  @Get("unread-count")
  unread(@CurrentUser() u: AuthUser) {
    return this.notifications.unreadCount(u.id);
  }

  @Post(":id/read")
  read(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.notifications.markRead(u.id, id);
  }

  @Post("read-all")
  readAll(@CurrentUser() u: AuthUser) {
    return this.notifications.markAllRead(u.id);
  }
}

import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { VoiceDispatchService } from "./voice-dispatch.service";

/// Réglages vocaux modifiables par le prestataire (§5).
export class VoiceSettingsDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsIn(["fr", "bm"]) language?: "fr" | "bm";
  @IsOptional() @IsIn(["FEMALE", "MALE"]) voice?: string;
  @IsOptional() @IsNumber() @Min(0.5) @Max(2) speed?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) volume?: number;
  @IsOptional() @IsInt() @Min(1) @Max(3) repeatCount?: number;
}

/// Envoi d'une annonce à un prestataire (usage interne / administration).
export class SendAnnouncementDto {
  @IsString() partnerId!: string;
  @IsOptional() @IsIn(["MISSION_ASSIGNED", "MISSION_AVAILABLE", "TEST", "MANUAL"]) kind?: any;
  @IsOptional() @IsString() family?: string;
  @IsOptional() @IsString() serviceLabel?: string;
  /// Quartier uniquement : le contrat n'accepte pas d'adresse précise (§10).
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsInt() @Min(0) distanceMeters?: number;
  @IsOptional() @IsInt() @Min(0) payout?: number;
  @IsOptional() @IsInt() @Min(5) @Max(120) responseSeconds?: number;
  @IsOptional() @IsString() missionId?: string;
  @IsOptional() @IsString() orderId?: string;
}

export class AckDto {
  @IsIn(["PLAYED", "FAILED"]) status!: "PLAYED" | "FAILED";
  /// Motif d'échec côté appareil : TTS_UNAVAILABLE, SILENT_MODE, OFFLINE…
  @IsOptional() @IsString() error?: string;
}

/// API des annonces vocales. Un prestataire ne voit et ne modifie QUE ses
/// propres réglages et son propre journal (§10).
@Controller("voice-dispatch")
@UseGuards(JwtAuthGuard, RolesGuard)
export class VoiceDispatchController {
  constructor(private voice: VoiceDispatchService) {}

  @Get("settings")
  settings(@CurrentUser() user: AuthUser) {
    return this.voice.settings(user.id);
  }

  @Put("settings")
  update(@CurrentUser() user: AuthUser, @Body() dto: VoiceSettingsDto) {
    return this.voice.updateSettings(user.id, dto as any);
  }

  /// Annonce de test : le prestataire vérifie son volume et sa voix.
  @Post("test")
  @HttpCode(200)
  test(@CurrentUser() user: AuthUser) {
    return this.voice.test(user.id);
  }

  /// Envoi ciblé — réservé à l'administration ; le Brain, lui, appelle le
  /// service directement lorsqu'il attribue une mission.
  @Post("send")
  @Roles("ADMIN", "SUPER_ADMIN")
  @HttpCode(200)
  send(@Body() dto: SendAnnouncementDto) {
    return this.voice.announce({ ...dto, kind: dto.kind ?? "MANUAL" });
  }

  /// Accusé de lecture renvoyé par l'application (lue / échouée).
  @Post("announcements/:id/ack")
  @HttpCode(200)
  ack(@Param("id") id: string, @CurrentUser() user: AuthUser, @Body() dto: AckDto) {
    return this.voice.acknowledge(id, user.id, dto.status, dto.error);
  }

  /// Mes annonces récentes (journalisation visible par le prestataire).
  @Get("history")
  history(@CurrentUser() user: AuthUser, @Query("limit") limit?: string) {
    return this.voice.history(user.id, Number(limit ?? 30));
  }
}

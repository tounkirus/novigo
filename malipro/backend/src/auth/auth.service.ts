import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { SmsService } from "./sms.service";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/prisma/prisma.service";
import { RedisService } from "../common/redis/redis.service";
import { EmailService } from "../common/email/email.service";
import { randomBytes } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private sms: SmsService,
    private redis: RedisService,
    private email: EmailService
  ) {}

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = randomBytes(24).toString("hex");
      await this.prisma.passwordReset.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 30 * 60000) },
      });
      await this.email.sendTemplate(email, "password-reset", { token });
    }
    // Ne divulgue pas l'existence du compte.
    return { sent: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const pr = await this.prisma.passwordReset.findUnique({ where: { token } });
    if (!pr || pr.consumedAt || pr.expiresAt < new Date()) {
      throw new BadRequestException("Lien de réinitialisation invalide ou expiré.");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: pr.userId }, data: { passwordHash } });
    await this.prisma.passwordReset.update({ where: { id: pr.id }, data: { consumedAt: new Date() } });
    return { success: true };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const ttl = Number(this.config.get("JWT_REFRESH_TTL") ?? 2592000);
      await this.redis.denylist(refreshToken, ttl);
    }
    return { success: true };
  }

  private genCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private get devEcho(): boolean {
    return this.config.get("OTP_DEV_ECHO") === "true";
  }

  async register(dto: { phone: string; role?: string; firstName?: string; lastName?: string }) {
    const role = (dto.role ?? "CUSTOMER") as string;
    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: {},
      create: {
        phone: dto.phone,
        roles: [role as any],
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        status: "PENDING",
      },
    });
    // Crée le profil métier minimal si le rôle en requiert un (à compléter via POST /<domaine>/me).
    await this.ensureRoleProfile(user.id, role);
    return this.issueOtp(dto.phone);
  }

  /** Crée le profil métier (Artisan/Merchant/Driver) s'il n'existe pas encore. Idempotent. */
  private async ensureRoleProfile(userId: string, role: string) {
    if (role === "ARTISAN") {
      await this.prisma.artisan.upsert({
        where: { userId },
        update: {},
        create: { userId, profession: "À renseigner" },
      });
    } else if (role === "MERCHANT") {
      await this.prisma.merchant.upsert({
        where: { userId },
        update: {},
        create: { userId, businessName: "À renseigner" },
      });
    } else if (role === "DRIVER") {
      await this.prisma.driver.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    }
  }

  async resendOtp(phone: string) {
    return this.issueOtp(phone);
  }

  private static readonly MAX_OTP_ATTEMPTS = 5;
  private static readonly MAX_OTP_REQUESTS_PER_HOUR = 5;

  private async issueOtp(phone: string) {
    // Limitation des demandes : max N codes par heure et par numéro.
    const windowStart = new Date(Date.now() - 3600 * 1000);
    const recent = await this.prisma.otpCode.count({ where: { phone, createdAt: { gte: windowStart } } });
    if (recent >= AuthService.MAX_OTP_REQUESTS_PER_HOUR) {
      throw new BadRequestException("Trop de demandes de code. Réessayez dans une heure.");
    }
    const code = this.genCode();
    const codeHash = await bcrypt.hash(code, 10);
    const ttl = 300;
    await this.prisma.otpCode.create({
      data: { phone, codeHash, purpose: "SIGNUP", expiresAt: new Date(Date.now() + ttl * 1000) },
    });
    await this.sms.send(phone, `Votre code NOVIGO : ${code}`);
    return { otpExpiresIn: ttl, ...(this.devEcho ? { devCode: code } : {}) };
  }

  async verifyOtp(phone: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, purpose: "SIGNUP", consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) throw new UnauthorizedException("Aucun code en attente.");
    if (otp.expiresAt < new Date()) throw new UnauthorizedException("Code expiré.");
    if ((otp.attempts ?? 0) >= AuthService.MAX_OTP_ATTEMPTS) {
      await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
      throw new UnauthorizedException("Trop de tentatives. Demandez un nouveau code.");
    }
    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      const attempts = (otp.attempts ?? 0) + 1;
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts, ...(attempts >= AuthService.MAX_OTP_ATTEMPTS ? { consumedAt: new Date() } : {}) },
      });
      throw new UnauthorizedException("Code invalide.");
    }

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    const user = await this.prisma.user.update({ where: { phone }, data: { status: "ACTIVE" } });
    if (user.email) {
      this.email.sendTemplate(user.email, "welcome", { name: user.firstName ?? "" }).catch(() => undefined);
    }
    const roles = user.roles as unknown as string[];
    const tokens = await this.issueTokens({ id: user.id, phone: user.phone, roles });
    return {
      ...tokens,
      user: {
        id: user.id, phone: user.phone, firstName: user.firstName, lastName: user.lastName,
        roles, status: user.status, createdAt: user.createdAt,
      },
    };
  }

  private async issueTokens(user: { id: string; phone: string; roles: string[] }) {
    const payload = { sub: user.id, phone: user.phone, roles: user.roles };
    const accessTtl = Number(this.config.get("JWT_ACCESS_TTL") ?? 900);
    const refreshTtl = Number(this.config.get("JWT_REFRESH_TTL") ?? 2592000);
    // claim `type` requis pour l'interop avec Spring (JwtAuthFilter exige type=access) — ADR-6.
    const accessToken = await this.jwt.signAsync({ ...payload, type: "access" }, {
      secret: this.config.get("JWT_ACCESS_SECRET") ?? "change-me-access",
      expiresIn: accessTtl,
    });
    const refreshToken = await this.jwt.signAsync({ ...payload, type: "refresh" }, {
      secret: this.config.get("JWT_REFRESH_SECRET") ?? "change-me-refresh",
      expiresIn: refreshTtl,
    });
    return { accessToken, refreshToken, expiresIn: accessTtl, tokenType: "Bearer" as const };
  }

  async login(phone: string, password?: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException("Identifiants invalides.");
    if (user.passwordHash) {
      const ok = password ? await bcrypt.compare(password, user.passwordHash) : false;
      if (!ok) throw new UnauthorizedException("Identifiants invalides.");
    }
    const roles = user.roles as unknown as string[];
    const tokens = await this.issueTokens({ id: user.id, phone: user.phone, roles });
    return {
      ...tokens,
      user: {
        id: user.id, phone: user.phone, firstName: user.firstName, lastName: user.lastName,
        roles, status: user.status, createdAt: user.createdAt,
      },
    };
  }

  async refresh(refreshToken: string) {
    if (await this.redis.isDenied(refreshToken)) {
      throw new UnauthorizedException("Session révoquée.");
    }
    let payload: { sub: string; phone: string; roles: string[] };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get("JWT_REFRESH_SECRET") ?? "change-me-refresh",
      });
    } catch {
      throw new UnauthorizedException("Refresh token invalide ou expiré.");
    }
    return this.issueTokens({ id: payload.sub, phone: payload.phone, roles: payload.roles });
  }
}

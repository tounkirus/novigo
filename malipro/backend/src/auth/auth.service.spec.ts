import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";

const jwt = { signAsync: jest.fn().mockResolvedValue("token") } as any;
const config = { get: (k: string) => ({ JWT_ACCESS_TTL: 900, JWT_REFRESH_TTL: 2592000 } as any)[k] } as any;
const sms = { send: jest.fn().mockResolvedValue(undefined) } as any;
const redis = { denylist: jest.fn(), isDenied: jest.fn().mockResolvedValue(false) } as any;
const email = { sendTemplate: jest.fn().mockResolvedValue({}) } as any;

describe("AuthService.login", () => {
  const make = (user: any) =>
    new AuthService({ user: { findUnique: jest.fn().mockResolvedValue(user) } } as any, jwt, config, sms, redis, email);

  it("émet des tokens pour un utilisateur sans mot de passe", async () => {
    const res = await make({
      id: "u1", phone: "+22370000000", firstName: "Awa", lastName: "Diallo",
      passwordHash: null, roles: ["ADMIN"], status: "ACTIVE", createdAt: new Date(),
    }).login("+22370000000");
    expect(res.accessToken).toBe("token");
    expect(res.user.roles).toContain("ADMIN");
  });

  it("rejette un numéro inconnu", async () => {
    await expect(make(null).login("+22300000000")).rejects.toThrow(UnauthorizedException);
  });
});

describe("AuthService.verifyOtp", () => {
  const buildPrisma = async (opts: { expired?: boolean }) => {
    const codeHash = await bcrypt.hash("123456", 10);
    const otp = {
      id: "otp1", phone: "+22371000000", codeHash, purpose: "SIGNUP",
      attempts: 0, expiresAt: new Date(Date.now() + (opts.expired ? -1000 : 300000)), consumedAt: null,
    };
    return {
      otpCode: { findFirst: jest.fn().mockResolvedValue(otp), update: jest.fn().mockResolvedValue(otp) },
      user: {
        update: jest.fn().mockResolvedValue({
          id: "u2", phone: "+22371000000", firstName: null, lastName: null,
          roles: ["CUSTOMER"], status: "ACTIVE", createdAt: new Date(),
        }),
      },
    } as any;
  };

  it("valide un bon code et renvoie des tokens", async () => {
    const svc = new AuthService(await buildPrisma({}), jwt, config, sms, redis, email);
    const res = await svc.verifyOtp("+22371000000", "123456");
    expect(res.accessToken).toBe("token");
    expect(res.user.roles).toContain("CUSTOMER");
  });

  it("rejette un mauvais code", async () => {
    const svc = new AuthService(await buildPrisma({}), jwt, config, sms, redis, email);
    await expect(svc.verifyOtp("+22371000000", "000000")).rejects.toThrow(UnauthorizedException);
  });

  it("rejette un code expiré", async () => {
    const svc = new AuthService(await buildPrisma({ expired: true }), jwt, config, sms, redis, email);
    await expect(svc.verifyOtp("+22371000000", "123456")).rejects.toThrow(UnauthorizedException);
  });

  it("incrémente les tentatives sur mauvais code", async () => {
    const prisma = await buildPrisma({});
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    await expect(svc.verifyOtp("+22371000000", "000000")).rejects.toThrow(UnauthorizedException);
    expect(prisma.otpCode.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ attempts: 1 }) }));
  });

  it("verrouille après le maximum de tentatives", async () => {
    const prisma = await buildPrisma({});
    prisma.otpCode.findFirst.mockResolvedValue({
      id: "otp1", phone: "+22371000000", codeHash: "x", purpose: "SIGNUP",
      attempts: 5, expiresAt: new Date(Date.now() + 300000), consumedAt: null,
    });
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    await expect(svc.verifyOtp("+22371000000", "123456")).rejects.toThrow(/Trop de tentatives/);
  });
});

describe("AuthService.resetPassword", () => {
  const make = (pr: any) => new AuthService(
    { passwordReset: { findUnique: jest.fn().mockResolvedValue(pr), update: jest.fn() }, user: { update: jest.fn() } } as any,
    jwt, config, sms, redis, email);

  it("rejette un token inconnu", async () => {
    await expect(make(null).resetPassword("x", "Nouveau1!")).rejects.toThrow(BadRequestException);
  });

  it("rejette un token expiré", async () => {
    await expect(make({ id: "r1", userId: "u1", consumedAt: null, expiresAt: new Date(Date.now() - 1000) })
      .resetPassword("t", "Nouveau1!")).rejects.toThrow(BadRequestException);
  });

  it("réinitialise avec un token valide", async () => {
    const prisma = { passwordReset: { findUnique: jest.fn().mockResolvedValue({ id: "r1", userId: "u1", consumedAt: null, expiresAt: new Date(Date.now() + 60000) }), update: jest.fn() }, user: { update: jest.fn() } } as any;
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    const res = await svc.resetPassword("t", "Nouveau1!");
    expect(res.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it("rejette un token déjà consommé", async () => {
    await expect(make({ id: "r1", userId: "u1", consumedAt: new Date(), expiresAt: new Date(Date.now() + 60000) })
      .resetPassword("t", "Nouveau1!")).rejects.toThrow(BadRequestException);
  });
});

describe("AuthService.login (mot de passe)", () => {
  const make = (user: any) =>
    new AuthService({ user: { findUnique: jest.fn().mockResolvedValue(user) } } as any, jwt, config, sms, redis, email);

  it("valide un utilisateur avec bon mot de passe", async () => {
    const passwordHash = await bcrypt.hash("Secret1!", 10);
    const res = await make({
      id: "u3", phone: "+22372000000", firstName: "Ali", lastName: "Ba",
      passwordHash, roles: ["CUSTOMER"], status: "ACTIVE", createdAt: new Date(),
    }).login("+22372000000", "Secret1!");
    expect(res.accessToken).toBe("token");
  });

  it("rejette un mauvais mot de passe", async () => {
    const passwordHash = await bcrypt.hash("Secret1!", 10);
    await expect(make({
      id: "u3", phone: "+22372000000", passwordHash, roles: ["CUSTOMER"], status: "ACTIVE", createdAt: new Date(),
    }).login("+22372000000", "Wrong")).rejects.toThrow(UnauthorizedException);
  });

  it("rejette quand un mot de passe est requis mais absent", async () => {
    const passwordHash = await bcrypt.hash("Secret1!", 10);
    await expect(make({
      id: "u3", phone: "+22372000000", passwordHash, roles: ["CUSTOMER"], status: "ACTIVE", createdAt: new Date(),
    }).login("+22372000000")).rejects.toThrow(UnauthorizedException);
  });
});

describe("AuthService.verifyOtp (cas supplémentaires)", () => {
  it("rejette quand aucun code n'est en attente", async () => {
    const prisma = { otpCode: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    await expect(svc.verifyOtp("+22371000000", "123456")).rejects.toThrow(/Aucun code/);
  });

  it("verrouille (consumedAt) quand le mauvais code atteint le maximum", async () => {
    const codeHash = await bcrypt.hash("123456", 10);
    const prisma = {
      otpCode: {
        findFirst: jest.fn().mockResolvedValue({
          id: "otp1", phone: "+22371000000", codeHash, purpose: "SIGNUP",
          attempts: 4, expiresAt: new Date(Date.now() + 300000), consumedAt: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    await expect(svc.verifyOtp("+22371000000", "000000")).rejects.toThrow(/Code invalide/);
    expect(prisma.otpCode.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attempts: 5, consumedAt: expect.any(Date) }) }));
  });

  it("envoie l'email de bienvenue quand l'utilisateur a un email", async () => {
    const codeHash = await bcrypt.hash("123456", 10);
    const welcome = { sendTemplate: jest.fn().mockResolvedValue({}) } as any;
    const prisma = {
      otpCode: {
        findFirst: jest.fn().mockResolvedValue({
          id: "otp1", phone: "+22371000000", codeHash, purpose: "SIGNUP",
          attempts: 0, expiresAt: new Date(Date.now() + 300000), consumedAt: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        update: jest.fn().mockResolvedValue({
          id: "u2", phone: "+22371000000", email: "a@b.ml", firstName: "Awa", lastName: null,
          roles: ["CUSTOMER"], status: "ACTIVE", createdAt: new Date(),
        }),
      },
    } as any;
    const svc = new AuthService(prisma, jwt, config, sms, redis, welcome);
    const res = await svc.verifyOtp("+22371000000", "123456");
    expect(res.accessToken).toBe("token");
    expect(welcome.sendTemplate).toHaveBeenCalledWith("a@b.ml", "welcome", expect.any(Object));
  });
});

describe("AuthService.forgotPassword", () => {
  it("crée un token et envoie l'email si l'utilisateur existe", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: "u1", email: "a@b.ml" }) },
      passwordReset: { create: jest.fn().mockResolvedValue({}) },
    } as any;
    const mail = { sendTemplate: jest.fn().mockResolvedValue({}) } as any;
    const svc = new AuthService(prisma, jwt, config, sms, redis, mail);
    const res = await svc.forgotPassword("a@b.ml");
    expect(res).toEqual({ sent: true });
    expect(prisma.passwordReset.create).toHaveBeenCalled();
    expect(mail.sendTemplate).toHaveBeenCalledWith("a@b.ml", "password-reset", expect.any(Object));
  });

  it("ne divulgue pas l'absence de compte", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      passwordReset: { create: jest.fn() },
    } as any;
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    const res = await svc.forgotPassword("inconnu@b.ml");
    expect(res).toEqual({ sent: true });
    expect(prisma.passwordReset.create).not.toHaveBeenCalled();
  });
});

describe("AuthService.logout", () => {
  it("dényliste le refresh token fourni", async () => {
    const r = { denylist: jest.fn().mockResolvedValue(undefined) } as any;
    const svc = new AuthService({} as any, jwt, config, sms, r, email);
    const res = await svc.logout("rt-123");
    expect(res).toEqual({ success: true });
    expect(r.denylist).toHaveBeenCalledWith("rt-123", 2592000);
  });

  it("ne fait rien sans refresh token", async () => {
    const r = { denylist: jest.fn() } as any;
    const svc = new AuthService({} as any, jwt, config, sms, r, email);
    const res = await svc.logout();
    expect(res).toEqual({ success: true });
    expect(r.denylist).not.toHaveBeenCalled();
  });
});

describe("AuthService.refresh", () => {
  it("émet de nouveaux tokens pour un refresh valide", async () => {
    const j = { signAsync: jest.fn().mockResolvedValue("token"), verifyAsync: jest.fn().mockResolvedValue({ sub: "u1", phone: "+223", roles: ["CUSTOMER"] }) } as any;
    const r = { isDenied: jest.fn().mockResolvedValue(false) } as any;
    const svc = new AuthService({} as any, j, config, sms, r, email);
    const res = await svc.refresh("rt-ok");
    expect(res.accessToken).toBe("token");
    expect(res.tokenType).toBe("Bearer");
  });

  it("rejette un refresh token révoqué (denylist)", async () => {
    const r = { isDenied: jest.fn().mockResolvedValue(true) } as any;
    const svc = new AuthService({} as any, jwt, config, sms, r, email);
    await expect(svc.refresh("rt-denied")).rejects.toThrow(/révoquée/);
  });

  it("rejette un refresh token invalide", async () => {
    const j = { verifyAsync: jest.fn().mockRejectedValue(new Error("bad")) } as any;
    const r = { isDenied: jest.fn().mockResolvedValue(false) } as any;
    const svc = new AuthService({} as any, j, config, sms, r, email);
    await expect(svc.refresh("rt-bad")).rejects.toThrow(UnauthorizedException);
  });
});

describe("AuthService.register / resendOtp / issueOtp", () => {
  const otpPrisma = (extra: any = {}) => ({
    user: { upsert: jest.fn().mockResolvedValue({ id: "u1", phone: "+22373000000" }) },
    otpCode: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({}) },
    artisan: { upsert: jest.fn().mockResolvedValue({}) },
    merchant: { upsert: jest.fn().mockResolvedValue({}) },
    driver: { upsert: jest.fn().mockResolvedValue({}) },
    ...extra,
  }) as any;

  it("inscrit un CUSTOMER par défaut et émet un OTP", async () => {
    const prisma = otpPrisma();
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    const res = await svc.register({ phone: "+22373000000" });
    expect(res.otpExpiresIn).toBe(300);
    expect(prisma.otpCode.create).toHaveBeenCalled();
    expect(sms.send).toHaveBeenCalled();
    expect(prisma.artisan.upsert).not.toHaveBeenCalled();
  });

  it("crée le profil ARTISAN", async () => {
    const prisma = otpPrisma();
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    await svc.register({ phone: "+22373000000", role: "ARTISAN", firstName: "A", lastName: "B" });
    expect(prisma.artisan.upsert).toHaveBeenCalled();
  });

  it("crée le profil MERCHANT", async () => {
    const prisma = otpPrisma();
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    await svc.register({ phone: "+22373000000", role: "MERCHANT" });
    expect(prisma.merchant.upsert).toHaveBeenCalled();
  });

  it("crée le profil DRIVER", async () => {
    const prisma = otpPrisma();
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    await svc.register({ phone: "+22373000000", role: "DRIVER" });
    expect(prisma.driver.upsert).toHaveBeenCalled();
  });

  it("resendOtp émet un nouveau code", async () => {
    const prisma = otpPrisma();
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    const res = await svc.resendOtp("+22373000000");
    expect(res.otpExpiresIn).toBe(300);
    expect(prisma.otpCode.create).toHaveBeenCalled();
  });

  it("rejette au-delà de la limite de demandes par heure", async () => {
    const prisma = otpPrisma({ otpCode: { count: jest.fn().mockResolvedValue(5), create: jest.fn() } });
    const svc = new AuthService(prisma, jwt, config, sms, redis, email);
    await expect(svc.resendOtp("+22373000000")).rejects.toThrow(/Trop de demandes/);
  });

  it("renvoie devCode quand OTP_DEV_ECHO=true", async () => {
    const prisma = otpPrisma();
    const echoConfig = { get: (k: string) => (k === "OTP_DEV_ECHO" ? "true" : undefined) } as any;
    const svc = new AuthService(prisma, jwt, echoConfig, sms, redis, email);
    const res: any = await svc.resendOtp("+22373000000");
    expect(res.devCode).toMatch(/^\d{6}$/);
  });
});

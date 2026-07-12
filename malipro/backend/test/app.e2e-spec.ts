import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { prismaMock } from "./mocks/prisma.mock";
import { StorageService } from "../src/common/storage/storage.service";

const SECRET = "test-access-secret";
process.env.JWT_ACCESS_SECRET = SECRET;
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.OTP_DEV_ECHO = "true";

describe("NOVIGO API (e2e)", () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const storageMock = { upload: async () => "http://minio.local/novigo/photos/x" };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(StorageService)
      .useValue(storageMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["metrics", "health", "health/ready"] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    jwt = app.get(JwtService);
    await app.init();
  });

  afterAll(async () => app?.close());

  it("GET /health -> enveloppe success", async () => {
    const res = await request(app.getHttpServer()).get("/health").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("POST /api/v1/auth/login (valide) -> tokens", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ phone: "+22370000000" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.roles).toContain("ADMIN");
  });

  it("POST /api/v1/auth/login (numéro inconnu) -> 401 enveloppe", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ phone: "+22399999999" })
      .expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/auth/login (payload invalide) -> 400/422", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ phone: "invalide" });
    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/admin/orders sans token -> 401", async () => {
    await request(app.getHttpServer()).get("/api/v1/admin/orders").expect(401);
  });

  it("GET /api/v1/admin/orders avec rôle CUSTOMER -> 403 (RBAC)", async () => {
    const token = await jwt.signAsync(
      { sub: "u2", phone: "+22371000000", roles: ["CUSTOMER"] },
      { secret: SECRET }
    );
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/orders")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
  it("POST /api/v1/auth/register puis /verify-otp -> tokens (flux OTP)", async () => {
    const reg = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ phone: "+22377000000", role: "CUSTOMER" })
      .expect(201);
    expect(reg.body.success).toBe(true);
    const code = reg.body.data.devCode as string;
    expect(code).toMatch(/^[0-9]{6}$/);

    const verify = await request(app.getHttpServer())
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+22377000000", code })
      .expect(200);
    expect(verify.body.data.accessToken).toBeDefined();
    expect(verify.body.data.user.roles).toContain("CUSTOMER");
  });

  it("POST /api/v1/auth/verify-otp avec mauvais code -> 401", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ phone: "+22378000000", role: "CUSTOMER" })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+22378000000", code: "000000" })
      .expect(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
  it("PATCH /api/v1/users/me met à jour le profil", async () => {
    const token = await jwt.signAsync(
      { sub: "u-admin", phone: "+22370000000", roles: ["ADMIN"] }, { secret: SECRET });
    const res = await request(app.getHttpServer())
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Awa2" })
      .expect(200);
    expect(res.body.data.firstName).toBe("Awa2");
  });

  it("adresses : création puis liste", async () => {
    const token = await jwt.signAsync(
      { sub: "u-admin", phone: "+22370000000", roles: ["ADMIN"] }, { secret: SECRET });
    await request(app.getHttpServer())
      .post("/api/v1/users/me/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send({ line1: "Rue 224", city: "Bamako", isDefault: true })
      .expect(201);
    const list = await request(app.getHttpServer())
      .get("/api/v1/users/me/addresses")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(list.body.data.length).toBeGreaterThan(0);
    expect(list.body.data[0].city).toBe("Bamako");
  });

  it("favoris : ajout idempotent", async () => {
    const token = await jwt.signAsync(
      { sub: "u-admin", phone: "+22370000000", roles: ["ADMIN"] }, { secret: SECRET });
    const body = { targetType: "PRODUCT", targetId: "p1" };
    await request(app.getHttpServer()).post("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${token}`).send(body).expect(201);
    await request(app.getHttpServer()).post("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${token}`).send(body).expect(201);
    const list = await request(app.getHttpServer()).get("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${token}`).expect(200);
    expect(list.body.data.length).toBe(1);
  });
  it("POST /api/v1/users/me/photo -> photoUrl (stockage mocké)", async () => {
    const token = await jwt.signAsync(
      { sub: "u-admin", phone: "+22370000000", roles: ["ADMIN"] }, { secret: SECRET });
    const res = await request(app.getHttpServer())
      .post("/api/v1/users/me/photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from([1, 2, 3, 4]), "photo.png")
      .expect(201);
    expect(res.body.data.photoUrl).toContain("http");
  });
});

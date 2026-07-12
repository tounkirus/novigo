// Mock Prisma stateful minimal pour les tests e2e (pas de base requise).
const now = () => new Date();

const ADMIN = {
  id: "u-admin", phone: "+22370000000", firstName: "Awa", lastName: "Diallo",
  email: null, passwordHash: null, roles: ["ADMIN", "SUPER_ADMIN"], status: "ACTIVE",
  locale: "fr", createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: now(),
};

const users: any[] = [ADMIN];
const otpCodes: any[] = [];
const addresses: any[] = [];
const favorites: any[] = [];
let seq = 0;

export const prismaMock: any = {
  $connect: async () => {},
  $disconnect: async () => {},
  user: {
    findUnique: async ({ where }: any) =>
      users.find((u) => (where.phone && u.phone === where.phone) || (where.id && u.id === where.id)) ?? null,
    upsert: async ({ where, create }: any) => {
      let u = users.find((x) => x.phone === where.phone);
      if (!u) {
        u = { id: `u-${++seq}`, email: null, passwordHash: null, locale: "fr",
              createdAt: now(), updatedAt: now(), ...create };
        users.push(u);
      }
      return u;
    },
    update: async ({ where, data }: any) => {
      const u = users.find((x) => (where.phone && x.phone === where.phone) || (where.id && x.id === where.id));
      Object.assign(u, data, { updatedAt: now() });
      return u;
    },
  },
  address: {
    findMany: async ({ where }: any) => addresses.filter((a) => a.userId === where.userId),
    count: async ({ where }: any) => addresses.filter((a) => a.userId === where.userId).length,
    findUnique: async ({ where }: any) => addresses.find((a) => a.id === where.id) ?? null,
    create: async ({ data }: any) => { const a = { id: `addr-${++seq}`, createdAt: now(), ...data }; addresses.push(a); return a; },
    update: async ({ where, data }: any) => { const a = addresses.find((x) => x.id === where.id); Object.assign(a, data); return a; },
    updateMany: async ({ where, data }: any) => { addresses.filter((a) => a.userId === where.userId).forEach((a) => Object.assign(a, data)); return { count: 0 }; },
    delete: async ({ where }: any) => { const i = addresses.findIndex((a) => a.id === where.id); return addresses.splice(i, 1)[0]; },
  },
  favorite: {
    findMany: async ({ where }: any) => favorites.filter((f) => f.userId === where.userId),
    count: async ({ where }: any) => favorites.filter((f) => f.userId === where.userId).length,
    findUnique: async ({ where }: any) => favorites.find((f) => f.id === where.id) ?? null,
    upsert: async ({ where, create }: any) => {
      const k = where.userId_targetType_targetId;
      let f = favorites.find((x) => x.userId === k.userId && x.targetType === k.targetType && x.targetId === k.targetId);
      if (!f) { f = { id: `fav-${++seq}`, createdAt: now(), ...create }; favorites.push(f); }
      return f;
    },
    delete: async ({ where }: any) => { const i = favorites.findIndex((f) => f.id === where.id); return favorites.splice(i, 1)[0]; },
  },
  otpCode: {
    count: async ({ where }: any) => {
      const since = where?.createdAt?.gte ? new Date(where.createdAt.gte).getTime() : 0;
      return otpCodes.filter((o) => o.phone === where.phone && o.createdAt >= since).length;
    },
    create: async ({ data }: any) => {
      const rec = { id: `otp-${++seq}`, consumedAt: null, attempts: 0, createdAt: now(), ...data };
      otpCodes.push(rec);
      return rec;
    },
    findFirst: async ({ where }: any) => {
      const list = otpCodes
        .filter((o) => o.phone === where.phone && o.purpose === where.purpose && o.consumedAt === null)
        .sort((a, b) => b.createdAt - a.createdAt);
      return list[0] ?? null;
    },
    update: async ({ where, data }: any) => {
      const o = otpCodes.find((x) => x.id === where.id);
      Object.assign(o, data);
      return o;
    },
  },
};

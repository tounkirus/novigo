// Prisma en mémoire pour les tests du Brain : il ne simule que ce que les moteurs
// utilisent réellement. Un test qui a besoin de plus doit l'ajouter ici plutôt que
// de stubber au cas par cas dans chaque fichier de test.

type Row = Record<string, any>;

const matches = (row: Row, where: Row = {}): boolean =>
  Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return (cond as Row[]).some((c) => matches(row, c));
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      if ("in" in cond) return (cond.in as any[]).includes(row[key]);
      if ("gte" in cond) return new Date(row[key]).getTime() >= new Date(cond.gte).getTime();
      if ("not" in cond) return row[key] !== cond.not;
    }
    return row[key] === cond;
  });

function table(seed: Row[] = [], keyFields: string[] = ["id"]) {
  const rows: Row[] = [...seed];
  let seq = rows.length;
  const findBy = (where: Row) => {
    const flat: Row = {};
    for (const [k, v] of Object.entries(where)) {
      if (v && typeof v === "object" && keyFields.length > 1 && !("in" in v) && !("gte" in v)) {
        Object.assign(flat, v); // clé composite : { a_b: { a, b } }
      } else flat[k] = v;
    }
    return rows.find((r) => matches(r, flat));
  };
  return {
    rows,
    create: jest.fn(async ({ data }: any) => {
      const row = { id: data.id ?? `row-${++seq}`, createdAt: new Date(), updatedAt: new Date(), ...data };
      rows.push(row);
      return row;
    }),
    findUnique: jest.fn(async ({ where }: any) => findBy(where) ?? null),
    findFirst: jest.fn(async ({ where }: any) => rows.find((r) => matches(r, where)) ?? null),
    findMany: jest.fn(async ({ where, take }: any = {}) => {
      const out = rows.filter((r) => matches(r, where ?? {}));
      return take ? out.slice(0, take) : out;
    }),
    count: jest.fn(async ({ where }: any = {}) => rows.filter((r) => matches(r, where ?? {})).length),
    update: jest.fn(async ({ where, data }: any) => {
      const row = findBy(where);
      if (!row) throw new Error("row not found");
      for (const [k, v] of Object.entries(data)) {
        row[k] = v && typeof v === "object" && "increment" in (v as Row)
          ? (row[k] ?? 0) + (v as Row).increment
          : v;
      }
      return row;
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      const hit = rows.filter((r) => matches(r, where ?? {}));
      hit.forEach((r) => Object.assign(r, data));
      return { count: hit.length };
    }),
    upsert: jest.fn(async ({ where, create, update }: any) => {
      const row = findBy(where);
      if (!row) {
        const created = { id: `row-${++seq}`, updatedAt: new Date(), ...create };
        rows.push(created);
        return created;
      }
      for (const [k, v] of Object.entries(update)) {
        row[k] = v && typeof v === "object" && "increment" in (v as Row)
          ? (row[k] ?? 0) + (v as Row).increment
          : v;
      }
      return row;
    }),
    groupBy: jest.fn(async ({ by }: any) => {
      const groups = new Map<string, number>();
      rows.forEach((r) => groups.set(r[by[0]], (groups.get(r[by[0]]) ?? 0) + 1));
      return [...groups.entries()].map(([value, count]) => ({ [by[0]]: value, _count: { _all: count } }));
    }),
    aggregate: jest.fn(async () => ({ _sum: { samples: rows.reduce((s, r) => s + (r.samples ?? 0), 0) } })),
  };
}

export function fakePrisma(seed: Partial<Record<string, Row[]>> = {}) {
  return {
    mission: table(seed.mission),
    missionEvent: table(seed.missionEvent),
    brainDecision: table(seed.brainDecision),
    trustScore: table(seed.trustScore, ["subjectId", "subjectType"]),
    fraudSignal: table(seed.fraudSignal),
    knowledgeEntry: table(seed.knowledgeEntry, ["scope", "key", "metric"]),
    servicePolicy: table(seed.servicePolicy, ["key"]),
    driver: table(seed.driver, ["id", "userId"]),
    artisan: table(seed.artisan, ["id", "userId"]),
    store: table(seed.store),
    merchant: table(seed.merchant, ["id", "userId"]),
    user: table(seed.user),
    voiceSettings: table(seed.voiceSettings, ["partnerId"]),
    voiceAnnouncement: table(seed.voiceAnnouncement),
    deviceToken: table(seed.deviceToken),
  } as any;
}

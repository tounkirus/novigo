import { OrangeMoneyProvider } from "./orange-money.provider";
import { WaveProvider } from "./wave.provider";
import { PaymentProviderRegistry } from "./provider-registry";
import { createHmac } from "crypto";

/// Fabrique un ConfigService factice à partir d'une table clé/valeur.
const cfg = (map: Record<string, any> = {}) => ({ get: (k: string) => map[k] }) as any;

/// Remplace fetch par une file de réponses successives.
function mockFetch(responses: Array<{ ok?: boolean; status?: number; json: any }>) {
  const queue = [...responses];
  (global as any).fetch = jest.fn(async () => {
    const r = queue.shift() ?? { json: {} };
    return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.json } as any;
  });
  return (global as any).fetch as jest.Mock;
}

afterEach(() => { jest.restoreAllMocks(); delete (global as any).fetch; });

describe("OrangeMoneyProvider", () => {
  const configured = {
    ORANGE_MONEY_CLIENT_ID: "id", ORANGE_MONEY_CLIENT_SECRET: "secret",
    ORANGE_MONEY_BASE_URL: "https://om.test",
  };

  it("initiate en sandbox (sans identifiants) renvoie une instruction #144#", async () => {
    const p = new OrangeMoneyProvider(cfg());
    const r = await p.initiate({ amount: 5000, currency: "XOF", phone: "+22370", reference: "CMD-1" });
    expect(r.providerRef).toMatch(/^OM-/);
    expect(r.instruction).toContain("144");
  });

  it("initiate configuré : OAuth puis webpayment, renvoie pay_token + url", async () => {
    const f = mockFetch([
      { json: { access_token: "tok" } },
      { json: { pay_token: "PT-1", payment_url: "https://pay/x" } },
    ]);
    const p = new OrangeMoneyProvider(cfg(configured));
    const r = await p.initiate({ amount: 5000, currency: "XOF", phone: "+22370", reference: "CMD-1" });
    expect(f).toHaveBeenCalledTimes(2);
    expect(r.providerRef).toBe("PT-1");
    expect(r.instruction).toContain("https://pay/x");
  });

  it("initiate configuré : jette si l'OAuth échoue", async () => {
    mockFetch([{ ok: false, status: 500, json: {} }]);
    const p = new OrangeMoneyProvider(cfg(configured));
    await expect(p.initiate({ amount: 1, currency: "XOF", phone: "+1", reference: "r" })).rejects.toThrow();
  });

  it("refund non configuré -> ok:false provider_not_configured", async () => {
    const r = await new OrangeMoneyProvider(cfg()).refund("OM-1", 100, "XOF");
    expect(r).toEqual({ ok: false, reason: "provider_not_configured" });
  });

  it("refund configuré : succès", async () => {
    mockFetch([{ json: { access_token: "tok" } }, { json: { refund_id: "RF-1" } }]);
    const r = await new OrangeMoneyProvider(cfg(configured)).refund("OM-1", 100, "XOF");
    expect(r.ok).toBe(true);
    expect(r.providerRef).toBe("RF-1");
  });

  it("refund configuré : statut opérateur non-OK -> ok:false", async () => {
    mockFetch([{ json: { access_token: "tok" } }, { ok: false, status: 422, json: { msg: "x" } }]);
    const r = await new OrangeMoneyProvider(cfg(configured)).refund("OM-1", 100, "XOF");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("provider_status_422");
  });

  it("refund configuré : exception réseau -> provider_error", async () => {
    (global as any).fetch = jest.fn(async () => { throw new Error("net"); });
    const r = await new OrangeMoneyProvider(cfg(configured)).refund("OM-1", 100, "XOF");
    expect(r).toEqual({ ok: false, providerRef: "OM-1", reason: "provider_error" });
  });

  it("fetchProviderTransactions non configuré -> null", async () => {
    expect(await new OrangeMoneyProvider(cfg()).fetchProviderTransactions()).toBeNull();
  });

  it("fetchProviderTransactions configuré : mappe les lignes", async () => {
    mockFetch([
      { json: { access_token: "tok" } },
      { json: { transactions: [
        { order_id: "OM-1", amount: 5000, currency: "XOF", status: "SUCCESS", date: "2026-01-01" },
        { order_id: "OM-2", amount: 300, status: "PENDING" },
        { order_id: "OM-3", amount: 100, status: "REJECTED" },
      ] } },
    ]);
    const rows = await new OrangeMoneyProvider(cfg(configured)).fetchProviderTransactions(new Date(0), new Date(1));
    expect(rows).toHaveLength(3);
    expect(rows![0]).toMatchObject({ providerRef: "OM-1", amount: 5000, status: "SUCCEEDED" });
    expect(rows![1].status).toBe("PENDING");
    expect(rows![2].status).toBe("FAILED");
  });

  it("fetchProviderTransactions : erreur -> null", async () => {
    mockFetch([{ json: { access_token: "tok" } }, { ok: false, status: 500, json: {} }]);
    expect(await new OrangeMoneyProvider(cfg(configured)).fetchProviderTransactions()).toBeNull();
  });

  it("parseWebhook et verifySignature (HMAC)", () => {
    const secret = "sec";
    const p = new OrangeMoneyProvider(cfg({ ORANGE_MONEY_WEBHOOK_SECRET: secret }));
    expect(p.parseWebhook({ status: "PAID", reference: "OM-1" })).toEqual({ providerRef: "OM-1", status: "SUCCEEDED" });
    expect(p.parseWebhook({ status: "NOPE", reference: "OM-1" }).status).toBe("FAILED");
    const body = '{"a":1}';
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(p.verifySignature(body, sig)).toBe(true);
    expect(p.verifySignature(body, "bad")).toBe(false);
    expect(p.verifySignature(body, undefined)).toBe(false);
  });

  it("verifySignature sans secret -> accepte (dev)", () => {
    expect(new OrangeMoneyProvider(cfg()).verifySignature("x", undefined)).toBe(true);
  });
});

describe("WaveProvider", () => {
  const configured = { WAVE_API_KEY: "key", WAVE_BASE_URL: "https://wave.test" };

  it("initiate sandbox (sans clé) -> instruction app Wave", async () => {
    const r = await new WaveProvider(cfg()).initiate({ amount: 2000, currency: "XOF", phone: "+1", reference: "CMD-2" });
    expect(r.providerRef).toMatch(/^WV-/);
    expect(r.instruction).toContain("Wave");
  });

  it("initiate configuré : session checkout -> launch url", async () => {
    mockFetch([{ json: { id: "WV-1", wave_launch_url: "https://wave/pay" } }]);
    const r = await new WaveProvider(cfg(configured)).initiate({ amount: 2000, currency: "XOF", phone: "+1", reference: "CMD-2" });
    expect(r.providerRef).toBe("WV-1");
    expect(r.instruction).toContain("https://wave/pay");
  });

  it("initiate configuré : exception -> rejette", async () => {
    (global as any).fetch = jest.fn(async () => { throw new Error("net"); });
    await expect(new WaveProvider(cfg(configured)).initiate({ amount: 1, currency: "XOF", phone: "+1", reference: "r" })).rejects.toThrow();
  });

  it("refund non configuré -> provider_not_configured", async () => {
    expect(await new WaveProvider(cfg()).refund("WV-1", 100, "XOF")).toEqual({ ok: false, reason: "provider_not_configured" });
  });

  it("refund configuré : succès puis échec statut", async () => {
    mockFetch([{ json: { ok: true } }]);
    expect((await new WaveProvider(cfg(configured)).refund("WV-1", 100, "XOF")).ok).toBe(true);
    mockFetch([{ ok: false, status: 400, json: {} }]);
    const r2 = await new WaveProvider(cfg(configured)).refund("WV-1", 100, "XOF");
    expect(r2.ok).toBe(false);
    expect(r2.reason).toBe("provider_status_400");
  });

  it("refund configuré : exception -> provider_error", async () => {
    (global as any).fetch = jest.fn(async () => { throw new Error("net"); });
    expect((await new WaveProvider(cfg(configured)).refund("WV-1", 100, "XOF")).reason).toBe("provider_error");
  });

  it("fetchProviderTransactions non configuré -> null ; configuré -> mappe", async () => {
    expect(await new WaveProvider(cfg()).fetchProviderTransactions()).toBeNull();
    mockFetch([{ json: { items: [
      { client_reference: "WV-1", amount: 2000, currency: "XOF", status: "COMPLETED", when_created: "2026-01-01" },
      { id: "WV-2", amount: 5, status: "pending" },
    ] } }]);
    const rows = await new WaveProvider(cfg(configured)).fetchProviderTransactions(new Date(0), new Date(1));
    expect(rows).toHaveLength(2);
    expect(rows![0]).toMatchObject({ providerRef: "WV-1", status: "SUCCEEDED" });
    expect(rows![1].status).toBe("PENDING");
  });

  it("fetchProviderTransactions erreur -> null", async () => {
    mockFetch([{ ok: false, status: 500, json: {} }]);
    expect(await new WaveProvider(cfg(configured)).fetchProviderTransactions()).toBeNull();
  });

  it("parseWebhook / verifySignature", () => {
    const p = new WaveProvider(cfg());
    expect(p.parseWebhook({ status: "completed", client_reference: "WV-1" })).toEqual({ providerRef: "WV-1", status: "SUCCEEDED" });
    expect(p.parseWebhook({ status: "x", id: "WV-9" })).toEqual({ providerRef: "WV-9", status: "FAILED" });
    expect(p.verifySignature("x", undefined)).toBe(true); // dev sans secret
  });
});

describe("PaymentProviderRegistry", () => {
  const orange = new OrangeMoneyProvider(cfg());
  const wave = new WaveProvider(cfg());
  const reg = new PaymentProviderRegistry(orange, wave);

  it("byMethod résout Orange/Wave et rejette l'inconnu", () => {
    expect(reg.byMethod("ORANGE_MONEY")).toBe(orange);
    expect(reg.byMethod("WAVE")).toBe(wave);
    expect(() => reg.byMethod("BITCOIN")).toThrow();
  });

  it("byName tolère les variantes et rejette l'inconnu", () => {
    expect(reg.byName("orange-money")).toBe(orange);
    expect(reg.byName("orange_money")).toBe(orange);
    expect(reg.byName("WAVE")).toBe(wave);
    expect(() => reg.byName("paypal")).toThrow();
  });
});

describe("PaymentProvider (défauts de la classe abstraite)", () => {
  it("refund/fetchProviderTransactions par défaut sur un provider non surchargé", async () => {
    // WaveProvider surcharge ; on teste les défauts via un provider minimal.
    const { PaymentProvider } = require("./payment-provider");
    class Bare extends PaymentProvider {
      method = "WAVE" as const;
      async initiate() { return { providerRef: "x", instruction: "y" }; }
      parseWebhook() { return { providerRef: "x", status: "FAILED" as const }; }
      verifySignature() { return true; }
    }
    const b = new Bare();
    expect(await b.refund("r", 1, "XOF")).toEqual({ ok: false, reason: "refund_not_supported" });
    expect(await b.fetchProviderTransactions()).toBeNull();
  });
});

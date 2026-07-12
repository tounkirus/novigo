import { Page } from "@playwright/test";

// Réponses conformes au contrat OpenAPI de NOVIGO (enveloppes success/data/meta).
export const ADMIN_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  phone: "+22370000000",
  firstName: "Awa",
  lastName: "Diallo",
  roles: ["ADMIN"],
  status: "ACTIVE",
  createdAt: "2026-01-05T09:00:00Z",
};

const TOKENS = {
  accessToken: "test-access",
  refreshToken: "test-refresh",
  expiresIn: 900,
  tokenType: "Bearer",
  user: ADMIN_USER,
};

const KPIS = {
  gmv: { amount: 18_450_000, currency: "XOF" },
  ordersCount: 3421,
  activeDrivers: 128,
  newCustomers: 274,
  avgDeliveryMinutes: 31.4,
};

function order(i: number) {
  const statuses = ["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
  return {
    id: `order-${i}`,
    reference: `MLP-2026-${String(i).padStart(6, "0")}`,
    customerId: "cust-1",
    type: "FOOD",
    status: statuses[i % statuses.length],
    paymentMethod: "ORANGE_MONEY",
    total: { amount: 2500 + i * 100, currency: "XOF" },
    createdAt: "2026-07-01T12:00:00Z",
  };
}

function paginated<T>(items: T[], page = 1, limit = 20, total = 137) {
  return {
    success: true,
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Installe l'interception réseau. `authFail` simule un identifiant refusé.
export async function mockApi(page: Page, opts: { authFail?: boolean } = {}) {
  // État simulé du KYC par livreur : une validation POST se reflète sur le GET suivant
  // (mock avec état, pour que la revalidation react-query mette bien à jour le statut).
  const driverKyc = new Map<string, string>();
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "");
    const method = route.request().method();
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path === "/auth/login" && method === "POST") {
      if (opts.authFail)
        return json(401, { success: false, error: { code: "UNAUTHORIZED", message: "Identifiants invalides.", status: 401 } });
      return json(200, { success: true, data: TOKENS });
    }
    if (path === "/users/me") return json(200, { success: true, data: ADMIN_USER });
    if (path === "/auth/logout") return json(204, {});
    if (path === "/analytics/kpis") return json(200, { success: true, data: KPIS });

    const orderMatch = path.match(/^\/orders\/([^/]+)$/);
    if (orderMatch && method === "GET") {
      const id = orderMatch[1];
      return json(200, { success: true, data: {
        id, reference: "MLP-2026-000042", customerId: "cust-1", type: "FOOD",
        status: "IN_TRANSIT", paymentMethod: "ORANGE_MONEY",
        items: [
          { productId: "p1", name: "Poulet braisé", quantity: 2, unitPrice: { amount: 3000, currency: "XOF" } },
          { productId: "p2", name: "Attiéké", quantity: 1, unitPrice: { amount: 1000, currency: "XOF" } },
        ],
        deliveryAddress: { line1: "Rue 224, Porte 58", district: "Hamdallaye ACI 2000", city: "Bamako" },
        subtotal: { amount: 7000, currency: "XOF" },
        deliveryFee: { amount: 1000, currency: "XOF" },
        total: { amount: 8000, currency: "XOF" },
        createdAt: "2026-07-01T12:00:00Z",
      }});
    }
    const trackMatch = path.match(/^\/orders\/([^/]+)\/tracking$/);
    if (trackMatch) {
      return json(200, { success: true, data: {
        orderId: trackMatch[1], status: "IN_TRANSIT",
        driverLocation: { lat: 12.6392, lng: -8.0029 }, etaMinutes: 12,
      }});
    }
    if (path === "/admin/orders") {
      const page = Number(url.searchParams.get("page") ?? "1");
      const status = url.searchParams.get("status");
      let items = Array.from({ length: 20 }, (_, i) => order((page - 1) * 20 + i + 1));
      if (status) items = items.map((o) => ({ ...o, status }));
      return json(200, paginated(items, page));
    }
    if (path === "/admin/payments")
      return json(200, paginated(Array.from({ length: 20 }, (_, i) => ({
        id: `pay-${i}`, userId: "u1", method: "WAVE", status: "SUCCEEDED",
        amount: { amount: 3000 + i * 50, currency: "XOF" }, providerRef: `WV-${i}`,
        createdAt: "2026-07-01T12:00:00Z",
      }))));
    if (path === "/admin/users")
      return json(200, paginated([ADMIN_USER]));
    if (path === "/admin/audit-logs")
      return json(200, paginated([{
        id: "log-1", actorId: "00000000-0000-0000-0000-000000000001",
        action: "DRIVER_VALIDATED", entityType: "Driver", ip: "196.0.0.1",
        createdAt: "2026-07-01T12:00:00Z",
      }]));

    if (path === "/admin/commissions" && method === "GET") {
      return json(200, { success: true, data: {
        deliveryPercent: 12.5, merchantPercent: 15, artisanPercent: 10,
        updatedAt: "2026-06-30T08:00:00Z",
      }});
    }
    if (path === "/admin/commissions" && method === "PATCH") {
      const body = route.request().postDataJSON();
      return json(200, { success: true, data: { ...body, updatedAt: "2026-07-04T09:00:00Z" } });
    }
    if (path === "/payments/reconciliation") {
      const provider = url.searchParams.get("provider") ?? "ORANGE_MONEY";
      return json(200, { success: true, data: {
        provider,
        summary: {
          internalTotal: { amount: 1250000, currency: "XOF" },
          providerTotal: { amount: 1247500, currency: "XOF" },
          difference: { amount: 2500, currency: "XOF" },
          matched: 128, discrepancies: 2,
        },
        lines: [
          { internalRef: "MLP-PAY-8842", providerRef: "OM-TX-99182", provider,
            internalAmount: { amount: 5000, currency: "XOF" }, providerAmount: { amount: 5000, currency: "XOF" },
            status: "MATCHED", occurredAt: "2026-07-01T10:00:00Z" },
          { internalRef: "MLP-PAY-8843", providerRef: "OM-TX-99183", provider,
            internalAmount: { amount: 7500, currency: "XOF" }, providerAmount: { amount: 5000, currency: "XOF" },
            status: "AMOUNT_MISMATCH", occurredAt: "2026-07-01T11:00:00Z" },
          { internalRef: "MLP-PAY-8844", providerRef: null, provider,
            internalAmount: { amount: 3000, currency: "XOF" }, status: "MISSING_IN_PROVIDER",
            occurredAt: "2026-07-01T12:00:00Z" },
        ],
      }});
    }
    if (path === "/admin/drivers") {
      const kyc = url.searchParams.get("kycStatus") ?? "PENDING";
      return json(200, paginated([{
        id: "driver-1", userId: "u9", userName: "Moussa Keïta", userPhone: "+22375000000",
        vehicleType: "MOTO", plateNumber: "BKO-1234", kycStatus: kyc, isAvailable: false,
        totalDeliveries: 0, createdAt: "2026-06-20T09:00:00Z",
      }], 1, 20, 1));
    }
    const drv = path.match(/^\/admin\/drivers\/([^/]+)$/);
    if (drv && method === "GET") {
      return json(200, { success: true, data: {
        id: drv[1], userId: "u9", userName: "Moussa Keïta", userPhone: "+22375000000",
        vehicleType: "MOTO", plateNumber: "BKO-1234", kycStatus: driverKyc.get(drv[1]) ?? "PENDING",
        isAvailable: false, rating: 0, totalDeliveries: 0,
        documents: [
          { id: "doc1", type: "ID_CARD", url: "https://example.test/id.jpg", status: "PENDING" },
          { id: "doc2", type: "DRIVER_LICENSE", url: "https://example.test/lic.jpg", status: "PENDING" },
        ],
        createdAt: "2026-06-20T09:00:00Z",
      }});
    }
    const validate = path.match(/^\/drivers\/([^/]+)\/validate$/);
    if (validate && method === "POST") {
      const body = route.request().postDataJSON() as { decision: string };
      driverKyc.set(validate[1], body.decision); // reflété sur le GET suivant
      return json(200, { success: true, data: {
        id: validate[1], userId: "u9", userName: "Moussa Keïta", userPhone: "+22375000000",
        kycStatus: body.decision, isAvailable: false, createdAt: "2026-06-20T09:00:00Z",
      }});
    }

    return json(404, { success: false, error: { code: "NOT_FOUND", message: "Not found", status: 404 } });
  });
}

// Pré-injecte des tokens valides pour les parcours authentifiés.
export async function seedAuth(page: Page) {
  await page.addInitScript((tokens) => {
    window.localStorage.setItem("novigo.tokens", JSON.stringify(tokens));
  }, TOKENS);
}

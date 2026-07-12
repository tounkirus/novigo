import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { InvoiceService } from "./invoice.service";

const order = {
  id: "o1", customerId: "me", reference: "CMD-2026-000842", createdAt: new Date("2026-07-05"),
  total: 9000, subtotal: 8000, deliveryFee: 1000,
  items: [{ name: "Tiep bou dien", quantity: 2, unitPrice: 2500 }, { name: "Livraison", quantity: 1, unitPrice: 1000 }],
  customer: { firstName: "Awa", lastName: "Diallo", phone: "+22370000000" },
  addressLine1: "Rue 224", addressCity: "Bamako", addressDistrict: "ACI 2000",
};

describe("InvoiceService.buildInvoiceData", () => {
  it("calcule HT/TVA/TTC et les lignes", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(order) } } as any;
    const data = await new InvoiceService(prisma).buildInvoiceData("o1", "me");
    expect(data.ttc).toBe(9000);
    expect(data.ht + data.tva).toBe(9000);
    expect(data.items[0].lineTotal).toBe(5000);
    expect(data.buyer.name).toBe("Awa Diallo");
    expect(data.number).toContain("FAC-");
  });

  it("refuse la facture d'une commande d'autrui", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue({ ...order, customerId: "other" }) } } as any;
    await expect(new InvoiceService(prisma).buildInvoiceData("o1", "me")).rejects.toThrow(ForbiddenException);
  });

  it("lève NotFound si la commande est introuvable", async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new InvoiceService(prisma).buildInvoiceData("nope", "me")).rejects.toThrow(NotFoundException);
  });

  it("replie sur '000000' quand la référence n'a pas de chiffre et 'Client' sans nom", async () => {
    const noDigits = {
      ...order,
      reference: "CMD-XYZ",
      customer: { firstName: null, lastName: null, phone: "+22370000001" },
      addressLine1: null, addressDistrict: null, addressCity: null,
    };
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(noDigits) } } as any;
    const data = await new InvoiceService(prisma).buildInvoiceData("o1", "me");
    expect(data.number).toBe("FAC-000000");
    expect(data.buyer.name).toBe("Client");
    expect(data.buyer.address).toBe("");
    expect(data.orderRef).toBe("CMD-XYZ");
  });

  it("filtre les champs d'adresse falsy et compose l'adresse disponible", async () => {
    const partial = {
      ...order,
      addressLine1: "Rue 10", addressDistrict: null, addressCity: "Kayes",
    };
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(partial) } } as any;
    const data = await new InvoiceService(prisma).buildInvoiceData("o1", "me");
    expect(data.buyer.address).toBe("Rue 10, Kayes");
    expect(data.subtotal).toBe(8000);
    expect(data.deliveryFee).toBe(1000);
  });
});

describe("InvoiceService.generatePdf", () => {
  const baseData = {
    number: "FAC-000000842", date: "05/07/2026", orderRef: "CMD-2026-000842",
    buyer: { name: "Awa Diallo", phone: "+22370000000", address: "Rue 224, ACI 2000, Bamako" },
    items: [
      { name: "Tiep bou dien", quantity: 2, unitPrice: 2500, lineTotal: 5000 },
      { name: "Livraison", quantity: 1, unitPrice: 1000, lineTotal: 1000 },
    ],
    subtotal: 8000, deliveryFee: 1000, ht: 7627, tva: 1373, ttc: 9000,
  };

  it("produit un PDF non vide (Buffer) avec plusieurs lignes", async () => {
    const buf = await new InvoiceService({} as any).generatePdf(baseData);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.slice(0, 4).toString("latin1")).toBe("%PDF");
  }, 15000);

  it("gère une facture sans articles (aucune ligne dans le tableau)", async () => {
    const buf = await new InvoiceService({} as any).generatePdf({ ...baseData, items: [] });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  }, 15000);

  it("gère une seule ligne (pas de fond alterné)", async () => {
    const buf = await new InvoiceService({} as any).generatePdf({
      ...baseData, items: [{ name: "Article unique", quantity: 3, unitPrice: 1500000, lineTotal: 4500000 }],
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  }, 15000);
});

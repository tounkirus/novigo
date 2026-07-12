import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { PrismaService } from "../common/prisma/prisma.service";

const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/\u202f|,/g, " ")} FCFA`;

export interface InvoiceData {
  number: string; date: string; orderRef: string;
  buyer: { name: string; phone: string; address: string };
  items: Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>;
  subtotal: number; deliveryFee: number; ht: number; tva: number; ttc: number;
}

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  /// Données de facture (pures, testables). Contrôle de propriété.
  async buildInvoiceData(orderId: string, userId: string): Promise<InvoiceData> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }, include: { items: true, customer: true },
    });
    if (!order) throw new NotFoundException("Commande introuvable.");
    if (order.customerId !== userId) throw new ForbiddenException("Commande d'un autre utilisateur.");

    const items = order.items.map((i: any) => ({
      name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.quantity * i.unitPrice,
    }));
    const ttc = order.total;
    const ht = Math.round(ttc / 1.18);
    const tva = ttc - ht;
    return {
      number: `FAC-${order.reference.replace(/[^0-9]/g, "").slice(-9) || "000000"}`,
      date: new Date(order.createdAt).toLocaleDateString("fr-FR"),
      orderRef: order.reference,
      buyer: {
        name: `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim() || "Client",
        phone: order.customer.phone,
        address: [order.addressLine1, order.addressDistrict, order.addressCity].filter(Boolean).join(", "),
      },
      items, subtotal: order.subtotal, deliveryFee: order.deliveryFee, ht, tva, ttc,
    };
  }

  async generatePdf(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width;
      // Bandeau
      doc.rect(0, 0, W, 110).fill("#5B4BE1");
      doc.fillColor("white").fontSize(24).font("Helvetica-Bold").text("NOVIGO", 50, 40);
      doc.fontSize(9).font("Helvetica").text("La super app du Mali", 50, 70);
      doc.fillColor("#FFC043").fontSize(18).font("Helvetica-Bold").text("FACTURE", W - 200, 40, { width: 150, align: "right" });
      doc.fillColor("white").fontSize(9).font("Helvetica")
        .text(`N° ${data.number}`, W - 200, 66, { width: 150, align: "right" })
        .text(`Date : ${data.date}`, W - 200, 80, { width: 150, align: "right" });

      // Client
      let y = 140;
      doc.fillColor("#64726B").fontSize(8).font("Helvetica-Bold").text("CLIENT", 50, y);
      doc.fillColor("#101613").fontSize(10).text(data.buyer.name, 50, y + 12);
      doc.fillColor("#64726B").fontSize(9).font("Helvetica")
        .text(data.buyer.phone, 50, y + 26).text(data.buyer.address, 50, y + 38, { width: 250 });
      doc.fontSize(8).text(`Réf. commande : ${data.orderRef}`, 50, y + 56);

      // Tableau
      y += 80;
      doc.rect(50, y, W - 100, 22).fill("#0E7C5A");
      doc.fillColor("white").fontSize(9).font("Helvetica-Bold");
      doc.text("Désignation", 58, y + 6);
      doc.text("Qté", 300, y + 6, { width: 40, align: "right" });
      doc.text("P.U.", 360, y + 6, { width: 80, align: "right" });
      doc.text("Total", W - 140, y + 6, { width: 90, align: "right" });
      y += 22;
      doc.font("Helvetica").fontSize(9);
      data.items.forEach((it, idx) => {
        if (idx % 2) { doc.rect(50, y, W - 100, 20).fill("#F3F7F5"); }
        doc.fillColor("#101613");
        doc.text(it.name, 58, y + 5, { width: 230 });
        doc.text(String(it.quantity), 300, y + 5, { width: 40, align: "right" });
        doc.text(fcfa(it.unitPrice), 360, y + 5, { width: 80, align: "right" });
        doc.text(fcfa(it.lineTotal), W - 140, y + 5, { width: 90, align: "right" });
        y += 20;
      });

      // Totaux
      y += 12;
      doc.fillColor("#64726B").font("Helvetica")
        .text("Total HT", 360, y, { width: 80, align: "right" });
      doc.fillColor("#101613").text(fcfa(data.ht), W - 140, y, { width: 90, align: "right" });
      y += 16;
      doc.fillColor("#64726B").text("TVA 18%", 360, y, { width: 80, align: "right" });
      doc.fillColor("#101613").text(fcfa(data.tva), W - 140, y, { width: 90, align: "right" });
      y += 22;
      doc.rect(300, y - 4, W - 350, 24).fill("#C99A2E");
      doc.fillColor("white").font("Helvetica-Bold").fontSize(11)
        .text("TOTAL TTC", 308, y + 2).text(fcfa(data.ttc), W - 140, y + 2, { width: 90, align: "right" });

      doc.fillColor("#64726B").font("Helvetica").fontSize(8)
        .text("Merci pour votre confiance — NOVIGO.", 50, doc.page.height - 60, { width: W - 100, align: "center" });
      doc.end();
    });
  }
}

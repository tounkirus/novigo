import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { phone: "+22370000000" },
    update: {},
    create: {
      phone: "+22370000000", firstName: "Awa", lastName: "Diallo",
      passwordHash, roles: ["ADMIN", "SUPER_ADMIN"], status: "ACTIVE",
    },
  });

  const customer = await prisma.user.upsert({
    where: { phone: "+22371000000" },
    update: {},
    create: { phone: "+22371000000", firstName: "Ibrahim", lastName: "Cissé", roles: ["CUSTOMER"], passwordHash, status: "ACTIVE" },
  });

  // Livreurs (dont un en attente KYC)
  const driverUser = await prisma.user.upsert({
    where: { phone: "+22375000000" },
    update: {},
    create: { phone: "+22375000000", firstName: "Moussa", lastName: "Keïta", roles: ["DRIVER"], passwordHash, status: "ACTIVE" },
  });
  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id, vehicleType: "MOTO", plateNumber: "BKO-1234",
      kycStatus: "PENDING", isAvailable: false,
      documents: {
        create: [
          { type: "ID_CARD", url: "https://files.novigo.ml/id.jpg", status: "PENDING" },
          { type: "DRIVER_LICENSE", url: "https://files.novigo.ml/lic.jpg", status: "PENDING" },
        ],
      },
    },
  });

  // Un second livreur actif (pour les KPIs)
  const driver2User = await prisma.user.upsert({
    where: { phone: "+22375000001" },
    update: {},
    create: { phone: "+22375000001", firstName: "Fanta", lastName: "Sidibé", roles: ["DRIVER"], passwordHash, status: "ACTIVE" },
  });
  await prisma.driver.upsert({
    where: { userId: driver2User.id },
    update: {},
    create: {
      userId: driver2User.id, vehicleType: "MOTO", kycStatus: "APPROVED",
      isAvailable: true, rating: 4.7, totalDeliveries: 214,
    },
  });

  // Commandes + items + livraison + paiement
  const statuses = ["PENDING", "IN_TRANSIT", "DELIVERED", "DELIVERED", "CANCELLED"] as const;
  for (let i = 1; i <= 25; i++) {
    const status = statuses[i % statuses.length];
    const subtotal = 3000 + i * 250;
    const deliveryFee = 1000;
    const total = subtotal + deliveryFee;
    const order = await prisma.order.upsert({
      where: { reference: `MLP-2026-${String(i).padStart(6, "0")}` },
      update: {},
      create: {
        reference: `MLP-2026-${String(i).padStart(6, "0")}`,
        customerId: customer.id, type: "FOOD", status,
        subtotal, deliveryFee, total, paymentMethod: "ORANGE_MONEY",
        addressLine1: "Rue 224, Porte 58", addressCity: "Bamako", addressDistrict: "Hamdallaye ACI 2000",
        items: {
          create: [
            { productId: "p1", name: "Poulet braisé", quantity: 2, unitPrice: 3000 },
            { productId: "p2", name: "Attiéké", quantity: 1, unitPrice: 1000 },
          ],
        },
        delivery: {
          create: status === "PENDING"
            ? { status: "UNASSIGNED", pickupLat: 12.65, pickupLng: -8.0, dropoffLat: 12.6392, dropoffLng: -8.0029, etaMinutes: 15, distanceMeters: 3400 }
            : {
                status: status === "DELIVERED" ? "COMPLETED" : "EN_ROUTE_DROPOFF",
                driverId: driver.id, driverLat: 12.6392, driverLng: -8.0029, etaMinutes: 12,
                distanceMeters: 3400,
                acceptedAt: new Date(Date.now() - 40 * 60000),
                completedAt: status === "DELIVERED" ? new Date(Date.now() - 8 * 60000) : null,
              },
        },
      },
    });
    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {},
      create: {
        orderId: order.id, userId: customer.id, method: "ORANGE_MONEY",
        status: status === "CANCELLED" ? "FAILED" : "SUCCEEDED",
        amount: total, providerRef: i % 7 === 0 ? null : `OM-TX-${90000 + i}`,
      },
    });
  }

  // Catalogue produits
  const productSeed = [
    // FOOD — restaurants
    { name: "Poulet braisé", price: 3000, category: "FOOD", description: "Avec attiéké et sauce piment." },
    { name: "Attiéké poisson", price: 2500, category: "FOOD", description: "Poisson braisé, attiéké, alloco." },
    { name: "Riz au gras", price: 2000, category: "FOOD", description: "Riz, viande, légumes." },
    { name: "Jus de bissap 50cl", price: 1000, category: "FOOD", description: "Boisson d'hibiscus fraîche." },
    { name: "Alloco poulet", price: 2200, category: "FOOD", description: "Bananes plantains frites." },
    // GROCERY — marché
    { name: "Riz local 5kg", price: 7500, category: "GROCERY", description: "Riz de Ségou." },
    { name: "Huile végétale 1L", price: 2000, category: "GROCERY", description: "Huile de cuisine." },
    { name: "Sucre 1kg", price: 1000, category: "GROCERY", description: "Sucre en morceaux." },
    { name: "Pack eau 1,5L x6", price: 3500, category: "GROCERY", description: "Eau minérale." },
    { name: "Tomates fraîches 1kg", price: 750, category: "GROCERY", description: "Tomates du marché." },
    // PHARMACY — pharmacie
    { name: "Paracétamol 500mg", price: 1500, category: "PHARMACY", description: "Boîte de 20 comprimés." },
    { name: "Vitamine C 1000", price: 2500, category: "PHARMACY", description: "Complément immunité." },
    { name: "Masques chirurgicaux x10", price: 2000, category: "PHARMACY", description: "Protection quotidienne." },
    // SHOP — boutiques
    { name: "T-shirt NOVIGO", price: 5000, category: "SHOP", description: "Coton premium, logo brodé." },
    { name: "Chargeur USB-C 20W", price: 3500, category: "SHOP", description: "Charge rapide." },
    { name: "Écouteurs sans fil", price: 12000, category: "SHOP", description: "Bluetooth, autonomie 20h." },
  ];
  for (const p of productSeed) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({
        data: { name: p.name, price: p.price, category: p.category, description: p.description },
      });
    } else {
      // Complète la catégorie sur les produits déjà présents (idempotent).
      await prisma.product.update({
        where: { id: existing.id },
        data: { category: p.category, description: existing.description ?? p.description },
      });
    }
  }

  // Wallet approvisionné pour le client de démo
  const wallet = await prisma.wallet.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id, balance: 50000 },
  });
  const hasTx = await prisma.transaction.count({ where: { walletId: wallet.id } });
  if (hasTx === 0) {
    await prisma.transaction.create({
      data: { walletId: wallet.id, type: "DEPOSIT", amount: 50000, balanceAfter: 50000, reference: "DEP-ORANGE_MONEY" },
    });
  }

  // Adresse + favori de démonstration pour le client
  const hasAddr = await prisma.address.count({ where: { userId: customer.id } });
  if (hasAddr === 0) {
    await prisma.address.create({
      data: { userId: customer.id, label: "Domicile", line1: "Rue 224, Porte 58",
              city: "Bamako", district: "Hamdallaye ACI 2000", isDefault: true },
    });
  }
  const firstProduct = await prisma.product.findFirst();
  if (firstProduct) {
    await prisma.favorite.upsert({
      where: { userId_targetType_targetId: { userId: customer.id, targetType: "PRODUCT", targetId: firstProduct.id } },
      update: {},
      create: { userId: customer.id, targetType: "PRODUCT", targetId: firstProduct.id },
    });
  }

  // Commerçant + boutique + produits
  const merchantUser = await prisma.user.upsert({
    where: { phone: "+22376000000" }, update: {},
    create: { phone: "+22376000000", firstName: "Fatou", lastName: "Ba", roles: ["MERCHANT"], passwordHash, status: "ACTIVE" },
  });
  let merchant = await prisma.merchant.findUnique({ where: { userId: merchantUser.id } });
  if (!merchant) {
    merchant = await prisma.merchant.create({ data: { userId: merchantUser.id, businessName: "Chez Fatou", category: "RESTAURANT" } });
    const store = await prisma.store.create({ data: { merchantId: merchant.id, name: "Chez Fatou - ACI 2000", category: "RESTAURANT", lat: 12.63, lng: -8.0 } });
    await prisma.product.createMany({ data: [
      { storeId: store.id, name: "Tiep bou dien", price: 2500, stockQuantity: 40 },
      { storeId: store.id, name: "Jus de gingembre", price: 1000, stockQuantity: 60 },
    ]});
  }

  // Artisan + service
  const artisanUser = await prisma.user.upsert({
    where: { phone: "+22379000000" }, update: {},
    create: { phone: "+22379000000", firstName: "Oumar", lastName: "Touré", roles: ["ARTISAN"], passwordHash, status: "ACTIVE" },
  });
  let artisan = await prisma.artisan.findUnique({ where: { userId: artisanUser.id } });
  if (!artisan) {
    artisan = await prisma.artisan.create({ data: { userId: artisanUser.id, profession: "Plombier", serviceArea: "Bamako" } });
    await prisma.artisanService.create({ data: { artisanId: artisan.id, title: "Réparation fuite", price: 5000, durationMinutes: 60 } });
  }

  await prisma.coupon.upsert({
    where: { code: "BIENVENUE10" }, update: {},
    create: { code: "BIENVENUE10", type: "PERCENT", value: 10, minAmount: 2000, maxDiscount: 1000, usageLimit: 1000 },
  });

  const hasTicket = await prisma.supportTicket.count({ where: { userId: customer.id } });
  if (hasTicket === 0) {
    await prisma.supportTicket.create({
      data: { userId: customer.id, subject: "Retard de livraison", category: "ORDER", status: "OPEN",
              messages: { create: { senderId: customer.id, body: "Ma commande tarde, pouvez-vous vérifier ?", isStaff: false } } },
    });
  }

  await prisma.commissionSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, deliveryPercent: 12.5, merchantPercent: 15, artisanPercent: 10 },
  });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "SEED_COMPLETED", entityType: "System" },
  });

  console.log("Seed terminé. Admin: +22370000000 / admin123");
}

main().finally(() => prisma.$disconnect());

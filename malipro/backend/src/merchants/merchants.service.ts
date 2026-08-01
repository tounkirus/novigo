import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { paginate } from "../common/dto/pagination.dto";
import { RealtimeGateway } from "../realtime/realtime.gateway";

const money = (amount: number) => ({ amount, currency: "XOF" });
const mapMerchant = (m: any) => ({
  id: m.id, userId: m.userId, businessName: m.businessName, category: m.category,
  isActive: m.isActive, createdAt: m.createdAt,
});
const mapStore = (s: any) => ({
  id: s.id, merchantId: s.merchantId, name: s.name, category: s.category,
  description: s.description, phone: s.phone, address: s.address, hours: s.hours ?? undefined,
  logoUrl: s.logoUrl, coverUrl: s.coverUrl,
  location: s.lat != null ? { lat: s.lat, lng: s.lng } : undefined, isOpen: s.isOpen, rating: s.rating,
});

/// État de stock dérivé de la quantité (seuil "limité" à 5).
const stockState = (p: any) =>
  !p.inStock || p.stockQuantity <= 0 ? "OUT_OF_STOCK" : p.stockQuantity <= 5 ? "LIMITED" : "AVAILABLE";
const finalAmount = (p: any) =>
  p.promoPercent ? Math.round(p.price * (1 - p.promoPercent / 100)) : p.price;

const mapOptionGroups = (p: any) =>
  (p.optionGroups ?? [])
    .slice()
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map((g: any) => ({
      id: g.id, name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect,
      required: g.minSelect > 0, multiple: g.maxSelect > 1,
      choices: (g.choices ?? [])
        .slice()
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((c: any) => ({ id: c.id, name: c.name, priceDelta: c.priceDelta })),
    }));

const mapProduct = (p: any) => ({
  id: p.id, storeId: p.storeId, menuCategoryId: p.menuCategoryId, name: p.name, description: p.description,
  category: p.category,
  price: money(p.price), promoPercent: p.promoPercent ?? undefined, finalPrice: money(finalAmount(p)),
  imageUrl: p.imageUrl, images: p.images ?? [],
  inStock: p.inStock, stockQuantity: p.stockQuantity, stockState: stockState(p),
  status: p.status,
  optionGroups: mapOptionGroups(p),
});

const PRODUCT_INCLUDE = { optionGroups: { include: { choices: true } } };

const mapMerchantOrder = (o: any) => ({
  id: o.id, reference: o.reference, status: o.status, type: o.type,
  storeId: o.storeId,
  customerName: o.customer ? [o.customer.firstName, o.customer.lastName].filter(Boolean).join(" ") || null : null,
  items: (o.items ?? []).map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: money(i.unitPrice), optionsLabel: i.optionsLabel ?? undefined })),
  itemsCount: (o.items ?? []).reduce((s: number, i: any) => s + i.quantity, 0),
  subtotal: money(o.subtotal), deliveryFee: money(o.deliveryFee), total: money(o.total),
  paymentMethod: o.paymentMethod ?? undefined,
  deliveryStatus: o.delivery?.status ?? undefined,
  createdAt: o.createdAt,
});

@Injectable()
export class MerchantsService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  /// Commandes entrantes des boutiques du commerçant connecté.
  async myOrders(userId: string, page: number, limit: number, status?: string) {
    const m = await this.merchantFor(userId);
    const stores = await this.prisma.store.findMany({ where: { merchantId: m.id }, select: { id: true } });
    const storeIds = stores.map((s) => s.id);
    const where: any = { storeId: { in: storeIds } };
    if (status) where.status = status;
    if (storeIds.length === 0) return paginate([], 0, page, limit);
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
        include: { items: true, customer: true, delivery: true },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(rows.map(mapMerchantOrder), total, page, limit);
  }

  // ── Workflow des commandes (accepter / refuser / préparer / prête) ──
  private static readonly ORDER_TRANSITIONS: Record<string, { from: string[]; to: string }> = {
    accept: { from: ["PENDING"], to: "CONFIRMED" },
    refuse: { from: ["PENDING", "CONFIRMED"], to: "CANCELLED" },
    preparing: { from: ["CONFIRMED"], to: "PREPARING" },
    ready: { from: ["PREPARING"], to: "READY" },
  };

  async orderAction(userId: string, orderId: string, action: string, reason?: string) {
    const t = MerchantsService.ORDER_TRANSITIONS[action];
    if (!t) throw new BadRequestException("Action invalide.");
    const m = await this.merchantFor(userId);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }, include: { store: true },
    });
    if (!order || !order.store) throw new NotFoundException("Commande introuvable.");
    if (order.store.merchantId !== m.id) throw new ForbiddenException("Commande d'un autre établissement.");
    if (!t.from.includes(order.status)) {
      throw new BadRequestException(`Transition impossible depuis le statut ${order.status}.`);
    }
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: t.to as any },
      include: { store: true, items: true, customer: true, delivery: true },
    });

    // Push : le commerçant (multi-postes) + le client suivent le changement.
    const recipients = [m.userId, ...(await this.staffUserIds(m.id))];
    const payload = { id: updated.id, reference: updated.reference, status: updated.status, reason: reason ?? null };
    this.realtime.emitToUsers(recipients, "order.updated", payload);
    this.realtime.emitToUsers([updated.customerId], "order.updated", payload);
    this.realtime.emitTracking(updated.id, { status: updated.status, reason: reason ?? null });

    // « Prête » = la course devient prenable : prévenir les livreurs en ligne,
    // sinon leur liste reste figée jusqu'à une bascule manuelle hors ligne/en ligne.
    if (updated.status === "READY") await this.notifyAvailableDrivers(updated);

    return mapMerchantOrder(updated);
  }

  /// Push « nouvelle course disponible » vers les livreurs déclarés en ligne.
  private async notifyAvailableDrivers(order: any) {
    const drivers = await this.prisma.driver.findMany({
      where: { isAvailable: true }, select: { userId: true },
    });
    if (!drivers.length) return;
    this.realtime.emitToUsers(drivers.map((d) => d.userId), "delivery.available", {
      orderId: order.id,
      reference: order.reference,
      storeName: order.store?.name ?? null,
      itemsCount: (order.items ?? []).reduce((s: number, i: any) => s + i.quantity, 0),
      payout: { amount: order.deliveryFee, currency: order.currency ?? "XOF" },
    });
  }

  private async staffUserIds(merchantId: string): Promise<string[]> {
    const rows = await this.prisma.merchantStaff.findMany({ where: { merchantId }, select: { userId: true } });
    return rows.map((r) => r.userId);
  }

  /// Résout l'établissement piloté par l'utilisateur : propriétaire (Merchant.userId)
  /// OU membre du staff (MerchantStaff). Socle du multi-tenant.
  private async merchantFor(userId: string) {
    const owned = await this.prisma.merchant.findUnique({ where: { userId } });
    if (owned) return owned;
    const staff = await this.prisma.merchantStaff.findFirst({
      where: { userId }, include: { merchant: true },
    });
    if (staff?.merchant) return staff.merchant;
    throw new ForbiddenException("Profil commerçant ou rattachement à un établissement requis.");
  }
  private async ownStore(userId: string, storeId: string) {
    const m = await this.merchantFor(userId);
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException("Boutique introuvable.");
    if (store.merchantId !== m.id) throw new ForbiddenException("Boutique d'un autre commerçant.");
    return store;
  }
  private async ownProduct(userId: string, productId: string) {
    const p = await this.prisma.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!p || !p.store) throw new NotFoundException("Produit introuvable.");
    const m = await this.merchantFor(userId);
    if (p.store.merchantId !== m.id) throw new ForbiddenException("Produit d'un autre commerçant.");
    return p;
  }

  async me(userId: string) {
    return mapMerchant(await this.merchantFor(userId));
  }

  // ── Gestion du personnel (multi-tenant) ─────────────────────────────
  /// Seul le propriétaire peut gérer le staff (garde staff:manage côté contrôleur).
  private async ownerMerchantFor(userId: string) {
    const m = await this.prisma.merchant.findUnique({ where: { userId } });
    if (!m) throw new ForbiddenException("Seul le propriétaire de l'établissement peut gérer le personnel.");
    return m;
  }

  async listStaff(userId: string) {
    const m = await this.ownerMerchantFor(userId);
    const rows = await this.prisma.merchantStaff.findMany({
      where: { merchantId: m.id }, include: { user: true }, orderBy: { createdAt: "asc" },
    });
    return rows.map((s: any) => ({
      userId: s.userId, role: s.role,
      name: s.user ? `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim() || null : null,
      phone: s.user?.phone, createdAt: s.createdAt,
    }));
  }

  async addStaff(userId: string, phone: string, role: string) {
    const m = await this.ownerMerchantFor(userId);
    const staffRole = String(role).toUpperCase();
    if (!["MANAGER", "CASHIER", "PREPARER"].includes(staffRole)) {
      throw new NotFoundException("Rôle de staff invalide (MANAGER | CASHIER | PREPARER).");
    }
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException("Aucun utilisateur avec ce numéro.");
    if (user.id === m.userId) throw new ForbiddenException("Le propriétaire ne peut pas être ajouté comme staff.");

    // Rôle global correspondant pour que les permissions RBAC s'appliquent.
    const globalRole = { MANAGER: "MERCHANT_MANAGER", CASHIER: "CASHIER", PREPARER: "ORDER_PREPARER" }[staffRole]!;
    const roles = Array.from(new Set([...user.roles, globalRole]));
    await this.prisma.user.update({ where: { id: user.id }, data: { roles: roles as any } });

    const staff = await this.prisma.merchantStaff.upsert({
      where: { merchantId_userId: { merchantId: m.id, userId: user.id } },
      update: { role: staffRole as any },
      create: { merchantId: m.id, userId: user.id, role: staffRole as any },
    });
    return { userId: staff.userId, role: staff.role, phone: user.phone };
  }

  async removeStaff(userId: string, staffUserId: string) {
    const m = await this.ownerMerchantFor(userId);
    await this.prisma.merchantStaff.deleteMany({ where: { merchantId: m.id, userId: staffUserId } });
  }

  /** Onboarding : crée le profil commerçant s'il manque, sinon le complète. */
  async upsertProfile(userId: string, dto: any) {
    const m = await this.prisma.merchant.upsert({
      where: { userId },
      update: {
        businessName: dto.businessName ?? undefined,
        category: dto.category ?? undefined,
      },
      create: {
        userId,
        businessName: dto.businessName ?? "À renseigner",
        category: dto.category ?? null,
      },
    });
    return mapMerchant(m);
  }

  async listStores(userId: string) {
    const m = await this.merchantFor(userId);
    const rows = await this.prisma.store.findMany({ where: { merchantId: m.id } });
    return rows.map(mapStore);
  }
  async createStore(userId: string, dto: any) {
    const m = await this.merchantFor(userId);
    const s = await this.prisma.store.create({
      data: { merchantId: m.id, name: dto.name, category: dto.category ?? null,
              lat: dto.location?.lat ?? null, lng: dto.location?.lng ?? null },
    });
    return mapStore(s);
  }
  async updateStore(userId: string, storeId: string, dto: any) {
    await this.ownStore(userId, storeId);
    const s = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        name: dto.name ?? undefined,
        category: dto.category ?? undefined,
        description: dto.description ?? undefined,
        phone: dto.phone ?? undefined,
        address: dto.address ?? undefined,
        hours: dto.hours ?? undefined,
        logoUrl: dto.logoUrl ?? undefined,
        coverUrl: dto.coverUrl ?? undefined,
        lat: dto.location?.lat ?? dto.lat ?? undefined,
        lng: dto.location?.lng ?? dto.lng ?? undefined,
        isOpen: dto.isOpen ?? undefined,
      },
    });
    return mapStore(s);
  }

  // ── Rubriques de menu (catégories propres à l'établissement) ────────
  async listCategories(userId: string, storeId: string) {
    await this.ownStore(userId, storeId);
    const rows = await this.prisma.menuCategory.findMany({
      where: { storeId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    return rows.map((c: any) => ({ id: c.id, name: c.name, sortOrder: c.sortOrder, productCount: c._count.products }));
  }
  async createCategory(userId: string, storeId: string, dto: any) {
    await this.ownStore(userId, storeId);
    const c = await this.prisma.menuCategory.create({
      data: { storeId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
    return { id: c.id, name: c.name, sortOrder: c.sortOrder };
  }
  async updateCategory(userId: string, categoryId: string, dto: any) {
    const c = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!c) throw new NotFoundException("Rubrique introuvable.");
    await this.ownStore(userId, c.storeId);
    const upd = await this.prisma.menuCategory.update({
      where: { id: categoryId }, data: { name: dto.name ?? undefined, sortOrder: dto.sortOrder ?? undefined },
    });
    return { id: upd.id, name: upd.name, sortOrder: upd.sortOrder };
  }
  async deleteCategory(userId: string, categoryId: string) {
    const c = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!c) throw new NotFoundException("Rubrique introuvable.");
    await this.ownStore(userId, c.storeId);
    await this.prisma.menuCategory.delete({ where: { id: categoryId } });
  }

  async listProducts(userId: string, storeId: string, page: number, limit: number) {
    await this.ownStore(userId, storeId);
    const rows = await this.prisma.product.findMany({
      where: { storeId }, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit,
      include: PRODUCT_INCLUDE,
    });
    const total = await this.prisma.product.count({ where: { storeId } });
    return { data: rows.map(mapProduct), meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } };
  }

  // ── Options & suppléments d'un produit ──────────────────────────────
  async createOptionGroup(userId: string, productId: string, dto: any) {
    await this.ownProduct(userId, productId);
    const choices = Array.isArray(dto.choices) ? dto.choices : [];
    if (!dto.name || choices.length === 0) {
      throw new BadRequestException("Un groupe d'options requiert un nom et au moins un choix.");
    }
    const maxSelect = Math.max(1, Number(dto.maxSelect ?? 1));
    const minSelect = Math.max(0, Math.min(Number(dto.minSelect ?? 0), maxSelect));
    const group = await this.prisma.productOptionGroup.create({
      data: {
        productId, name: dto.name, minSelect, maxSelect, sortOrder: dto.sortOrder ?? 0,
        choices: {
          create: choices.map((c: any, i: number) => ({
            name: c.name, priceDelta: Math.round(Number(c.priceDelta ?? 0)), sortOrder: c.sortOrder ?? i,
          })),
        },
      },
      include: { choices: true },
    });
    return {
      id: group.id, name: group.name, minSelect: group.minSelect, maxSelect: group.maxSelect,
      choices: group.choices.map((c) => ({ id: c.id, name: c.name, priceDelta: c.priceDelta })),
    };
  }

  async deleteOptionGroup(userId: string, groupId: string) {
    const g = await this.prisma.productOptionGroup.findUnique({ where: { id: groupId } });
    if (!g) throw new NotFoundException("Groupe d'options introuvable.");
    await this.ownProduct(userId, g.productId);
    await this.prisma.productOptionGroup.delete({ where: { id: groupId } });
  }

  /// Champs produit acceptés (create/update) — normalise prix, photos, promo.
  private productData(dto: any) {
    const promo = dto.promoPercent != null ? Math.max(0, Math.min(90, Number(dto.promoPercent))) : undefined;
    return {
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      category: dto.category ?? undefined,
      menuCategoryId: dto.menuCategoryId ?? undefined,
      price: dto.price?.amount ?? dto.price ?? undefined,
      imageUrl: dto.imageUrl ?? undefined,
      images: Array.isArray(dto.images) ? dto.images : undefined,
      promoPercent: promo,
    };
  }

  async createProduct(userId: string, storeId: string, dto: any) {
    const store = await this.ownStore(userId, storeId);
    if (dto.menuCategoryId) await this.assertCategoryInStore(dto.menuCategoryId, storeId);
    const d = this.productData(dto);
    // Auto-publication selon le réglage du commerçant (sinon validation admin requise).
    const merchant = await this.prisma.merchant.findUnique({ where: { id: store.merchantId } });
    const status = merchant?.autoPublish === false ? "PENDING_REVIEW" : "PUBLISHED";
    const p = await this.prisma.product.create({
      data: {
        storeId, name: dto.name, description: d.description ?? null, category: d.category ?? null,
        menuCategoryId: d.menuCategoryId ?? null, price: d.price ?? 0,
        imageUrl: d.imageUrl ?? null, images: d.images ?? [], promoPercent: d.promoPercent ?? null,
        stockQuantity: dto.stockQuantity ?? 0, inStock: (dto.stockQuantity ?? 0) > 0,
        status: status as any,
      },
    });
    return mapProduct(p);
  }
  async updateProduct(userId: string, productId: string, dto: any) {
    const existing = await this.ownProduct(userId, productId);
    if (dto.menuCategoryId) await this.assertCategoryInStore(dto.menuCategoryId, existing.storeId!);
    const p = await this.prisma.product.update({
      where: { id: productId }, data: this.productData(dto), include: PRODUCT_INCLUDE,
    });
    return mapProduct(p);
  }
  private async assertCategoryInStore(categoryId: string, storeId: string) {
    const c = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!c || c.storeId !== storeId) throw new BadRequestException("Rubrique invalide pour cette boutique.");
  }

  /// Duplique un produit (copie « (copie) ») dans la même boutique.
  async duplicateProduct(userId: string, productId: string) {
    const p = await this.ownProduct(userId, productId);
    const copy = await this.prisma.product.create({
      data: {
        storeId: p.storeId, menuCategoryId: p.menuCategoryId, name: `${p.name} (copie)`,
        description: p.description, category: p.category, price: p.price, currency: p.currency,
        imageUrl: p.imageUrl, images: p.images, promoPercent: p.promoPercent,
        inStock: p.inStock, stockQuantity: p.stockQuantity,
      },
    });
    return mapProduct(copy);
  }

  async deleteProduct(userId: string, productId: string) {
    await this.ownProduct(userId, productId);
    await this.prisma.product.delete({ where: { id: productId } });
  }
  async setInventory(userId: string, productId: string, stockQuantity: number) {
    await this.ownProduct(userId, productId);
    const p = await this.prisma.product.update({
      where: { id: productId }, data: { stockQuantity, inStock: stockQuantity > 0 },
    });
    return mapProduct(p);
  }

  async adminList(page: number, limit: number, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [rows, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where, include: { user: true, _count: { select: { stores: true } } },
        orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.merchant.count({ where }),
    ]);
    const data = rows.map((m: any) => ({
      id: m.id, businessName: m.businessName, category: m.category,
      status: m.status, isActive: m.isActive, autoPublish: m.autoPublish,
      storeCount: m._count.stores,
      owner: m.user ? `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() : null,
      phone: m.user?.phone, createdAt: m.createdAt,
    }));
    return paginate(data, total, page, limit);
  }

  async adminGet(id: string) {
    const m = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        user: true,
        documents: { orderBy: { createdAt: "asc" } },
        stores: { include: { _count: { select: { products: true } } } },
      },
    });
    if (!m) throw new NotFoundException("Commerçant introuvable.");
    return {
      id: m.id, businessName: m.businessName, category: m.category,
      status: m.status, isActive: m.isActive, autoPublish: m.autoPublish, rejectReason: m.rejectReason ?? undefined,
      owner: m.user ? `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() : null, phone: m.user?.phone,
      documents: (m as any).documents.map((d: any) => ({ id: d.id, type: d.type, url: d.url, status: d.status })),
      stores: m.stores.map((st: any) => ({ id: st.id, name: st.name, category: st.category, isOpen: st.isOpen, productCount: st._count.products })),
    };
  }

  async adminSetActive(id: string, isActive: boolean) {
    const m = await this.prisma.merchant.findUnique({ where: { id } });
    if (!m) throw new NotFoundException("Commerçant introuvable.");
    const upd = await this.prisma.merchant.update({ where: { id }, data: { isActive } });
    return { id: upd.id, isActive: upd.isActive };
  }

  /// Validation / suspension d'un commerçant (APPROVED → actif ; REJECTED/SUSPENDED/PENDING → inactif).
  async adminSetStatus(id: string, status: string, reason?: string) {
    const s = String(status).toUpperCase();
    if (!["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].includes(s)) {
      throw new BadRequestException("Statut invalide.");
    }
    const m = await this.prisma.merchant.findUnique({ where: { id } });
    if (!m) throw new NotFoundException("Commerçant introuvable.");
    const upd = await this.prisma.merchant.update({
      where: { id },
      data: { status: s as any, isActive: s === "APPROVED", rejectReason: s === "REJECTED" ? (reason ?? null) : null },
    });
    return { id: upd.id, status: upd.status, isActive: upd.isActive };
  }

  async adminSetAutoPublish(id: string, autoPublish: boolean) {
    const m = await this.prisma.merchant.findUnique({ where: { id } });
    if (!m) throw new NotFoundException("Commerçant introuvable.");
    const upd = await this.prisma.merchant.update({ where: { id }, data: { autoPublish: !!autoPublish } });
    return { id: upd.id, autoPublish: upd.autoPublish };
  }

  async adminVerifyDocument(docId: string, status: string) {
    const s = String(status).toUpperCase();
    if (!["PENDING", "VERIFIED", "REJECTED"].includes(s)) throw new BadRequestException("Statut de document invalide.");
    const doc = await this.prisma.merchantDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException("Document introuvable.");
    const upd = await this.prisma.merchantDocument.update({ where: { id: docId }, data: { status: s as any } });
    return { id: upd.id, type: upd.type, status: upd.status };
  }

  // ── Modération des produits (validation admin) ──────────────────────
  async adminListPendingProducts(page: number, limit: number) {
    const where = { status: "PENDING_REVIEW" as any };
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
        include: { store: { include: { merchant: { include: { user: true } } } } },
      }),
      this.prisma.product.count({ where }),
    ]);
    const data = rows.map((p: any) => ({
      id: p.id, name: p.name, price: money(p.price), imageUrl: p.imageUrl, status: p.status,
      storeName: p.store?.name,
      merchant: p.store?.merchant?.user
        ? `${p.store.merchant.user.firstName ?? ""} ${p.store.merchant.user.lastName ?? ""}`.trim() || null
        : null,
    }));
    return paginate(data, total, page, limit);
  }

  async adminModerateProduct(productId: string, status: string) {
    const s = String(status).toUpperCase();
    if (!["PUBLISHED", "REJECTED"].includes(s)) throw new BadRequestException("Décision invalide (PUBLISHED | REJECTED).");
    const p = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!p) throw new NotFoundException("Produit introuvable.");
    const upd = await this.prisma.product.update({ where: { id: productId }, data: { status: s as any } });
    return { id: upd.id, status: upd.status };
  }

  // ── Wallet commerçant (ventes MoMo vs espèces + ledger + versements) ──
  private static readonly EARNED_STATUSES = [
    "CONFIRMED", "PREPARING", "READY", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED",
  ];
  private static readonly CASH_METHODS = ["CASH"];

  private async storeIdsFor(merchantId: string) {
    const stores = await this.prisma.store.findMany({ where: { merchantId }, select: { id: true } });
    return stores.map((s) => s.id);
  }

  async walletView(userId: string) {
    const m = await this.merchantFor(userId);
    const storeIds = await this.storeIdsFor(m.id);
    const orders = storeIds.length
      ? await this.prisma.order.findMany({
          where: { storeId: { in: storeIds }, status: { in: MerchantsService.EARNED_STATUSES as any } },
          orderBy: { createdAt: "desc" },
          include: { customer: true },
        })
      : [];
    const payouts = await this.prisma.merchantPayout.findMany({
      where: { merchantId: m.id }, orderBy: { createdAt: "desc" },
    });

    let cash = 0, digital = 0;
    for (const o of orders) {
      if (MerchantsService.CASH_METHODS.includes(o.paymentMethod ?? "")) cash += o.subtotal;
      else digital += o.subtotal;
    }
    const totalEarned = cash + digital;
    const paidOut = payouts.reduce((s, p) => s + p.amount, 0);
    const balance = totalEarned - paidOut;

    const ledger = [
      ...orders.map((o: any) => ({
        kind: MerchantsService.CASH_METHODS.includes(o.paymentMethod ?? "") ? "saleCash" : "sale",
        label: `Commande ${o.reference}`,
        subtitle: o.customer ? [o.customer.firstName, o.customer.lastName].filter(Boolean).join(" ") || null : null,
        amount: money(o.subtotal),
        method: o.paymentMethod ?? "—",
        createdAt: o.createdAt,
      })),
      ...payouts.map((p) => ({
        kind: "payout", label: "Versement", subtitle: p.method,
        amount: money(p.amount), method: p.method, createdAt: p.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 40);

    return {
      balance: money(balance),
      cash: money(cash),
      digital: money(digital),
      totalEarned: money(totalEarned),
      paidOut: money(paidOut),
      salesCount: orders.length,
      ledger,
    };
  }

  async payout(userId: string, amount: number, method: string) {
    const m = await this.ownerMerchantFor(userId);
    const view = await this.walletView(userId);
    const balance = view.balance.amount;
    const amt = Math.round(Number(amount));
    if (!amt || amt <= 0) throw new BadRequestException("Montant invalide.");
    if (amt > balance) throw new BadRequestException("Montant supérieur au solde à verser.");
    const count = await this.prisma.merchantPayout.count();
    const p = await this.prisma.merchantPayout.create({
      data: {
        merchantId: m.id, amount: amt, method: String(method || "ORANGE_MONEY"),
        reference: `PO-2026-${String(count + 1).padStart(6, "0")}`,
      },
    });
    return { id: p.id, amount: money(p.amount), method: p.method, reference: p.reference, balanceAfter: money(balance - amt) };
  }

  async reports(userId: string, storeId: string) {
    await this.ownStore(userId, storeId);
    const productCount = await this.prisma.product.count({ where: { storeId } });
    return { storeId, productCount, note: "Rapport financier détaillé -> à enrichir (jalon P6 analytics)." };
  }
}

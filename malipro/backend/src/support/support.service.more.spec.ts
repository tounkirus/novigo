import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { SupportService } from "./support.service";

const notifications = { create: jest.fn() } as any;
beforeEach(() => jest.clearAllMocks());

describe("SupportService (couverture complète)", () => {
  it("create : crée un ticket avec message initial", async () => {
    const prisma = { supportTicket: { create: jest.fn().mockResolvedValue({ id: "t1", userId: "me", subject: "S", category: "C", status: "OPEN", messages: [{ id: "m1", body: "b" }] }) } } as any;
    const res = await new SupportService(prisma, notifications).create("me", { subject: "S", category: "C", body: "b" });
    expect(res.id).toBe("t1");
    expect(prisma.supportTicket.create).toHaveBeenCalled();
  });

  it("listMine : pagine les tickets de l'utilisateur", async () => {
    const prisma = { supportTicket: { findMany: jest.fn().mockResolvedValue([{ id: "t1" }]), count: jest.fn().mockResolvedValue(1) } } as any;
    const res = await new SupportService(prisma, notifications).listMine("me", 1, 10);
    expect(res.data).toHaveLength(1);
  });

  it("getOne : introuvable -> NotFound", async () => {
    const prisma = { supportTicket: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new SupportService(prisma, notifications).getOne("me", "t1", false)).rejects.toThrow(NotFoundException);
  });

  it("getOne : autre utilisateur non-staff -> Forbidden", async () => {
    const prisma = { supportTicket: { findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "other" }) } } as any;
    await expect(new SupportService(prisma, notifications).getOne("me", "t1", false)).rejects.toThrow(ForbiddenException);
  });

  it("getOne : staff peut voir le ticket d'autrui", async () => {
    const prisma = { supportTicket: { findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "other", messages: [] }) } } as any;
    expect((await new SupportService(prisma, notifications).getOne("agent", "t1", true)).id).toBe("t1");
  });

  it("addMessage : introuvable -> NotFound ; autre user -> Forbidden", async () => {
    const p1 = { supportTicket: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new SupportService(p1, notifications).addMessage("me", "t1", "x", false)).rejects.toThrow(NotFoundException);
    const p2 = { supportTicket: { findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "other", status: "OPEN" }) } } as any;
    await expect(new SupportService(p2, notifications).addMessage("me", "t1", "x", false)).rejects.toThrow(ForbiddenException);
  });

  it("addMessage : réponse staff -> PENDING + notification", async () => {
    const prisma = {
      supportTicket: { findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "u", status: "OPEN" }), update: jest.fn() },
      supportMessage: { create: jest.fn().mockResolvedValue({ id: "m1", ticketId: "t1", senderId: "agent", body: "r", isStaff: true }) },
    } as any;
    const res = await new SupportService(prisma, notifications).addMessage("agent", "t1", "r", true);
    expect(res.isStaff).toBe(true);
    expect(prisma.supportTicket.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "PENDING" } }));
    expect(notifications.create).toHaveBeenCalled();
  });

  it("addMessage : message client ne notifie pas", async () => {
    const prisma = {
      supportTicket: { findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "me", status: "OPEN" }), update: jest.fn() },
      supportMessage: { create: jest.fn().mockResolvedValue({ id: "m2", isStaff: false }) },
    } as any;
    await new SupportService(prisma, notifications).addMessage("me", "t1", "b", false);
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it("listAll : filtre par statut", async () => {
    const prisma = { supportTicket: { findMany: jest.fn().mockResolvedValue([{ id: "t1" }]), count: jest.fn().mockResolvedValue(1) } } as any;
    await new SupportService(prisma, notifications).listAll(1, 10, "OPEN");
    expect(prisma.supportTicket.findMany.mock.calls[0][0].where).toEqual({ status: "OPEN" });
  });

  it("updateTicket : introuvable -> NotFound", async () => {
    const prisma = { supportTicket: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new SupportService(prisma, notifications).updateTicket("t1", { status: "CLOSED" })).rejects.toThrow(NotFoundException);
  });

  it("updateTicket : changement de statut -> notifie", async () => {
    const prisma = {
      supportTicket: { findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "u", status: "OPEN", priority: "NORMAL" }), update: jest.fn().mockResolvedValue({ id: "t1", status: "CLOSED" }) },
    } as any;
    await new SupportService(prisma, notifications).updateTicket("t1", { status: "CLOSED" });
    expect(notifications.create).toHaveBeenCalled();
  });

  it("updateTicket : sans changement de statut -> pas de notif", async () => {
    const prisma = {
      supportTicket: { findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "u", status: "OPEN", priority: "NORMAL" }), update: jest.fn().mockResolvedValue({ id: "t1", status: "OPEN" }) },
    } as any;
    await new SupportService(prisma, notifications).updateTicket("t1", { priority: "HIGH" });
    expect(notifications.create).not.toHaveBeenCalled();
  });
});

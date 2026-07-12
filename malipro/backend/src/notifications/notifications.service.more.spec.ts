import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

const realtime = { notifyUser: jest.fn() } as any;
const push = { sendToTokens: jest.fn() } as any;
beforeEach(() => jest.clearAllMocks());

describe("NotificationsService (couverture complète)", () => {
  it("create : persiste, pousse WS et push si device", async () => {
    const prisma = {
      notificationPreference: { findUnique: jest.fn().mockResolvedValue(null) },
      notification: { create: jest.fn().mockResolvedValue({ id: "n1", type: "X", title: "T", body: "B", data: null, readAt: null, createdAt: new Date(0) }) },
      deviceToken: { findMany: jest.fn().mockResolvedValue([{ token: "tok1" }]) },
    } as any;
    const res = await new NotificationsService(prisma, realtime, push).create("me", "X", "T", "B");
    expect(res.id).toBe("n1");
    expect(realtime.notifyUser).toHaveBeenCalled();
    expect(push.sendToTokens).toHaveBeenCalledWith(["tok1"], "T", "B");
  });

  it("create : broadcast avec marketing opt-out -> skipped", async () => {
    const prisma = { notificationPreference: { findUnique: jest.fn().mockResolvedValue({ marketing: false, inApp: true, push: true }) } } as any;
    const res = await new NotificationsService(prisma, realtime, push).create("me", "BROADCAST", "T", "B");
    expect(res).toEqual({ skipped: true });
  });

  it("create : sans device token -> pas de push", async () => {
    const prisma = {
      notificationPreference: { findUnique: jest.fn().mockResolvedValue({ inApp: false, push: true, marketing: true }) },
      notification: { create: jest.fn().mockResolvedValue({ id: "n2", readAt: null, createdAt: new Date(0) }) },
      deviceToken: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    await new NotificationsService(prisma, realtime, push).create("me", "X", "T", "B");
    expect(realtime.notifyUser).not.toHaveBeenCalled();
    expect(push.sendToTokens).not.toHaveBeenCalled();
  });

  it("getPreferences : renvoie les défauts si absent", async () => {
    const prisma = { notificationPreference: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    const res = await new NotificationsService(prisma, realtime, push).getPreferences("me");
    expect(res).toMatchObject({ push: true, email: true, sms: true, inApp: true, marketing: true });
  });

  it("updatePreferences : filtre les undefined et upsert", async () => {
    const prisma = { notificationPreference: { upsert: jest.fn().mockResolvedValue({ push: false, email: true, sms: true, inApp: true, marketing: false }) } } as any;
    const res = await new NotificationsService(prisma, realtime, push).updatePreferences("me", { push: false, marketing: false, email: undefined });
    expect(res.push).toBe(false);
    const arg = prisma.notificationPreference.upsert.mock.calls[0][0];
    expect(arg.update).toEqual({ push: false, marketing: false });
  });

  it("list / unreadCount", async () => {
    const prisma = {
      notification: {
        findMany: jest.fn().mockResolvedValue([{ id: "n1", readAt: null, createdAt: new Date(0) }]),
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(3),
      },
    } as any;
    const svc = new NotificationsService(prisma, realtime, push);
    expect((await svc.list("me", 1, 10)).data).toHaveLength(1);
    expect(await svc.unreadCount("me")).toEqual({ count: 3 });
  });

  it("markRead : introuvable -> NotFound ; autrui -> Forbidden ; ok", async () => {
    const p1 = { notification: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new NotificationsService(p1, realtime, push).markRead("me", "n1")).rejects.toThrow(NotFoundException);
    const p2 = { notification: { findUnique: jest.fn().mockResolvedValue({ id: "n1", userId: "other" }) } } as any;
    await expect(new NotificationsService(p2, realtime, push).markRead("me", "n1")).rejects.toThrow(ForbiddenException);
    const p3 = { notification: { findUnique: jest.fn().mockResolvedValue({ id: "n1", userId: "me" }), update: jest.fn() } } as any;
    expect(await new NotificationsService(p3, realtime, push).markRead("me", "n1")).toEqual({ id: "n1", read: true });
  });

  it("markAllRead : renvoie le nombre mis à jour", async () => {
    const prisma = { notification: { updateMany: jest.fn().mockResolvedValue({ count: 5 }) } } as any;
    expect(await new NotificationsService(prisma, realtime, push).markAllRead("me")).toEqual({ updated: 5 });
  });

  it("broadcast : itère sur les utilisateurs ciblés par rôle", async () => {
    const prisma = {
      user: { findMany: jest.fn().mockResolvedValue([{ id: "u1" }, { id: "u2" }]) },
      notificationPreference: { findUnique: jest.fn().mockResolvedValue({ marketing: true, inApp: false, push: false }) },
      notification: { create: jest.fn().mockResolvedValue({ id: "n", readAt: null, createdAt: new Date(0) }) },
      deviceToken: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const res = await new NotificationsService(prisma, realtime, push).broadcast("T", "B", "CUSTOMER");
    expect(res).toEqual({ sent: 2 });
    expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({ roles: { has: "CUSTOMER" } });
  });
});

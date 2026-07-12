import { ForbiddenException } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

const realtime = { notifyUser: jest.fn() } as any;
const push = { sendToTokens: jest.fn() } as any;

describe("NotificationsService", () => {
  it("persiste et pousse la notification", async () => {
    const prisma = {
      notification: { create: jest.fn().mockResolvedValue({ id: "n1", type: "T", title: "A", body: "B", readAt: null }) },
      deviceToken: { findMany: jest.fn().mockResolvedValue([{ token: "tok1" }]) },
      notificationPreference: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    const res = await new NotificationsService(prisma, realtime, push).create("u1", "T", "A", "B");
    expect(res.read).toBe(false);
    expect(realtime.notifyUser).toHaveBeenCalledWith("u1", expect.objectContaining({ title: "A" }));
    expect(push.sendToTokens).toHaveBeenCalledWith(["tok1"], "A", "B");
  });

  it("refuse de lire la notification d'autrui", async () => {
    const prisma = { notification: { findUnique: jest.fn().mockResolvedValue({ id: "n1", userId: "other" }) } } as any;
    await expect(new NotificationsService(prisma, realtime, push).markRead("me", "n1")).rejects.toThrow(ForbiddenException);
  });

  it("diffuse à tous les utilisateurs d'un rôle", async () => {
    const localRealtime = { notifyUser: jest.fn() } as any;
    const prisma = {
      user: { findMany: jest.fn().mockResolvedValue([{ id: "a" }, { id: "b" }]) },
      notification: { create: jest.fn().mockResolvedValue({ id: "n", type: "BROADCAST", title: "T", body: "B", readAt: null }) },
      deviceToken: { findMany: jest.fn().mockResolvedValue([]) },
      notificationPreference: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    const res = await new NotificationsService(prisma, localRealtime, push).broadcast("T", "B", "CUSTOMER");
    expect(res.sent).toBe(2);
    expect(localRealtime.notifyUser).toHaveBeenCalledTimes(2);
  });
});

describe("NotificationsService préférences", () => {
  const push2 = { sendToTokens: jest.fn() } as any;
  const rt = { notifyUser: jest.fn() } as any;

  it("ne pousse pas si push désactivé", async () => {
    const prisma = {
      notificationPreference: { findUnique: jest.fn().mockResolvedValue({ push: false, inApp: true, marketing: true, email: true, sms: true }) },
      notification: { create: jest.fn().mockResolvedValue({ id: "n", type: "T", title: "A", body: "B", readAt: null }) },
      deviceToken: { findMany: jest.fn().mockResolvedValue([{ token: "t" }]) },
    } as any;
    await new NotificationsService(prisma, rt, push2).create("u1", "T", "A", "B");
    expect(push2.sendToTokens).not.toHaveBeenCalled();
  });

  it("ignore un broadcast si marketing désactivé", async () => {
    const prisma = {
      notificationPreference: { findUnique: jest.fn().mockResolvedValue({ push: true, inApp: true, marketing: false, email: true, sms: true }) },
      notification: { create: jest.fn() },
    } as any;
    const res: any = await new NotificationsService(prisma, rt, push2).create("u1", "BROADCAST", "Promo", "…");
    expect(res.skipped).toBe(true);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

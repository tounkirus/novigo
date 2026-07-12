import { ForbiddenException } from "@nestjs/common";
import { SupportService } from "./support.service";

const notifications = { create: jest.fn() } as any;

describe("SupportService", () => {
  it("crée un ticket avec son premier message", async () => {
    const prisma = {
      supportTicket: {
        create: jest.fn().mockResolvedValue({
          id: "t1", userId: "me", subject: "Souci", category: "ORDER", status: "OPEN",
          messages: [{ id: "m1", ticketId: "t1", senderId: "me", body: "Aidez-moi", isStaff: false }],
        }),
      },
    } as any;
    const res = await new SupportService(prisma, notifications).create("me", { subject: "Souci", category: "ORDER", body: "Aidez-moi" });
    expect(res.messages).toHaveLength(1);
    expect(res.status).toBe("OPEN");
  });

  it("refuse la consultation d'un ticket d'autrui (non-staff)", async () => {
    const prisma = { supportTicket: { findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "other", messages: [] }) } } as any;
    await expect(new SupportService(prisma, notifications).getOne("me", "t1", false)).rejects.toThrow(ForbiddenException);
  });

  it("réponse agent -> notifie le client + message isStaff", async () => {
    const prisma = {
      supportTicket: {
        findUnique: jest.fn().mockResolvedValue({ id: "t1", userId: "client", status: "OPEN" }),
        update: jest.fn().mockResolvedValue({}),
      },
      supportMessage: { create: jest.fn().mockResolvedValue({ id: "m2", ticketId: "t1", senderId: "agent", body: "Bonjour", isStaff: true }) },
    } as any;
    const res = await new SupportService(prisma, notifications).addMessage("agent", "t1", "Bonjour", true);
    expect(res.isStaff).toBe(true);
    expect(notifications.create).toHaveBeenCalledWith("client", "SUPPORT_REPLY", expect.any(String), expect.any(String), { ticketId: "t1" });
  });
});

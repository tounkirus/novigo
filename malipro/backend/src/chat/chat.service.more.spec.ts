import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ChatService } from "./chat.service";

const realtime = { emitMessage: jest.fn() } as any;
beforeEach(() => jest.clearAllMocks());

describe("ChatService (couverture complète)", () => {
  it("listConversations : pagine les conversations du membre", async () => {
    const prisma = { conversation: { findMany: jest.fn().mockResolvedValue([{ id: "c1", participantIds: ["me"] }]), count: jest.fn().mockResolvedValue(1) } } as any;
    const res = await new ChatService(prisma, realtime).listConversations("me", 1, 10);
    expect(res.data).toHaveLength(1);
    expect(prisma.conversation.findMany.mock.calls[0][0].where).toEqual({ participantIds: { has: "me" } });
  });

  it("createConversation : crée avec les deux participants", async () => {
    const prisma = { conversation: { create: jest.fn().mockResolvedValue({ id: "c1", participantIds: ["me", "you"], orderId: "o1" }) } } as any;
    const res = await new ChatService(prisma, realtime).createConversation("me", "you", "o1");
    expect(res.participantIds).toEqual(["me", "you"]);
  });

  it("listMessages : conversation introuvable -> NotFound", async () => {
    const prisma = { conversation: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ChatService(prisma, realtime).listMessages("me", "c1", 1, 10)).rejects.toThrow(NotFoundException);
  });

  it("listMessages : non participant -> Forbidden", async () => {
    const prisma = { conversation: { findUnique: jest.fn().mockResolvedValue({ id: "c1", participantIds: ["other"] }) } } as any;
    await expect(new ChatService(prisma, realtime).listMessages("me", "c1", 1, 10)).rejects.toThrow(ForbiddenException);
  });

  it("listMessages : membre -> pagine", async () => {
    const prisma = {
      conversation: { findUnique: jest.fn().mockResolvedValue({ id: "c1", participantIds: ["me"] }) },
      message: { findMany: jest.fn().mockResolvedValue([{ id: "m1" }]), count: jest.fn().mockResolvedValue(1) },
    } as any;
    expect((await new ChatService(prisma, realtime).listMessages("me", "c1", 1, 10)).data).toHaveLength(1);
  });

  it("sendMessage : crée, met à jour l'aperçu et émet en temps réel", async () => {
    const prisma = {
      conversation: { findUnique: jest.fn().mockResolvedValue({ id: "c1", participantIds: ["me"] }), update: jest.fn() },
      message: { create: jest.fn().mockResolvedValue({ id: "m1", conversationId: "c1", senderId: "me", body: "salut", createdAt: new Date(0) }) },
    } as any;
    const res = await new ChatService(prisma, realtime).sendMessage("me", "c1", "salut");
    expect(res.id).toBe("m1");
    expect(prisma.conversation.update).toHaveBeenCalledWith(expect.objectContaining({ data: { lastMessagePreview: "salut" } }));
    expect(realtime.emitMessage).toHaveBeenCalledWith("c1", expect.objectContaining({ id: "m1" }));
  });

  it("sendMessage : non participant -> Forbidden (pas d'émission)", async () => {
    const prisma = { conversation: { findUnique: jest.fn().mockResolvedValue({ id: "c1", participantIds: ["x"] }) } } as any;
    await expect(new ChatService(prisma, realtime).sendMessage("me", "c1", "x")).rejects.toThrow(ForbiddenException);
    expect(realtime.emitMessage).not.toHaveBeenCalled();
  });
});

import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ChatService } from "./chat.service";

const realtime = { emitMessage: jest.fn() } as any;

describe("ChatService.sendMessage", () => {
  it("persiste et diffuse le message", async () => {
    const prisma = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({ id: "c1", participantIds: ["me", "other"] }),
        update: jest.fn().mockResolvedValue({}),
      },
      message: { create: jest.fn().mockResolvedValue({ id: "m1", conversationId: "c1", senderId: "me", body: "Salut" }) },
    } as any;
    const res = await new ChatService(prisma, realtime).sendMessage("me", "c1", "Salut");
    expect(res.body).toBe("Salut");
    expect(realtime.emitMessage).toHaveBeenCalledWith("c1", expect.objectContaining({ body: "Salut" }));
  });

  it("refuse un non-participant", async () => {
    const prisma = {
      conversation: { findUnique: jest.fn().mockResolvedValue({ id: "c1", participantIds: ["a", "b"] }) },
    } as any;
    await expect(new ChatService(prisma, realtime).sendMessage("me", "c1", "x")).rejects.toThrow(ForbiddenException);
  });

  it("404 si conversation absente", async () => {
    const prisma = { conversation: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    await expect(new ChatService(prisma, realtime).sendMessage("me", "c1", "x")).rejects.toThrow(NotFoundException);
  });
});

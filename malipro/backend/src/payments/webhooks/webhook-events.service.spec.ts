import { WebhookEventsService } from "./webhook-events.service";

describe("WebhookEventsService.findOrCreate", () => {
  it("détecte un doublon déjà traité (anti-rejeu)", async () => {
    const prisma = {
      webhookEvent: { findUnique: jest.fn().mockResolvedValue({ id: "e1", status: "PROCESSED" }) },
    } as any;
    const res = await new WebhookEventsService(prisma).findOrCreate("wave", "{}", true, {});
    expect(res.duplicate).toBe(true);
    expect(res.event.id).toBe("e1");
  });

  it("crée un nouvel événement RECEIVED sinon", async () => {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "e2", status: "RECEIVED" }),
      },
    } as any;
    const res = await new WebhookEventsService(prisma).findOrCreate("wave", "{}", true, {});
    expect(res.duplicate).toBe(false);
    expect(prisma.webhookEvent.create).toHaveBeenCalled();
  });
});

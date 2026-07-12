import { WebhookEventsService } from "./webhook-events.service";

describe("WebhookEventsService (couverture complète)", () => {
  it("findOrCreate : nouvel événement -> create, duplicate=false", async () => {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "e1", status: "RECEIVED" }),
      },
    } as any;
    const res = await new WebhookEventsService(prisma).findOrCreate("wave", "{}", true, {});
    expect(res.duplicate).toBe(false);
    expect(res.event.id).toBe("e1");
    // hash déterministe basé sur le corps
    expect(prisma.webhookEvent.create.mock.calls[0][0].data.bodyHash).toHaveLength(64);
  });

  it("findOrCreate : existant PROCESSED -> duplicate=true", async () => {
    const prisma = { webhookEvent: { findUnique: jest.fn().mockResolvedValue({ id: "e1", status: "PROCESSED" }) } } as any;
    const res = await new WebhookEventsService(prisma).findOrCreate("wave", "{}", true, {});
    expect(res.duplicate).toBe(true);
  });

  it("findOrCreate : existant RECEIVED -> duplicate=false", async () => {
    const prisma = { webhookEvent: { findUnique: jest.fn().mockResolvedValue({ id: "e1", status: "RECEIVED" }) } } as any;
    expect((await new WebhookEventsService(prisma).findOrCreate("wave", "{}", true, {})).duplicate).toBe(false);
  });

  it("markProcessed / markFailed / markDead / get", async () => {
    const prisma = { webhookEvent: { update: jest.fn().mockResolvedValue({}), findUnique: jest.fn().mockResolvedValue({ id: "e1" }) } } as any;
    const svc = new WebhookEventsService(prisma);
    await svc.markProcessed("e1", "REF");
    expect(prisma.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PROCESSED", providerRef: "REF" }) }));
    await svc.markFailed("e1", "boom");
    expect(prisma.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
    await svc.markDead("e1", "x".repeat(600));
    const deadArg = prisma.webhookEvent.update.mock.calls[2][0];
    expect(deadArg.data.status).toBe("DEAD");
    expect(deadArg.data.error.length).toBe(500); // tronqué
    expect(await svc.get("e1")).toEqual({ id: "e1" });
  });
});

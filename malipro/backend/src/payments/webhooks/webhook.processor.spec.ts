import { WebhookProcessorService } from "./webhook.processor";

const provider = { parseWebhook: jest.fn().mockReturnValue({ providerRef: "OM-1", status: "SUCCEEDED" }) };
const registry = { byName: () => provider } as any;

describe("WebhookProcessorService.process", () => {
  it("applique le résultat et marque l'événement traité", async () => {
    const payments = { applyWebhookResult: jest.fn().mockResolvedValue({ processed: true }) } as any;
    const events = {
      get: jest.fn().mockResolvedValue({ id: "e1", provider: "orange-money", payload: {}, status: "RECEIVED" }),
      markProcessed: jest.fn(),
    } as any;
    await new WebhookProcessorService(payments, registry, events).process("e1");
    expect(payments.applyWebhookResult).toHaveBeenCalledWith("OM-1", "SUCCEEDED");
    expect(events.markProcessed).toHaveBeenCalledWith("e1", "OM-1");
  });

  it("ignore un événement déjà traité", async () => {
    const payments = { applyWebhookResult: jest.fn() } as any;
    const events = { get: jest.fn().mockResolvedValue({ id: "e1", status: "PROCESSED" }), markProcessed: jest.fn() } as any;
    await new WebhookProcessorService(payments, registry, events).process("e1");
    expect(payments.applyWebhookResult).not.toHaveBeenCalled();
  });
});

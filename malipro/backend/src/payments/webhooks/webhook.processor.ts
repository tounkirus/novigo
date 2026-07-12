import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PaymentsService } from "../payments.service";
import { PaymentProviderRegistry } from "../providers/provider-registry";
import { WebhookEventsService } from "./webhook-events.service";

/// Traite un WebhookEvent persisté : parse -> applique au paiement -> marque traité.
/// Appelé par le worker BullMQ (ou en inline sans Redis).
@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger("WebhookProcessor");
  constructor(
    private payments: PaymentsService,
    private registry: PaymentProviderRegistry,
    private events: WebhookEventsService,
  ) {}

  async process(eventId: string): Promise<void> {
    const event = await this.events.get(eventId);
    if (!event) throw new NotFoundException("WebhookEvent introuvable.");
    if (event.status === "PROCESSED") return;

    const provider = this.registry.byName(event.provider);
    const { providerRef, status } = provider.parseWebhook(event.payload);
    await this.payments.applyWebhookResult(providerRef, status);
    await this.events.markProcessed(eventId, providerRef);
    this.logger.log(`Webhook ${eventId} traité (${event.provider}, ${status}).`);
  }
}

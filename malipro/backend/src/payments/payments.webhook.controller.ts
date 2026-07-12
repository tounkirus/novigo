import {
  Body, Controller, Headers, HttpCode, Param, Post, UnauthorizedException,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { PaymentProviderRegistry } from "./providers/provider-registry";
import { WebhookEventsService } from "./webhooks/webhook-events.service";
import { WebhookQueueService } from "./webhooks/webhook.queue";

/// Endpoints publics opérateurs (pas de JWT). Vérifie la signature, dédoublonne
/// (anti-rejeu), persiste, puis met en file pour traitement asynchrone robuste.
@Controller("payments/webhooks")
@SkipThrottle()
export class PaymentsWebhookController {
  constructor(
    private registry: PaymentProviderRegistry,
    private events: WebhookEventsService,
    private queue: WebhookQueueService,
  ) {}

  @Post(":provider")
  @HttpCode(200)
  async webhook(
    @Param("provider") provider: string,
    @Headers("x-signature") signature: string | undefined,
    @Body() body: any,
  ) {
    const raw = JSON.stringify(body ?? {});
    const prov = this.registry.byName(provider);
    if (!prov.verifySignature(raw, signature)) {
      throw new UnauthorizedException("Signature de webhook invalide.");
    }
    const { event, duplicate } = await this.events.findOrCreate(provider, raw, true, body);
    if (duplicate) return { received: true, duplicate: true, eventId: event.id };
    await this.queue.enqueue(event.id);
    return { received: true, eventId: event.id };
  }
}

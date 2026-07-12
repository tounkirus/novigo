import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsWebhookController } from "./payments.webhook.controller";
import { OrangeMoneyProvider } from "./providers/orange-money.provider";
import { WaveProvider } from "./providers/wave.provider";
import { PaymentProviderRegistry } from "./providers/provider-registry";
import { WebhookEventsService } from "./webhooks/webhook-events.service";
import { WebhookProcessorService } from "./webhooks/webhook.processor";
import { WebhookQueueService } from "./webhooks/webhook.queue";

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController, PaymentsWebhookController],
  providers: [
    PaymentsService,
    OrangeMoneyProvider,
    WaveProvider,
    PaymentProviderRegistry,
    WebhookEventsService,
    WebhookProcessorService,
    WebhookQueueService,
  ],
})
export class PaymentsModule {}

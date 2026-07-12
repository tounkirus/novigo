import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EventBusService } from "../common/events/event-bus.service";
import { RealtimeGateway } from "./realtime.gateway";

/// Consomme les événements FINANCE émis par Spring (paiements) et les ré-émet en
/// temps réel Socket.IO côté clients (ADR-5). Nest = seul émetteur temps réel.
@Injectable()
export class FinanceEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger("FinanceEvents");

  constructor(private bus: EventBusService, private realtime: RealtimeGateway) {}

  async onModuleInit(): Promise<void> {
    await this.bus.subscribe(
      "novigo.events.nest",
      ["payment.confirmed", "payment.settled", "payment.failed"],
      (routingKey, data) => {
        const orderId: string | undefined = data?.orderId;
        const customerId: string | undefined = data?.customerId;
        if (orderId) {
          this.realtime.emitToOrder(orderId, "order.updated", { event: routingKey, ...data });
        }
        if (customerId) {
          this.realtime.notifyUser(customerId, {
            type: routingKey,
            title: routingKey === "payment.failed" ? "Paiement échoué" : "Paiement confirmé",
            data,
          });
        }
        this.logger.log(`Reçu ${routingKey} (order=${orderId ?? "?"})`);
      },
    );
  }
}

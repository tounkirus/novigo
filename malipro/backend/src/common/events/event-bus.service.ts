import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

/// Exchange topic partagé Nest <-> Spring (voir ARCHITECTURE-NOVIGO.md §5).
export const NOVIGO_EXCHANGE = "novigo.events";

type Subscription = {
  queue: string;
  routingKeys: string[];
  handler: (routingKey: string, data: any) => Promise<void> | void;
};

/// Bus d'événements de domaine (RabbitMQ, topic) avec RECONNEXION automatique
/// (backoff) et ré-abonnement. Repli GRACIEUX : sans RABBITMQ_URL tout est no-op
/// (démo zéro-infra). Résilient au démarrage (broker pas encore prêt) et aux coupures.
@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("EventBus");
  private conn?: amqp.Connection;
  private channel?: amqp.Channel;
  private closing = false;
  private readonly subs: Subscription[] = [];
  private readonly url?: string;

  constructor(config: ConfigService) {
    this.url = config.get<string>("RABBITMQ_URL");
  }

  onModuleInit(): void {
    if (!this.url) {
      this.logger.warn("RABBITMQ_URL absent — bus d'événements désactivé (démo zéro-infra).");
      return;
    }
    void this.connectWithRetry(0);
  }

  private async connectWithRetry(attempt: number): Promise<void> {
    if (this.closing) return;
    try {
      this.conn = await amqp.connect(this.url!);
      this.conn.on("error", (e) => this.logger.warn(`Connexion RabbitMQ: ${e.message}`));
      this.conn.on("close", () => {
        this.channel = undefined;
        if (!this.closing) {
          this.logger.warn("Connexion RabbitMQ fermée — reconnexion…");
          setTimeout(() => void this.connectWithRetry(0), 2000);
        }
      });
      this.channel = await this.conn.createChannel();
      await this.channel.assertExchange(NOVIGO_EXCHANGE, "topic", { durable: true });
      for (const s of this.subs) await this.applySubscription(s); // ré-abonnement
      this.logger.log(`Bus connecté — exchange ${NOVIGO_EXCHANGE} (topic).`);
    } catch (e: any) {
      this.channel = undefined;
      const delay = Math.min(30000, 1000 * 2 ** attempt);
      this.logger.warn(`RabbitMQ indisponible (${e.message}) — nouvel essai dans ${delay} ms.`);
      setTimeout(() => void this.connectWithRetry(attempt + 1), delay);
    }
  }

  /// Publie un événement de domaine. Best-effort (ignoré si bus indisponible).
  async publish(routingKey: string, payload: unknown): Promise<void> {
    if (!this.channel) return;
    try {
      const body = Buffer.from(
        JSON.stringify({ event: routingKey, at: new Date().toISOString(), data: payload }),
      );
      this.channel.publish(NOVIGO_EXCHANGE, routingKey, body, {
        contentType: "application/json",
        persistent: true,
      });
    } catch (e: any) {
      this.logger.warn(`publish ${routingKey} échoué: ${e.message}`);
    }
  }

  /// Abonne un consommateur durable à des routing keys (topic). Ré-appliqué à chaque reconnexion.
  async subscribe(
    queue: string,
    routingKeys: string[],
    handler: (routingKey: string, data: any) => Promise<void> | void,
  ): Promise<void> {
    const sub: Subscription = { queue, routingKeys, handler };
    this.subs.push(sub);
    if (this.channel) await this.applySubscription(sub);
  }

  private async applySubscription(sub: Subscription): Promise<void> {
    if (!this.channel) return;
    try {
      await this.channel.assertQueue(sub.queue, { durable: true });
      for (const key of sub.routingKeys) {
        await this.channel.bindQueue(sub.queue, NOVIGO_EXCHANGE, key);
      }
      await this.channel.consume(sub.queue, async (msg) => {
        if (!msg) return;
        try {
          const parsed = JSON.parse(msg.content.toString());
          await sub.handler(msg.fields.routingKey, parsed.data ?? parsed);
          this.channel!.ack(msg);
        } catch (e: any) {
          this.logger.warn(`consume ${sub.queue} échoué: ${e.message}`);
          this.channel!.nack(msg, false, false);
        }
      });
      this.logger.log(`Abonné ${sub.queue} <= [${sub.routingKeys.join(", ")}]`);
    } catch (e: any) {
      this.logger.warn(`subscribe ${sub.queue} échoué: ${e.message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.closing = true;
    await this.channel?.close().catch(() => undefined);
    await this.conn?.close().catch(() => undefined);
  }
}

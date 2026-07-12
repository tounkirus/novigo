import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { WebhookProcessorService } from "./webhook.processor";
import { WebhookEventsService } from "./webhook-events.service";

const QUEUE = "payment-webhooks";
const DLQ = "payment-webhooks-dlq";
const MAX_ATTEMPTS = 5;

/// File asynchrone des webhooks paiement : retries + backoff + Dead Letter Queue.
/// Sans REDIS_URL, repli sur un traitement synchrone (dev).
@Injectable()
export class WebhookQueueService implements OnModuleDestroy {
  private readonly logger = new Logger("WebhookQueue");
  private queue?: Queue;
  private dlq?: Queue;
  private worker?: Worker;
  private connection?: IORedis;

  constructor(
    private config: ConfigService,
    private processor: WebhookProcessorService,
    private events: WebhookEventsService,
  ) {
    const url = this.config.get<string>("REDIS_URL");
    if (!url) {
      this.logger.warn("REDIS_URL absent — webhooks traités en synchrone (dev).");
      return;
    }
    this.connection = new IORedis(url, { maxRetriesPerRequest: null });
    this.queue = new Queue(QUEUE, { connection: this.connection });
    this.dlq = new Queue(DLQ, { connection: this.connection });
    this.worker = new Worker(
      QUEUE,
      async (job) => { await this.processor.process(job.data.eventId); },
      { connection: this.connection },
    );
    this.worker.on("failed", async (job, err) => {
      const eventId = job?.data?.eventId as string;
      if (!eventId) return;
      if ((job?.attemptsMade ?? 0) >= MAX_ATTEMPTS) {
        await this.events.markDead(eventId, err.message);
        await this.dlq?.add("dead", { eventId, error: err.message });
        this.logger.error(`Webhook ${eventId} -> DLQ après ${MAX_ATTEMPTS} tentatives.`);
      } else {
        await this.events.markFailed(eventId, err.message);
      }
    });
  }

  async enqueue(eventId: string): Promise<void> {
    if (this.queue) {
      await this.queue.add("process", { eventId }, {
        attempts: MAX_ATTEMPTS,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
      });
      return;
    }
    // Repli synchrone.
    try {
      await this.processor.process(eventId);
    } catch (e: any) {
      await this.events.markFailed(eventId, e?.message ?? "erreur");
      throw e;
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.dlq?.close();
    await this.connection?.quit();
  }
}

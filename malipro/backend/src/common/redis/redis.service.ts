import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import Redis from "ioredis";

/// Denylist de tokens + petit cache. Utilise Redis si REDIS_URL est défini,
/// sinon un fallback mémoire (dev/tests) — signalé au démarrage.
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger("Redis");
  private client?: Redis;
  private memory = new Map<string, number>(); // key -> expiry epoch ms

  constructor(private config: ConfigService) {
    const url = this.config.get<string>("REDIS_URL");
    if (url) {
      this.client = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 2 });
      this.client.on("error", (e) => this.logger.warn(`Redis: ${e.message}`));
    } else {
      this.logger.warn("REDIS_URL absent — denylist en mémoire (non partagée, dev uniquement).");
    }
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  async denylist(token: string, ttlSeconds: number): Promise<void> {
    const key = `denylist:${this.hash(token)}`;
    if (this.client) {
      await this.client.set(key, "1", "EX", ttlSeconds);
    } else {
      this.memory.set(key, Date.now() + ttlSeconds * 1000);
    }
  }

  async isDenied(token: string): Promise<boolean> {
    const key = `denylist:${this.hash(token)}`;
    if (this.client) {
      return (await this.client.exists(key)) === 1;
    }
    const exp = this.memory.get(key);
    if (!exp) return false;
    if (exp < Date.now()) { this.memory.delete(key); return false; }
    return true;
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }
}

import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class WebhookEventsService {
  constructor(private prisma: PrismaService) {}

  private hash(body: string): string {
    return createHash("sha256").update(body).digest("hex");
  }

  /// Anti-rejeu + idempotence : dédoublonne sur (provider, hash du corps).
  async findOrCreate(provider: string, rawBody: string, signatureValid: boolean, payload: any) {
    const bodyHash = this.hash(rawBody);
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { provider_bodyHash: { provider, bodyHash } },
    });
    if (existing) return { event: existing, duplicate: existing.status === "PROCESSED" };
    const event = await this.prisma.webhookEvent.create({
      data: { provider, bodyHash, signatureValid, payload, status: "RECEIVED" },
    });
    return { event, duplicate: false };
  }

  async markProcessed(id: string, providerRef?: string) {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { status: "PROCESSED", processedAt: new Date(), providerRef: providerRef ?? undefined },
    });
  }

  async markFailed(id: string, error: string) {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { status: "FAILED", attempts: { increment: 1 }, error: error.slice(0, 500) },
    });
  }

  async markDead(id: string, error: string) {
    await this.prisma.webhookEvent.update({
      where: { id }, data: { status: "DEAD", error: error.slice(0, 500) },
    });
  }

  get(id: string) {
    return this.prisma.webhookEvent.findUnique({ where: { id } });
  }
}

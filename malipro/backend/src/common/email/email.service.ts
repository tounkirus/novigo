import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailTransport } from "./email.transport";
import { EMAIL_TEMPLATES } from "./email.templates";

@Injectable()
export class EmailService {
  private readonly logger = new Logger("Email");
  constructor(private transport: EmailTransport, private prisma: PrismaService) {}

  /// Rend un gabarit, l'envoie via le transport configuré et journalise (EmailLog).
  async sendTemplate(to: string, template: keyof typeof EMAIL_TEMPLATES | string, vars: Record<string, string> = {}) {
    const factory = EMAIL_TEMPLATES[template as string];
    if (!factory) throw new Error(`Gabarit e-mail inconnu : ${template}`);
    const { subject, html } = factory(vars);
    let status = "SENT";
    let error: string | undefined;
    try {
      await this.transport.deliver(to, subject, html);
    } catch (e: any) {
      status = "FAILED"; error = String(e?.message ?? e);
      this.logger.error(`Échec envoi e-mail à ${to} : ${error}`);
    }
    await this.prisma.emailLog.create({ data: { to, subject, template: String(template), status, error } });
    return { to, template, status };
  }
}

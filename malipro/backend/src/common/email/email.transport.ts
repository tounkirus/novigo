import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

export abstract class EmailTransport {
  abstract deliver(to: string, subject: string, html: string): Promise<void>;
}

@Injectable()
export class ConsoleEmailTransport extends EmailTransport {
  private readonly logger = new Logger("Email");
  async deliver(to: string, subject: string): Promise<void> {
    this.logger.log(`EMAIL (console) -> ${to} : ${subject}`);
  }
}

/// SMTP (fonctionne aussi pour SendGrid/Amazon SES via leurs identifiants SMTP).
@Injectable()
export class SmtpEmailTransport extends EmailTransport {
  private readonly logger = new Logger("Email");
  private transporter?: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    super();
    const host = this.config.get<string>("SMTP_HOST");
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get("SMTP_PORT") ?? 587),
        secure: this.config.get("SMTP_SECURE") === "true",
        auth: this.config.get("SMTP_USER")
          ? { user: this.config.get("SMTP_USER"), pass: this.config.get("SMTP_PASS") }
          : undefined,
      });
    }
  }

  async deliver(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) { this.logger.warn("SMTP_HOST absent — email non envoyé."); return; }
    await this.transporter.sendMail({
      from: this.config.get("EMAIL_FROM") ?? "NOVIGO <no-reply@novigo.ml>",
      to, subject, html,
    });
  }
}

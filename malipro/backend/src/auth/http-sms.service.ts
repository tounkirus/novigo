import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SmsService } from "./sms.service";

/// Passerelle SMS via API HTTP générique (Orange SMS API, Twilio-like...).
/// Activée par SMS_PROVIDER=http ; nécessite SMS_HTTP_URL (+ SMS_HTTP_TOKEN).
@Injectable()
export class HttpSmsService extends SmsService {
  private readonly logger = new Logger("SMS");
  constructor(private config: ConfigService) { super(); }

  async send(phone: string, message: string): Promise<void> {
    const url = this.config.get<string>("SMS_HTTP_URL");
    if (!url) { this.logger.warn("SMS_HTTP_URL absent — SMS non envoyé."); return; }
    const token = this.config.get<string>("SMS_HTTP_TOKEN");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ to: phone, message }),
      });
      if (!res.ok) this.logger.warn(`SMS HTTP ${res.status} pour ${phone}`);
    } catch (e) {
      this.logger.error(`Échec envoi SMS : ${e}`);
    }
  }
}

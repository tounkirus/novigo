import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SmsService } from "./sms.service";

/// Passerelle SMS Twilio. Activée par SMS_PROVIDER=twilio.
/// Requiert TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM.
@Injectable()
export class TwilioSmsService extends SmsService {
  private readonly logger = new Logger("SMS");
  constructor(private config: ConfigService) { super(); }

  async send(phone: string, message: string): Promise<void> {
    const sid = this.config.get<string>("TWILIO_ACCOUNT_SID");
    const token = this.config.get<string>("TWILIO_AUTH_TOKEN");
    const from = this.config.get<string>("TWILIO_FROM");
    if (!sid || !token || !from) { this.logger.warn("Twilio non configuré — SMS non envoyé."); return; }
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const body = new URLSearchParams({ To: phone, From: from, Body: message });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) this.logger.warn(`Twilio ${res.status} pour ${phone}`);
    } catch (e) {
      this.logger.error(`Échec Twilio : ${e}`);
    }
  }
}

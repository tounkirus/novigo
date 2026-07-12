import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SmsService } from "./sms.service";

/// Passerelle SMS Infobip. Activée par SMS_PROVIDER=infobip.
/// Requiert INFOBIP_BASE_URL + INFOBIP_API_KEY (+ INFOBIP_SENDER).
@Injectable()
export class InfobipSmsService extends SmsService {
  private readonly logger = new Logger("SMS");
  constructor(private config: ConfigService) { super(); }

  async send(phone: string, message: string): Promise<void> {
    const base = this.config.get<string>("INFOBIP_BASE_URL");
    const apiKey = this.config.get<string>("INFOBIP_API_KEY");
    if (!base || !apiKey) { this.logger.warn("Infobip non configuré — SMS non envoyé."); return; }
    try {
      const res = await fetch(`${base}/sms/2/text/advanced`, {
        method: "POST",
        headers: { Authorization: `App ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          messages: [{
            destinations: [{ to: phone.replace("+", "") }],
            from: this.config.get("INFOBIP_SENDER") ?? "NOVIGO",
            text: message,
          }],
        }),
      });
      if (!res.ok) this.logger.warn(`Infobip ${res.status} pour ${phone}`);
    } catch (e) {
      this.logger.error(`Échec Infobip : ${e}`);
    }
  }
}

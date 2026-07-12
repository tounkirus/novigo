import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as http2 from "http2";
import { PushService } from "./push.service";

/// Push APNs (iOS) via HTTP/2. Activé par PUSH_PROVIDER=apns.
/// Requiert APNS_TOPIC + un jeton d'auth provider (APNS_AUTH_TOKEN).
/// [À COMPLÉTER] génération du jeton ES256 depuis la clé .p8 (APNS_KEY_ID/TEAM_ID).
@Injectable()
export class ApnsPushService extends PushService {
  private readonly logger = new Logger("Push");
  constructor(private config: ConfigService) { super(); }

  async sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
    const authToken = this.config.get<string>("APNS_AUTH_TOKEN");
    const topic = this.config.get<string>("APNS_TOPIC");
    const host = this.config.get<string>("APNS_HOST") ?? "https://api.push.apple.com";
    if (!authToken || !topic || tokens.length === 0) {
      this.logger.warn("APNs non configuré ou aucun token — push ignoré.");
      return;
    }
    const client = http2.connect(host);
    try {
      await Promise.all(tokens.map((device) => new Promise<void>((resolve) => {
        const req = client.request({
          ":method": "POST",
          ":path": `/3/device/${device}`,
          authorization: `bearer ${authToken}`,
          "apns-topic": topic,
          "apns-push-type": "alert",
        });
        req.on("response", () => resolve());
        req.on("error", (e) => { this.logger.warn(`APNs: ${e.message}`); resolve(); });
        req.end(JSON.stringify({ aps: { alert: { title, body } }, ...(data ?? {}) }));
      })));
    } catch (e) {
      this.logger.error(`Échec APNs : ${e}`);
    } finally {
      client.close();
    }
  }
}

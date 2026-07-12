import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export abstract class PushService {
  abstract sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>;
}

@Injectable()
export class ConsolePushService extends PushService {
  private readonly logger = new Logger("Push");
  async sendToTokens(tokens: string[], title: string): Promise<void> {
    this.logger.log(`PUSH (console) -> ${tokens.length} appareil(s) : ${title}`);
  }
}

/// FCM. [À COMPLÉTER] migrer vers HTTP v1 (OAuth service account) ; ici : endpoint legacy
/// avec clé serveur (FCM_SERVER_KEY) pour poser la structure.
@Injectable()
export class FcmPushService extends PushService {
  private readonly logger = new Logger("Push");
  constructor(private config: ConfigService) { super(); }

  async sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
    const key = this.config.get<string>("FCM_SERVER_KEY");
    if (!key || tokens.length === 0) { this.logger.warn("FCM_SERVER_KEY absent ou aucun token — push ignoré."); return; }
    try {
      const res = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: { Authorization: `key=${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ registration_ids: tokens, notification: { title, body }, data }),
      });
      if (!res.ok) this.logger.warn(`FCM ${res.status}`);
    } catch (e) {
      this.logger.error(`Échec push FCM : ${e}`);
    }
  }
}

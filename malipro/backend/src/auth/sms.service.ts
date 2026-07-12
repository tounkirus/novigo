import { Injectable, Logger } from "@nestjs/common";

export abstract class SmsService {
  abstract send(phone: string, message: string): Promise<void>;
}

@Injectable()
export class ConsoleSmsService extends SmsService {
  private readonly logger = new Logger("SMS");
  async send(phone: string, message: string): Promise<void> {
    // [À remplacer] : intégrer une passerelle réelle (Orange SMS API, Twilio, etc.).
    this.logger.log(`SMS -> ${phone} : ${message}`);
  }
}

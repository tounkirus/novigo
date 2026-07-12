import { ConfigService } from "@nestjs/config";
import { InfobipSmsService } from "./infobip-sms.service";
import { TwilioSmsService } from "./twilio-sms.service";

const emptyConfig = { get: () => undefined } as unknown as ConfigService;

describe("Variantes SMS (sans identifiants)", () => {
  it("Infobip : no-op sans configuration", async () => {
    await expect(new InfobipSmsService(emptyConfig).send("+22370000000", "hi")).resolves.toBeUndefined();
  });
  it("Twilio : no-op sans configuration", async () => {
    await expect(new TwilioSmsService(emptyConfig).send("+22370000000", "hi")).resolves.toBeUndefined();
  });
});

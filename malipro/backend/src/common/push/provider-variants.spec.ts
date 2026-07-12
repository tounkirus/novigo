import { ConfigService } from "@nestjs/config";
import { ApnsPushService } from "./apns-push.service";

const emptyConfig = { get: () => undefined } as unknown as ConfigService;

describe("Variantes fournisseurs (sans identifiants)", () => {
  it("APNs : no-op sans configuration", async () => {
    await expect(new ApnsPushService(emptyConfig).sendToTokens(["t1"], "T", "B")).resolves.toBeUndefined();
  });
});

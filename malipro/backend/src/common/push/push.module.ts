import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PushService, ConsolePushService, FcmPushService } from "./push.service";
import { ApnsPushService } from "./apns-push.service";

@Global()
@Module({
  providers: [
    ConsolePushService,
    FcmPushService,
    ApnsPushService,
    {
      provide: PushService,
      inject: [ConfigService, ConsolePushService, FcmPushService, ApnsPushService],
      useFactory: (cfg: ConfigService, consolePush: ConsolePushService, fcm: FcmPushService, apns: ApnsPushService) => {
        switch (cfg.get("PUSH_PROVIDER")) {
          case "fcm": return fcm;
          case "apns": return apns;
          default: return consolePush;
        }
      },
    },
  ],
  exports: [PushService],
})
export class PushModule {}

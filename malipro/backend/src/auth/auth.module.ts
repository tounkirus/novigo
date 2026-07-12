import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { ConfigService } from "@nestjs/config";
import { SmsService, ConsoleSmsService } from "./sms.service";
import { HttpSmsService } from "./http-sms.service";
import { InfobipSmsService } from "./infobip-sms.service";
import { TwilioSmsService } from "./twilio-sms.service";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    HttpSmsService,
    ConsoleSmsService,
    InfobipSmsService,
    TwilioSmsService,
    {
      provide: SmsService,
      inject: [ConfigService, ConsoleSmsService, HttpSmsService, InfobipSmsService, TwilioSmsService],
      useFactory: (
        cfg: ConfigService,
        consoleSms: ConsoleSmsService,
        httpSms: HttpSmsService,
        infobip: InfobipSmsService,
        twilio: TwilioSmsService,
      ) => {
        switch (cfg.get("SMS_PROVIDER")) {
          case "http": return httpSms;
          case "infobip": return infobip;
          case "twilio": return twilio;
          default: return consoleSms;
        }
      },
    },
  ],
})
export class AuthModule {}

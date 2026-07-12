import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service";
import { EmailTransport, ConsoleEmailTransport, SmtpEmailTransport } from "./email.transport";

@Global()
@Module({
  providers: [
    EmailService,
    ConsoleEmailTransport,
    SmtpEmailTransport,
    {
      provide: EmailTransport,
      inject: [ConfigService, ConsoleEmailTransport, SmtpEmailTransport],
      useFactory: (cfg: ConfigService, consoleT: ConsoleEmailTransport, smtp: SmtpEmailTransport) =>
        cfg.get("EMAIL_PROVIDER") === "smtp" ? smtp : consoleT,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}

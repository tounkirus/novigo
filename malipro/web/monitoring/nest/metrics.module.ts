import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { MetricsController } from "./metrics.controller";
import { HealthController } from "./health.controller";
import { MetricsInterceptor } from "./metrics.interceptor";

// Enregistrer une seule fois (ex. dans AppModule > imports).
@Global()
@Module({
  controllers: [MetricsController, HealthController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: MetricsInterceptor }],
})
export class MetricsModule {}

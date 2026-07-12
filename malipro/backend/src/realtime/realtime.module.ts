import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { RealtimeGateway } from "./realtime.gateway";
import { FinanceEventsConsumer } from "./finance-events.consumer";

@Module({
  imports: [JwtModule.register({})],
  providers: [RealtimeGateway, FinanceEventsConsumer],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}

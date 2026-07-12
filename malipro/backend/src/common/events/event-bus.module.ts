import { Global, Module } from "@nestjs/common";
import { EventBusService } from "./event-bus.service";

/// Global : le bus est injectable partout sans réimport (comme RedisModule).
@Global()
@Module({ providers: [EventBusService], exports: [EventBusService] })
export class EventBusModule {}

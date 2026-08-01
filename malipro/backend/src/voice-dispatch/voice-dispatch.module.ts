import { Global, Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { VoiceDispatchService } from "./voice-dispatch.service";
import { VoiceDispatchController } from "./voice-dispatch.controller";

/// Annonces vocales. Module global : le Brain déclenche l'annonce au moment où
/// il attribue une mission, sans dépendance croisée entre modules métier.
@Global()
@Module({
  imports: [RealtimeModule],
  controllers: [VoiceDispatchController],
  providers: [VoiceDispatchService],
  exports: [VoiceDispatchService],
})
export class VoiceDispatchModule {}

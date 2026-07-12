import { Module } from "@nestjs/common";
import { ArtisansService } from "./artisans.service";
import { ArtisansController } from "./artisans.controller";
import { ArtisansAdminController } from "./artisans.admin.controller";
import { ArtisansPublicController } from "./artisans.public.controller";
// ArtisansController (/artisans/me) AVANT ArtisansPublicController (/artisans/:id)
// pour que la route /artisans/me prime sur /artisans/:id.
@Module({
  controllers: [ArtisansController, ArtisansAdminController, ArtisansPublicController],
  providers: [ArtisansService],
})
export class ArtisansModule {}

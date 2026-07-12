import { Global, Module } from "@nestjs/common";
import { StorageService, MinioStorageService } from "./storage.service";

@Global()
@Module({
  providers: [{ provide: StorageService, useClass: MinioStorageService }],
  exports: [StorageService],
})
export class StorageModule {}

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client as MinioClient } from "minio";

/// Abstraction stockage objets (remplaçable par un mock en test).
export abstract class StorageService {
  abstract upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
}

@Injectable()
export class MinioStorageService extends StorageService implements OnModuleInit {
  private readonly logger = new Logger("Storage");
  private client!: MinioClient;
  private bucket!: string;
  private publicUrl!: string;

  constructor(private config: ConfigService) {
    super();
  }

  async onModuleInit() {
    this.bucket = this.config.get<string>("MINIO_BUCKET") ?? "novigo";
    this.publicUrl = this.config.get<string>("MINIO_PUBLIC_URL") ?? "http://localhost:9000";
    this.client = new MinioClient({
      endPoint: this.config.get<string>("MINIO_ENDPOINT") ?? "localhost",
      port: Number(this.config.get("MINIO_PORT") ?? 9000),
      useSSL: this.config.get("MINIO_USE_SSL") === "true",
      accessKey: this.config.get<string>("MINIO_ACCESS_KEY") ?? "novigo",
      secretKey: this.config.get<string>("MINIO_SECRET_KEY") ?? "novigo-secret",
    });
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) await this.client.makeBucket(this.bucket, "us-east-1");
    } catch (e) {
      this.logger.warn(`Bucket non initialisé : ${e}`);
    }
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      "Content-Type": contentType,
    });
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }
}

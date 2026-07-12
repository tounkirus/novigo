import "reflect-metadata";
import "./tracing";
import { JsonLogger } from "./common/logging/json.logger";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  if (process.env.LOG_FORMAT === "json") app.useLogger(new JsonLogger());

  // Toutes les routes métier sous /api/v1 (le contrat). /metrics et /health restent à la racine.
  app.setGlobalPrefix("api/v1", { exclude: ["metrics", "health", "health/ready"] });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false })
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`NOVIGO API sur http://0.0.0.0:${port}/api/v1`);
}
bootstrap();

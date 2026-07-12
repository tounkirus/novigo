# Intégration monitoring — NestJS

## Dépendances
```bash
npm i prom-client nestjs-pino pino-http
npm i -D pino-pretty
```

## Câblage (AppModule)
```ts
import { MetricsModule } from "./monitoring/metrics.module";
import { LoggerModule } from "nestjs-pino";
import { loggerConfig } from "./monitoring/logger";

@Module({
  imports: [LoggerModule.forRoot(loggerConfig), MetricsModule /* ... */],
})
export class AppModule {}
```

Expose :
- `GET /metrics` — format Prometheus (RED sur toutes les routes).
- `GET /health` et `GET /health/ready` — sondes liveness/readiness (K8s).

> En production, restreindre `/metrics` au réseau interne (NetworkPolicy) ou derrière l'API Gateway.

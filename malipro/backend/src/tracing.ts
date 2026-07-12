// Tracing distribué OpenTelemetry. Doit être importé EN PREMIER (avant AppModule)
// pour instrumenter http/express/pg. Activé uniquement si OTEL_ENABLED=true.
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

let sdk: NodeSDK | undefined;

export function startTracing(): void {
  if (process.env.OTEL_ENABLED !== "true") return;
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";
  const serviceName = process.env.OTEL_SERVICE_NAME ?? "novigo-api";

  sdk = new NodeSDK({
    resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();

  const shutdown = () => {
    sdk?.shutdown().finally(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Auto-démarrage à l'import (no-op si OTEL_ENABLED != true).
startTracing();

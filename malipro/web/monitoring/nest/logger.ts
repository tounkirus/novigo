// Journalisation structurée (pino) — pousse vers stdout, à agréger via ELK/Loki.
// npm i nestjs-pino pino-http
import { Params } from "nestjs-pino";

export const loggerConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? "info",
    // Rédaction des secrets dans les logs.
    redact: ["req.headers.authorization", "req.headers.cookie", "*.password"],
    autoLogging: true,
    customProps: (req: any) => ({ requestId: req.id }),
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { singleLine: true } }
        : undefined,
  },
};

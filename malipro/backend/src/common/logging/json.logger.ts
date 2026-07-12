import { LoggerService } from "@nestjs/common";

/// Logger JSON (une ligne par log) pour ingestion par Loki/ELK.
/// Activé via LOG_FORMAT=json (sinon logger par défaut).
export class JsonLogger implements LoggerService {
  private write(level: string, message: unknown, context?: string, trace?: unknown) {
    const line = {
      ts: new Date().toISOString(),
      level,
      context,
      message: typeof message === "string" ? message : JSON.stringify(message),
      ...(trace ? { trace } : {}),
    };
    process.stdout.write(JSON.stringify(line) + "\n");
  }
  log(message: unknown, context?: string) { this.write("info", message, context); }
  error(message: unknown, trace?: unknown, context?: string) { this.write("error", message, context, trace); }
  warn(message: unknown, context?: string) { this.write("warn", message, context); }
  debug(message: unknown, context?: string) { this.write("debug", message, context); }
  verbose(message: unknown, context?: string) { this.write("verbose", message, context); }
}

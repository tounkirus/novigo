import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Counter, Histogram, register } from "prom-client";

const httpRequests = new Counter({
  name: "novigo_http_requests_total",
  help: "Nombre total de requêtes HTTP.",
  labelNames: ["method", "route", "status"],
  registers: [register],
});
const httpDuration = new Histogram({
  name: "novigo_http_request_duration_seconds",
  help: "Durée des requêtes HTTP.",
  labelNames: ["method", "route", "status"],
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const route = req.route?.path ?? req.originalUrl?.split("?")[0] ?? "unknown";
    const end = httpDuration.startTimer();
    const record = () => {
      const labels = { method: req.method, route, status: String(res.statusCode) };
      httpRequests.inc(labels);
      end(labels);
    };
    return next.handle().pipe(tap({ next: record, error: record }));
  }
}

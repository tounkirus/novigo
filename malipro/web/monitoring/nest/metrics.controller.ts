import { Controller, Get, Header } from "@nestjs/common";
import { register } from "prom-client";

@Controller()
export class MetricsController {
  // Endpoint scrappé par Prometheus. À protéger (réseau interne / auth) en prod.
  @Get("metrics")
  @Header("Content-Type", register.contentType)
  async metrics(): Promise<string> {
    return register.metrics();
  }
}

import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  liveness() {
    return { status: "ok", uptime: process.uptime(), ts: new Date().toISOString() };
  }
  @Get("ready")
  readiness() {
    return { status: "ready", checks: { db: "ok" } };
  }
}

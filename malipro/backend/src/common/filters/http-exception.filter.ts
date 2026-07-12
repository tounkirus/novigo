import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger,
} from "@nestjs/common";
import { Response } from "express";

const CODE: Record<number, string> = {
  400: "BAD_REQUEST", 401: "UNAUTHORIZED", 403: "FORBIDDEN", 404: "NOT_FOUND",
  409: "CONFLICT", 422: "VALIDATION_ERROR", 429: "RATE_LIMITED", 500: "INTERNAL_ERROR",
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("Http");

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = "Une erreur interne est survenue.";
    let fields: unknown;
    if (exception instanceof HttpException) {
      const r = exception.getResponse() as any;
      if (typeof r === "string") message = r;
      else if (r?.message) {
        message = Array.isArray(r.message) ? "Certains champs sont invalides." : r.message;
        if (Array.isArray(r.message)) fields = r.message;
      }
    } else {
      this.logger.error(exception);
    }

    res.status(status).json({
      success: false,
      error: { code: CODE[status] ?? "ERROR", message, status, ...(fields ? { fields } : {}) },
    });
  }
}

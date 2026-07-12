import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

// Enveloppe conforme au contrat : { success, data, [meta] }.
// Une valeur { data, meta } (pagination) est ré-emballée telle quelle.
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: any) => {
        if (value && typeof value === "object" && Array.isArray(value.data) && value.meta) {
          return { success: true, data: value.data, meta: value.meta };
        }
        return { success: true, data: value ?? null };
      })
    );
  }
}

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { Permission, hasAllPermissions } from "../rbac/permissions";

/// Garde RBAC granulaire : vérifie les permissions requises (@RequirePermissions)
/// contre les rôles de l'utilisateur. À utiliser avec JwtAuthGuard.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const user = ctx.switchToHttp().getRequest().user;
    const roles: string[] = user?.roles ?? [];
    if (!hasAllPermissions(roles, required)) {
      throw new ForbiddenException("Permission insuffisante pour cette action.");
    }
    return true;
  }
}

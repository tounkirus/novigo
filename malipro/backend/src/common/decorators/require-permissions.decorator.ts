import { SetMetadata } from "@nestjs/common";
import { Permission } from "../rbac/permissions";

export const PERMISSIONS_KEY = "permissions";

/// Exige que l'utilisateur possède TOUTES les permissions listées (via ses rôles).
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

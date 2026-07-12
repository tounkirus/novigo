import { ForbiddenException } from "@nestjs/common";
import { RolesGuard } from "./roles.guard";

const ctx = (roles: string[]) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user: { roles } }) }),
  } as any);

const guardWith = (required: string[] | undefined) =>
  new RolesGuard({ getAllAndOverride: () => required } as any);

describe("RolesGuard", () => {
  it("autorise sans rôle requis", () => {
    expect(guardWith(undefined).canActivate(ctx(["CUSTOMER"]))).toBe(true);
  });

  it("autorise si un rôle correspond", () => {
    expect(guardWith(["ADMIN"] as any).canActivate(ctx(["ADMIN"]))).toBe(true);
  });

  it("refuse sinon", () => {
    expect(() => guardWith(["SUPER_ADMIN"] as any).canActivate(ctx(["CUSTOMER"]))).toThrow(
      ForbiddenException
    );
  });
});

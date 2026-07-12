/**
 * Session backend réelle (JWT) contre l'API Spring (SP9).
 *
 * Module autonome : il N'altère PAS le sélecteur de rôle mock existant
 * (`@/features/auth/session`). Il fournit de quoi ouvrir une vraie session
 * quand `NEXT_PUBLIC_API_MODE=live`, en stockant les jetons pour que le
 * client HTTP les envoie automatiquement.
 */
import { httpGet, httpPost } from "./http";
import { setTokens, clearTokens } from "./token-store";
import type { TokenResponseDto, OtpResponseDto, AuthUserDto } from "./dto";

/** Connexion par identifiant (email/téléphone) + mot de passe. */
export async function login(identifier: string, password: string): Promise<AuthUserDto> {
  const res = await httpPost<TokenResponseDto>("/auth/login", { identifier, password });
  setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

/** Demande d'un code OTP (channel: "SMS" | "EMAIL"). */
export function requestOtp(target: string, channel: string): Promise<OtpResponseDto> {
  return httpPost<OtpResponseDto>("/auth/otp/request", { target, channel });
}

/** Vérification du code OTP → ouvre la session. */
export async function verifyOtp(target: string, code: string): Promise<AuthUserDto> {
  const res = await httpPost<TokenResponseDto>("/auth/otp/verify", { target, code });
  setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

/** Profil de l'utilisateur connecté. */
export function me(): Promise<AuthUserDto> {
  return httpGet<AuthUserDto>("/auth/me");
}

export function logout(): void {
  clearTokens();
}

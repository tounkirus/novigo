package com.novigo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/** DTOs du module d'authentification (SP3). */
public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 160) String fullName,
            @Email @Size(max = 160) String email,
            @Size(max = 32) String phone,
            @NotBlank @Size(min = 6, max = 72) String password) {}

    public record LoginRequest(
            @NotBlank String identifier,
            @NotBlank String password) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record LogoutRequest(@NotBlank String refreshToken) {}

    public record OtpRequest(
            @NotBlank @Size(max = 160) String target,
            @NotBlank String channel) {}

    public record OtpVerifyRequest(
            @NotBlank @Size(max = 160) String target,
            @NotBlank String code) {}

    public record UserView(
            UUID id, String email, String phone, String fullName,
            String avatarUrl, String status, List<String> roles) {}

    public record TokenResponse(
            String accessToken, String refreshToken, String tokenType,
            long expiresIn, UserView user) {}

    public record OtpResponse(
            String target, String channel, long expiresInSeconds, String devCode) {}
}

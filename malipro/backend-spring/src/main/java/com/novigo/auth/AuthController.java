package com.novigo.auth;

import com.novigo.auth.dto.AuthDtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Endpoints d'authentification NOVIGO (JWT + refresh + OTP). */
@Tag(name = "Auth", description = "Inscription, connexion, OTP, rafraîchissement de session")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService auth;

    @Operation(summary = "Inscription (email/téléphone + mot de passe)")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @Operation(summary = "Connexion par mot de passe")
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @Operation(summary = "Demander un code OTP (email ou SMS)")
    @PostMapping("/otp/request")
    public OtpResponse requestOtp(@Valid @RequestBody OtpRequest req) {
        return auth.requestOtp(req);
    }

    @Operation(summary = "Vérifier un code OTP et se connecter")
    @PostMapping("/otp/verify")
    public TokenResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest req) {
        return auth.verifyOtp(req);
    }

    @Operation(summary = "Rafraîchir la session (rotation du refresh token)")
    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return auth.refresh(req);
    }

    @Operation(summary = "Déconnexion (révocation du refresh token)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest req) {
        auth.logout(req);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Profil de l'utilisateur connecté")
    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal AuthPrincipal principal) {
        return auth.me(principal.userId());
    }
}

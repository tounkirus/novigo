package com.novigo.web;

import com.novigo.auth.AuthPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Exemples d'endpoints protégés — démontrent le JWT (authenticated) et le RBAC (@PreAuthorize). */
@Tag(name = "Account", description = "Endpoints protégés (démonstration JWT + RBAC)")
@RestController
@RequestMapping("/api/v1")
public class AccountController {

    @Operation(summary = "Ping authentifié — nécessite un jeton d'accès valide")
    @GetMapping("/account/ping")
    public Map<String, Object> ping(@AuthenticationPrincipal AuthPrincipal principal) {
        return Map.of(
                "userId", principal.userId(),
                "email", principal.email() == null ? "" : principal.email(),
                "roles", principal.roles(),
                "message", "Authentifié ✓");
    }

    @Operation(summary = "Zone admin — nécessite le rôle ADMIN ou SUPER_ADMIN")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping("/admin/ping")
    public Map<String, Object> adminPing(@AuthenticationPrincipal AuthPrincipal principal) {
        return Map.of("roles", principal.roles(), "message", "Accès admin accordé ✓");
    }
}

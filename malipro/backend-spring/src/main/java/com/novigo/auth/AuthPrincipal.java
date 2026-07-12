package com.novigo.auth;

import java.util.List;
import java.util.UUID;

/** Identité authentifiée portée par le SecurityContext (issue du jeton d'accès). */
public record AuthPrincipal(UUID userId, String email, List<String> roles) {
}

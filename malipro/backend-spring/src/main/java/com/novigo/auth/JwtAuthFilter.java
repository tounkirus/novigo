package com.novigo.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Filtre d'authentification JWT : extrait le Bearer token, valide, et peuple le SecurityContext.
 * Sans jeton (ou jeton invalide) : la requête continue anonyme — l'autorisation décide ensuite.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    @SuppressWarnings("unchecked")
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.parseAccess(token);
                if (JwtService.TYPE_ACCESS.equals(claims.get("type", String.class))) {
                    UUID userId = UUID.fromString(claims.getSubject());
                    String email = claims.get("email", String.class);
                    List<String> roles = claims.get("roles", List.class);
                    if (roles == null) roles = List.of();

                    // Réconciliation des rôles NestJS <-> Spring (ADR P1) : les tokens sont
                    // émis par Nest (CUSTOMER, ARTISAN) mais Spring seede CLIENT, PROVIDER.
                    // On accorde les DEUX alias pour que @PreAuthorize passe quel que soit le nom.
                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .flatMap(r -> expandRole(r).stream())
                            .distinct()
                            .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                            .toList();
                    AuthPrincipal principal = new AuthPrincipal(userId, email, roles);
                    var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException ex) {
                // Jeton invalide/expiré → on laisse passer en anonyme (401 géré par l'autorisation).
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    // Alias de rôles inter-backend (Nest <-> Spring). Symétrique pour couvrir les deux sens.
    private static final Map<String, String> ROLE_ALIASES = Map.of(
            "CUSTOMER", "CLIENT",
            "CLIENT", "CUSTOMER",
            "ARTISAN", "PROVIDER",
            "PROVIDER", "ARTISAN");

    /** Étend un rôle à lui-même + son alias inter-backend éventuel (en MAJUSCULES). */
    private static List<String> expandRole(String role) {
        String up = role == null ? "" : role.toUpperCase();
        String alias = ROLE_ALIASES.get(up);
        return alias == null ? List.of(up) : List.of(up, alias);
    }
}

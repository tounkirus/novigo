package com.novigo.auth;

import com.novigo.config.NovigoProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Émission et vérification des JWT NOVIGO (HS256).
 * Deux clés distinctes : access (courte durée) et refresh (longue durée).
 */
@Service
public class JwtService {

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final NovigoProperties props;
    private final SecretKey accessKey;
    private final SecretKey refreshKey;

    public JwtService(NovigoProperties props) {
        this.props = props;
        this.accessKey = Keys.hmacShaKeyFor(props.getJwt().getAccessSecret().getBytes(StandardCharsets.UTF_8));
        this.refreshKey = Keys.hmacShaKeyFor(props.getJwt().getRefreshSecret().getBytes(StandardCharsets.UTF_8));
    }

    /** Jeton d'accès : sujet = userId, claims roles + email. */
    public String issueAccessToken(UUID userId, String email, List<String> roles) {
        Instant now = Instant.now();
        Instant exp = now.plus(props.getJwt().getAccessTtlMinutes(), ChronoUnit.MINUTES);
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", TYPE_ACCESS)
                .claim("email", email)
                .claim("roles", roles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(accessKey)
                .compact();
    }

    /** Jeton de rafraîchissement : sujet = userId, opaque côté client. */
    public String issueRefreshToken(UUID userId) {
        Instant now = Instant.now();
        Instant exp = now.plus(props.getJwt().getRefreshTtlDays(), ChronoUnit.DAYS);
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", TYPE_REFRESH)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(refreshKey)
                .compact();
    }

    /** Valide et parse un jeton d'accès. Lève une exception JJWT si invalide/expiré. */
    public Claims parseAccess(String token) {
        return Jwts.parser().verifyWith(accessKey).build().parseSignedClaims(token).getPayload();
    }

    /** Valide et parse un jeton de rafraîchissement. */
    public Claims parseRefresh(String token) {
        return Jwts.parser().verifyWith(refreshKey).build().parseSignedClaims(token).getPayload();
    }

    public Instant refreshExpiry() {
        return Instant.now().plus(props.getJwt().getRefreshTtlDays(), ChronoUnit.DAYS);
    }

    public long accessTtlSeconds() {
        return props.getJwt().getAccessTtlMinutes() * 60;
    }
}

package com.novigo.auth;

import com.novigo.config.NovigoProperties;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** Test unitaire léger du JwtService (sans contexte Spring, offline). */
class JwtServiceTest {

    private JwtService newService() {
        NovigoProperties props = new NovigoProperties();
        // Les secrets par défaut font > 32 octets (requis HS256).
        return new JwtService(props);
    }

    @Test
    void accessTokenRoundTrip() {
        JwtService jwt = newService();
        UUID uid = UUID.randomUUID();
        String token = jwt.issueAccessToken(uid, "client@novigo.ml", List.of("CLIENT", "ADMIN"));

        Claims claims = jwt.parseAccess(token);
        assertEquals(uid.toString(), claims.getSubject());
        assertEquals(JwtService.TYPE_ACCESS, claims.get("type", String.class));
        assertEquals("client@novigo.ml", claims.get("email", String.class));
        assertTrue(claims.get("roles", List.class).contains("CLIENT"));
    }

    @Test
    void refreshTokenIsTypedRefresh() {
        JwtService jwt = newService();
        UUID uid = UUID.randomUUID();
        String token = jwt.issueRefreshToken(uid);

        Claims claims = jwt.parseRefresh(token);
        assertEquals(uid.toString(), claims.getSubject());
        assertEquals(JwtService.TYPE_REFRESH, claims.get("type", String.class));
        assertNotNull(claims.getId());
    }

    @Test
    void accessKeyRejectsRefreshToken() {
        JwtService jwt = newService();
        String refresh = jwt.issueRefreshToken(UUID.randomUUID());
        // Un jeton refresh (autre clé) ne doit pas être validé par parseAccess.
        assertThrows(Exception.class, () -> jwt.parseAccess(refresh));
    }

    @Test
    void hashingIsStableAndHex() {
        String h1 = Hashing.sha256("abc");
        String h2 = Hashing.sha256("abc");
        assertEquals(h1, h2);
        assertEquals(64, h1.length());
        assertTrue(h1.matches("[0-9a-f]{64}"));
    }
}

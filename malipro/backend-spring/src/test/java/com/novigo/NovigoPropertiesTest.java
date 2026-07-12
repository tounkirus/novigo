package com.novigo;

import com.novigo.config.NovigoProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test unitaire léger (sans contexte Spring) — vérifie les valeurs par défaut de configuration.
 * Garantit un `mvn test` vert sans infra (Postgres/Redis/RabbitMQ).
 */
class NovigoPropertiesTest {

    @Test
    void defaults_areSane() {
        NovigoProperties p = new NovigoProperties();
        assertEquals("demo", p.getMode(), "mode par défaut = demo");
        assertFalse(p.getCorsOrigins().isEmpty(), "des origines CORS par défaut existent");
        assertTrue(p.getCorsOrigins().contains("http://localhost:5173"), "le Frontend Next.js est autorisé");
        assertEquals(15, p.getJwt().getAccessTtlMinutes());
        assertEquals(30, p.getJwt().getRefreshTtlDays());
    }
}

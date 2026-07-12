package com.novigo.common.api;

import java.time.Instant;
import java.util.Map;

/**
 * Corps d'erreur normalisé de l'API.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors) {
}

package com.novigo.web;

import com.novigo.config.NovigoProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Endpoints publics de service : santé & informations plateforme.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Système", description = "Santé & informations de la plateforme")
public class InfoController {

    private final NovigoProperties props;

    @Value("${spring.application.name:novigo-api}")
    private String appName;

    @Value("${novigo.version:0.1.0}")
    private String version;

    public InfoController(NovigoProperties props) {
        this.props = props;
    }

    @GetMapping("/health")
    @Operation(summary = "Vérification de santé légère")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "mode", props.getMode(), "time", Instant.now().toString());
    }

    @GetMapping("/info")
    @Operation(summary = "Informations de la plateforme")
    public Map<String, Object> info() {
        return Map.of(
                "name", appName,
                "version", version,
                "mode", props.getMode(),
                "api", "v1",
                "time", Instant.now().toString());
    }
}

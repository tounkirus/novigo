package com.novigo.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentation OpenAPI / Swagger UI (springdoc). Schéma d'auth : Bearer JWT.
 * UI : /swagger-ui.html — Spec : /v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER = "bearerAuth";

    @Bean
    public OpenAPI novigoOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("NOVIGO API")
                        .version("v1")
                        .description("API REST de la Super App NOVIGO — versionnée, sécurisée (JWT), paginée, triée, filtrable.")
                        .contact(new Contact().name("NOVIGO").email("dev@novigo.ml"))
                        .license(new License().name("Proprietary — NOVIGO")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER))
                .components(new Components().addSecuritySchemes(BEARER,
                        new SecurityScheme()
                                .name(BEARER)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}

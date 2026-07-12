package com.novigo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Point d'entrée de l'API NOVIGO (Spring Boot 3 / Java 21).
 * Profils : demo (H2 autonome), dev, preprod, production (voir application-*.yml).
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class NovigoApplication {
    public static void main(String[] args) {
        SpringApplication.run(NovigoApplication.class, args);
    }
}

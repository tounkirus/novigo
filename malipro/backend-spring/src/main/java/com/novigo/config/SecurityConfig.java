package com.novigo.config;

import com.novigo.auth.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Sécurité HTTP (Spring Security 6) — API stateless, CORS, JWT, RBAC.
 * SP3 : filtre JWT + verrouillage des routes protégées + sécurité au niveau méthode (@PreAuthorize).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final NovigoProperties props;
    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    public SecurityConfig(NovigoProperties props, JwtAuthFilter jwtAuthFilter, RateLimitFilter rateLimitFilter) {
        this.props = props;
        this.jwtAuthFilter = jwtAuthFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // API stateless : pas de CSRF cookie
                .cors(c -> c.configurationSource(corsSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(h -> h
                        .frameOptions(f -> f.sameOrigin()) // H2 console (mode demo)
                        .contentTypeOptions(c -> {})       // X-Content-Type-Options: nosniff
                        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
                        .referrerPolicy(r -> r.policy(
                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                                        .ReferrerPolicy.SAME_ORIGIN)))
                .authorizeHttpRequests(auth -> auth
                        // Public : santé, doc, auth, console H2, métriques Prometheus.
                        .requestMatchers(
                                "/api/v1/health", "/api/v1/info",
                                "/api/v1/auth/**",
                                "/ws/**",
                                "/actuator/health/**", "/actuator/info", "/actuator/prometheus",
                                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                                "/h2-console/**").permitAll()
                        // Autres endpoints Actuator : réservés aux administrateurs.
                        .requestMatchers("/actuator/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        // Vitrine publique : consultation en lecture seule (GET) sans authentification.
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/categories/**", "/api/v1/stores/**", "/api/v1/products/**",
                                "/api/v1/restaurants/**", "/api/v1/providers/**", "/api/v1/reviews/**",
                                "/api/v1/ads/**", "/api/v1/settings/**", "/api/v1/geo/**",
                                "/api/v1/payments/providers",
                                "/api/v1/location/providers", "/api/v1/location/distance",
                                "/api/v1/location/geocode", "/api/v1/location/nearest-city",
                                "/api/v1/storage/providers").permitAll()
                        // Tout le reste de l'API exige une authentification.
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) ->
                        res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentification requise")))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, JwtAuthFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(props.getCorsOrigins());
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

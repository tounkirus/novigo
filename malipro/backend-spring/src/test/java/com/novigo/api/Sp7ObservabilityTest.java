package com.novigo.api;

import com.fasterxml.jackson.databind.JsonNode;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Test d'intégration SP7 : observabilité (Prometheus + métriques métier), durcissement sécurité. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("demo")
class Sp7ObservabilityTest {

    @Autowired
    TestRestTemplate rest;

    @Autowired
    MeterRegistry meterRegistry;

    @BeforeEach
    void setup() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setOutputStreaming(false);
        rest.getRestTemplate().setRequestFactory(factory);
    }

    @Test
    void publicActuatorHealthIsUp() {
        ResponseEntity<JsonNode> resp = rest.getForEntity("/actuator/health", JsonNode.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("status").asText()).isEqualTo("UP");
    }

    @Test
    void businessMetricIncrementsAfterOrder() {
        double before = counter("novigo.orders.created");
        String token = login("client@novigo.ml", "123456");
        JsonNode stores = rest.getForObject("/api/v1/stores?size=1", JsonNode.class);
        String storeId = stores.get("content").get(0).get("id").asText();
        JsonNode products = rest.getForObject("/api/v1/products?storeId=" + storeId + "&size=1", JsonNode.class);
        String productId = products.get("content").get(0).get("id").asText();

        Map<String, Object> body = Map.of("storeId", storeId, "paymentMethod", "WALLET",
                "items", List.of(Map.of("productId", productId, "quantity", 1)));
        rest.exchange("/api/v1/orders", HttpMethod.POST, authJson(body, token), JsonNode.class);

        assertThat(counter("novigo.orders.created")).isGreaterThan(before);
    }

    private double counter(String name) {
        var c = meterRegistry.find(name).counter();
        return c == null ? 0 : c.count();
    }

    @Test
    void authResponsesCarryRateLimitHeaders() {
        HttpEntity<Map<String, Object>> req = new HttpEntity<>(
                Map.of("identifier", "client@novigo.ml", "password", "123456"));
        ResponseEntity<String> resp = rest.exchange("/api/v1/auth/login", HttpMethod.POST, req, String.class);
        assertThat(resp.getHeaders().getFirst("X-RateLimit-Limit")).isNotNull();
        assertThat(resp.getHeaders().getFirst("X-Request-Id")).isNotNull();
    }

    @Test
    void sensitiveActuatorEndpointRequiresAuth() {
        ResponseEntity<String> resp = rest.getForEntity("/actuator/beans", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private String login(String identifier, String password) {
        return rest.postForObject("/api/v1/auth/login",
                Map.of("identifier", identifier, "password", password), JsonNode.class)
                .get("accessToken").asText();
    }

    private HttpEntity<Map<String, Object>> authJson(Map<String, Object> body, String token) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.setBearerAuth(token);
        return new HttpEntity<>(body, h);
    }
}

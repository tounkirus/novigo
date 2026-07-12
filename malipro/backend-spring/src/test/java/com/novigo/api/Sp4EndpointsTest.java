package com.novigo.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test d'intégration SP4 : démarre le contexte complet en mode démo (H2) et exerce
 * la vitrine publique, l'authentification, le RBAC et un cycle CRUD complet.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("demo")
class Sp4EndpointsTest {

    @Autowired
    TestRestTemplate rest;

    @BeforeEach
    void setup() {
        // Désactive le streaming pour lire les réponses 401 (sinon HttpURLConnection ne peut pas rejouer).
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setOutputStreaming(false);
        rest.getRestTemplate().setRequestFactory(factory);
    }

    @Test
    void publicBrowseEndpointsAreOpen() {
        assertThat(rest.getForEntity("/api/v1/categories", String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rest.getForEntity("/api/v1/stores", String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rest.getForEntity("/api/v1/products", String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rest.getForEntity("/api/v1/providers", String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rest.getForEntity("/api/v1/geo/countries", String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void protectedEndpointRequiresAuth() {
        // GET protégé (liste des utilisateurs, réservé ADMIN) sans jeton → 401.
        ResponseEntity<String> resp = rest.getForEntity("/api/v1/users", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void adminCanCreateCategoryButClientCannot() {
        String adminToken = login("admin@novigo.ml", "123456");
        String clientToken = login("client@novigo.ml", "123456");

        // CLIENT interdit (403)
        HttpEntity<Map<String, Object>> clientReq = jsonWithAuth(
                Map.of("code", "cat-client", "label", "Interdit"), clientToken);
        assertThat(rest.exchange("/api/v1/categories", HttpMethod.POST, clientReq, String.class).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        // ADMIN autorisé (201)
        HttpEntity<Map<String, Object>> adminReq = jsonWithAuth(
                Map.of("code", "cat-it", "label", "Catégorie Test IT", "vertical", "shop"), adminToken);
        ResponseEntity<JsonNode> created = rest.exchange("/api/v1/categories", HttpMethod.POST, adminReq, JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String id = created.getBody().get("id").asText();

        // Lecture publique de la ressource créée
        assertThat(rest.getForEntity("/api/v1/categories/" + id, String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        // La liste paginée contient un enveloppe standard
        JsonNode page = rest.getForObject("/api/v1/categories?size=5", JsonNode.class);
        assertThat(page.has("content")).isTrue();
        assertThat(page.has("totalElements")).isTrue();
    }

    @Test
    void orderCanBePlacedOnSeededStore() {
        // Récupère une boutique et un produit de démo
        JsonNode stores = rest.getForObject("/api/v1/stores?size=1", JsonNode.class);
        String storeId = stores.get("content").get(0).get("id").asText();
        JsonNode products = rest.getForObject("/api/v1/products?storeId=" + storeId + "&size=1", JsonNode.class);
        assertThat(products.get("content")).isNotEmpty();
        String productId = products.get("content").get(0).get("id").asText();

        String token = login("client@novigo.ml", "123456");
        Map<String, Object> body = Map.of(
                "storeId", storeId,
                "paymentMethod", "WALLET",
                "items", java.util.List.of(Map.of("productId", productId, "quantity", 2)));
        ResponseEntity<JsonNode> resp = rest.exchange("/api/v1/orders", HttpMethod.POST,
                jsonWithAuth(body, token), JsonNode.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(resp.getBody().get("ref").asText()).startsWith("CMD-");
        assertThat(resp.getBody().get("total").asLong()).isGreaterThan(0);
    }

    // ---- helpers ----
    private String login(String identifier, String password) {
        JsonNode resp = rest.postForObject("/api/v1/auth/login",
                Map.of("identifier", identifier, "password", password), JsonNode.class);
        return resp.get("accessToken").asText();
    }

    private HttpEntity<Map<String, Object>> jsonWithAuth(Map<String, Object> body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return new HttpEntity<>(body, headers);
    }
}

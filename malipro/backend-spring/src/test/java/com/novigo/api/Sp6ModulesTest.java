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

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** Test d'intégration SP6 : géolocalisation, notifications multi-canal, chat, stockage, handshake WS. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("demo")
class Sp6ModulesTest {

    @Autowired
    TestRestTemplate rest;

    @BeforeEach
    void setup() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setOutputStreaming(false);
        rest.getRestTemplate().setRequestFactory(factory);
    }

    @Test
    void locationDistanceAndProvidersArePublic() {
        JsonNode est = rest.getForObject(
                "/api/v1/location/distance?fromLat=12.60&fromLng=-8.00&toLat=12.65&toLng=-7.95", JsonNode.class);
        assertThat(est.get("distanceKm").asDouble()).isGreaterThan(0);
        assertThat(est.get("etaMinutes").asDouble()).isGreaterThan(0);

        JsonNode providers = rest.getForObject("/api/v1/location/providers", JsonNode.class);
        boolean osmActive = false;
        for (JsonNode p : providers) {
            if ("OSM".equals(p.get("code").asText()) && p.get("active").asBoolean()) osmActive = true;
        }
        assertThat(osmActive).isTrue();
    }

    @Test
    void notificationDispatchMultiChannel() {
        String admin = login("admin@novigo.ml", "123456");
        String clientId = rest.exchange("/api/v1/auth/me", HttpMethod.GET,
                auth(login("client@novigo.ml", "123456")), JsonNode.class).getBody().get("id").asText();

        Map<String, Object> req = Map.of(
                "userId", clientId, "channels", List.of("IN_APP", "SMS", "EMAIL"),
                "title", "Bienvenue", "body", "Votre compte est prêt", "category", "SYSTEM");
        ResponseEntity<JsonNode> resp = rest.exchange("/api/v1/notifications/dispatch", HttpMethod.POST,
                authJson(req, admin), JsonNode.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        assertThat(resp.getBody().get("dispatched").toString()).contains("IN_APP");
    }

    @Test
    void chatMessagePersistedAndListedInHistory() {
        String token = login("client@novigo.ml", "123456");
        UUID conversationId = UUID.fromString("00000000-0000-0000-0000-0000000000c1");

        Map<String, Object> msg = Map.of("conversationId", conversationId.toString(), "body", "Bonjour support");
        ResponseEntity<JsonNode> sent = rest.exchange("/api/v1/chat/messages", HttpMethod.POST,
                authJson(msg, token), JsonNode.class);
        assertThat(sent.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(sent.getBody().get("body").asText()).isEqualTo("Bonjour support");

        JsonNode history = rest.exchange(
                "/api/v1/chat/conversations/" + conversationId + "/messages", HttpMethod.GET,
                auth(token), JsonNode.class).getBody();
        assertThat(history.get("totalElements").asInt()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void storageProvidersListedWithActive() {
        JsonNode providers = rest.getForObject("/api/v1/storage/providers", JsonNode.class);
        boolean localActive = false;
        for (JsonNode p : providers) {
            if ("LOCAL".equals(p.get("code").asText()) && p.get("active").asBoolean()) localActive = true;
        }
        assertThat(localActive).isTrue();
    }

    @Test
    void webSocketHandshakeEndpointIsAvailable() {
        // SockJS expose /ws/info pour la négociation.
        ResponseEntity<String> info = rest.getForEntity("/ws/info", String.class);
        assertThat(info.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(info.getBody()).contains("websocket");
    }

    // ---- helpers ----
    private String login(String identifier, String password) {
        return rest.postForObject("/api/v1/auth/login",
                Map.of("identifier", identifier, "password", password), JsonNode.class)
                .get("accessToken").asText();
    }

    private HttpEntity<Void> auth(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return new HttpEntity<>(h);
    }

    private HttpEntity<Map<String, Object>> authJson(Map<String, Object> body, String token) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.setBearerAuth(token);
        return new HttpEntity<>(body, h);
    }
}

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

/** Test d'intégration SP5 : fournisseurs de paiement, recharge+cashback, activation/désactivation. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("demo")
class Sp5PaymentsTest {

    @Autowired
    TestRestTemplate rest;

    @BeforeEach
    void setup() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setOutputStreaming(false);
        rest.getRestTemplate().setRequestFactory(factory);
    }

    @Test
    void providersListedPubliclyIncludesSeededProviders() {
        JsonNode providers = rest.getForObject("/api/v1/payments/providers", JsonNode.class);
        assertThat(providers.isArray()).isTrue();
        boolean hasOrange = false;
        for (JsonNode p : providers) if ("ORANGE_MONEY".equals(p.get("code").asText())) hasOrange = true;
        assertThat(hasOrange).isTrue();
    }

    @Test
    void rechargeCreditsWalletWithCashback() {
        String token = login("client@novigo.ml", "123456");
        String userId = rest.exchange("/api/v1/auth/me", HttpMethod.GET, auth(token), JsonNode.class)
                .getBody().get("id").asText();
        JsonNode wallet = rest.exchange("/api/v1/wallets/by-owner/" + userId, HttpMethod.GET, auth(token), JsonNode.class)
                .getBody();
        String walletId = wallet.get("id").asText();
        long before = wallet.get("balance").asLong();

        // Initier une recharge de 10 000 via Orange Money
        Map<String, Object> initReq = Map.of(
                "provider", "ORANGE_MONEY", "purpose", "RECHARGE",
                "amount", 10_000, "walletId", walletId);
        JsonNode init = rest.exchange("/api/v1/payments", HttpMethod.POST, authJson(initReq, token), JsonNode.class)
                .getBody();
        String paymentId = init.get("payment").get("id").asText();
        assertThat(init.get("payment").get("status").asText()).isEqualTo("PENDING");
        assertThat(init.get("message").asText()).isNotBlank();

        // Confirmer (callback simulé)
        JsonNode confirmed = rest.exchange("/api/v1/payments/" + paymentId + "/confirm",
                HttpMethod.POST, auth(token), JsonNode.class).getBody();
        assertThat(confirmed.get("status").asText()).isEqualTo("PAID");

        // Solde crédité de 10 000 + cashback 1 % (100)
        long after = rest.exchange("/api/v1/wallets/" + walletId, HttpMethod.GET, auth(token), JsonNode.class)
                .getBody().get("balance").asLong();
        assertThat(after).isEqualTo(before + 10_000 + 100);
    }

    @Test
    void unknownProviderIsRejected() {
        String client = login("client@novigo.ml", "123456");
        Map<String, Object> req = Map.of("provider", "BITCOIN", "purpose", "RECHARGE", "amount", 5000);
        ResponseEntity<String> resp = rest.exchange("/api/v1/payments", HttpMethod.POST,
                authJson(req, client), String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
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

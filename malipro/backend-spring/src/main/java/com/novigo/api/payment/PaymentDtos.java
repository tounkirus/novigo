package com.novigo.api.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class PaymentDtos {

    private PaymentDtos() {}

    public record ProviderView(String code, String label, boolean enabled, int sortOrder, int feeBps) {}

    public record PaymentView(UUID id, String ref, String provider, String purpose, long amount,
                              String currency, String status, UUID payerId, UUID walletId,
                              String targetType, UUID targetId, String externalRef, long commission,
                              String failureReason, Instant createdAt) {}

    public record InitiateRequest(
            @NotBlank @Size(max = 24) String provider,
            @Size(max = 24) String purpose,
            @Positive long amount,
            @Size(max = 8) String currency,
            UUID payerId, UUID walletId,
            @Size(max = 24) String targetType, UUID targetId,
            @Size(max = 80) String payerContact) {}

    public record InitiateResponse(PaymentView payment, String message, String checkoutUrl) {}

    public record FailRequest(@Size(max = 240) String reason) {}
}

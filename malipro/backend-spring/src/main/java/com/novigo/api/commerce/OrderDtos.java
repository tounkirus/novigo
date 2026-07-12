package com.novigo.api.commerce;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class OrderDtos {

    private OrderDtos() {}

    public record OrderItemView(
            UUID id, UUID productId, String name, long unitPrice, int quantity, String optionsLabel) {}

    public record OrderView(
            UUID id, String ref, UUID customerId, UUID storeId, UUID driverId, String status,
            long subtotal, long deliveryFee, long total, String paymentMethod, String paymentStatus,
            String address, String district, Instant placedAt, List<OrderItemView> items) {}

    public record OrderItemCreate(
            UUID productId,
            @Size(max = 160) String name,
            @PositiveOrZero long unitPrice,
            @Positive int quantity,
            @Size(max = 240) String optionsLabel) {}

    public record OrderCreate(
            @NotNull UUID storeId, UUID customerId,
            @Size(max = 240) String address, @Size(max = 120) String district,
            @Size(max = 24) String paymentMethod,
            @NotEmpty @Valid List<OrderItemCreate> items) {}

    public record OrderStatusUpdate(
            @Size(max = 24) String status,
            UUID driverId,
            @Size(max = 24) String paymentStatus) {}
}

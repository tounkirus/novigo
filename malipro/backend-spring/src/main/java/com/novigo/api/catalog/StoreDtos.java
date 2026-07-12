package com.novigo.api.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public final class StoreDtos {

    private StoreDtos() {}

    public record StoreView(
            UUID id, String slug, String name, String category, UUID ownerId, UUID cityId,
            String district, String address, String phone, Double lat, Double lng,
            BigDecimal rating, int reviewCount, boolean open, long deliveryFee,
            int deliveryTimeMin, String coverUrl, String logoUrl, String status) {}

    public record StoreCreate(
            @NotBlank @Size(max = 160) String slug,
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Size(max = 40) String category,
            UUID ownerId, UUID cityId,
            @Size(max = 120) String district,
            @Size(max = 240) String address,
            @Size(max = 32) String phone,
            Double lat, Double lng,
            long deliveryFee, int deliveryTimeMin,
            @Size(max = 400) String coverUrl,
            @Size(max = 400) String logoUrl) {}

    public record StoreUpdate(
            @Size(max = 160) String name,
            @Size(max = 40) String category,
            UUID cityId,
            @Size(max = 120) String district,
            @Size(max = 240) String address,
            @Size(max = 32) String phone,
            Double lat, Double lng,
            Boolean open, Long deliveryFee, Integer deliveryTimeMin,
            @Size(max = 400) String coverUrl,
            @Size(max = 400) String logoUrl,
            @Size(max = 24) String status) {}
}

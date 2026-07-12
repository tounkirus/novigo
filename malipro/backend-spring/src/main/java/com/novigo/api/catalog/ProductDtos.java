package com.novigo.api.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public final class ProductDtos {

    private ProductDtos() {}

    public record ProductView(
            UUID id, UUID storeId, UUID categoryId, String name, String description,
            long price, Long oldPrice, String imageUrl, boolean available,
            boolean bestSeller, boolean isNew, int stock, String menuSection) {}

    public record ProductCreate(
            @NotNull UUID storeId, UUID categoryId,
            @NotBlank @Size(max = 160) String name,
            @Size(max = 2000) String description,
            @PositiveOrZero long price, Long oldPrice,
            @Size(max = 400) String imageUrl,
            Boolean available, Boolean bestSeller, Boolean isNew,
            int stock, @Size(max = 80) String menuSection) {}

    public record ProductUpdate(
            UUID categoryId,
            @Size(max = 160) String name,
            @Size(max = 2000) String description,
            Long price, Long oldPrice,
            @Size(max = 400) String imageUrl,
            Boolean available, Boolean bestSeller, Boolean isNew,
            Integer stock, @Size(max = 80) String menuSection) {}

    /** Section de menu = groupe de produits partageant le même menuSection. */
    public record MenuSection(String section, List<ProductView> items) {}
}

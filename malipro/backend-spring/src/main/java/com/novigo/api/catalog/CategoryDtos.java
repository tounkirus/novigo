package com.novigo.api.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class CategoryDtos {

    private CategoryDtos() {}

    public record CategoryView(UUID id, String code, String label, String icon, String vertical) {}

    public record CategoryCreate(
            @NotBlank @Size(max = 60) String code,
            @NotBlank @Size(max = 80) String label,
            @Size(max = 60) String icon,
            @Size(max = 40) String vertical) {}

    public record CategoryUpdate(
            @Size(max = 80) String label,
            @Size(max = 60) String icon,
            @Size(max = 40) String vertical) {}
}

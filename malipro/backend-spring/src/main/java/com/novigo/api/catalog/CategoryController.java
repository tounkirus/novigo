package com.novigo.api.catalog;

import com.novigo.api.catalog.CategoryDtos.*;
import com.novigo.common.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Catalogue — Catégories")
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @Operation(summary = "Lister les catégories (pagination, recherche, filtre vertical)")
    @GetMapping
    public PageResponse<CategoryView> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String vertical,
            @PageableDefault(size = 20, sort = "label") Pageable pageable) {
        return service.list(q, vertical, pageable);
    }

    @Operation(summary = "Obtenir une catégorie")
    @GetMapping("/{id}")
    public CategoryView get(@PathVariable UUID id) {
        return service.get(id);
    }

    @Operation(summary = "Créer une catégorie (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryView create(@Valid @RequestBody CategoryCreate req) {
        return service.create(req);
    }

    @Operation(summary = "Mettre à jour une catégorie (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    public CategoryView update(@PathVariable UUID id, @Valid @RequestBody CategoryUpdate req) {
        return service.update(id, req);
    }

    @Operation(summary = "Supprimer une catégorie (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}

package com.novigo.api.catalog;

import com.novigo.api.catalog.StoreDtos.*;
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

@Tag(name = "Catalogue — Boutiques & Commerçants")
@RestController
@RequestMapping("/api/v1/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService service;

    @Operation(summary = "Lister les boutiques (pagination, recherche, filtres catégorie/statut/ouvert)")
    @GetMapping
    public PageResponse<StoreView> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean open,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return service.list(q, category, status, open, pageable);
    }

    @Operation(summary = "Obtenir une boutique par identifiant")
    @GetMapping("/{id}")
    public StoreView get(@PathVariable UUID id) {
        return service.get(id);
    }

    @Operation(summary = "Obtenir une boutique par slug")
    @GetMapping("/slug/{slug}")
    public StoreView bySlug(@PathVariable String slug) {
        return service.getBySlug(slug);
    }

    @Operation(summary = "Créer une boutique (MERCHANT/ADMIN)")
    @PreAuthorize("hasAnyRole('MERCHANT','ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StoreView create(@Valid @RequestBody StoreCreate req) {
        return service.create(req);
    }

    @Operation(summary = "Mettre à jour une boutique (MERCHANT/ADMIN)")
    @PreAuthorize("hasAnyRole('MERCHANT','ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    public StoreView update(@PathVariable UUID id, @Valid @RequestBody StoreUpdate req) {
        return service.update(id, req);
    }

    @Operation(summary = "Supprimer une boutique (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}

package com.novigo.api.catalog;

import com.novigo.api.catalog.ProductDtos.*;
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

import java.util.List;
import java.util.UUID;

@Tag(name = "Catalogue — Produits & Menus")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @Operation(summary = "Lister les produits (pagination, recherche, filtres boutique/catégorie/disponibilité)")
    @GetMapping("/products")
    public PageResponse<ProductView> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) Boolean available,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return service.list(q, storeId, categoryId, available, pageable);
    }

    @Operation(summary = "Obtenir un produit")
    @GetMapping("/products/{id}")
    public ProductView get(@PathVariable UUID id) {
        return service.get(id);
    }

    @Operation(summary = "Menu d'une boutique (produits groupés par section)")
    @GetMapping("/stores/{storeId}/menu")
    public List<MenuSection> menu(@PathVariable UUID storeId) {
        return service.menu(storeId);
    }

    @Operation(summary = "Créer un produit (MERCHANT/ADMIN)")
    @PreAuthorize("hasAnyRole('MERCHANT','ADMIN','SUPER_ADMIN')")
    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductView create(@Valid @RequestBody ProductCreate req) {
        return service.create(req);
    }

    @Operation(summary = "Mettre à jour un produit (MERCHANT/ADMIN)")
    @PreAuthorize("hasAnyRole('MERCHANT','ADMIN','SUPER_ADMIN')")
    @PutMapping("/products/{id}")
    public ProductView update(@PathVariable UUID id, @Valid @RequestBody ProductUpdate req) {
        return service.update(id, req);
    }

    @Operation(summary = "Supprimer un produit (MERCHANT/ADMIN)")
    @PreAuthorize("hasAnyRole('MERCHANT','ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}

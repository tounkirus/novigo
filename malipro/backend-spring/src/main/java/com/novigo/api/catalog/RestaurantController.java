package com.novigo.api.catalog;

import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.catalog.Restaurant;
import com.novigo.domain.catalog.RestaurantRepository;
import com.novigo.domain.catalog.Store;
import com.novigo.domain.catalog.StoreRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Détails restaurant rattachés à une boutique (1:1). */
@Tag(name = "Catalogue — Restaurants")
@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantRepository repository;
    private final StoreRepository storeRepository;

    public record RestaurantView(UUID id, UUID storeId, String cuisine, boolean halal, long avgPrice) {}

    public record RestaurantUpsert(
            @NotNull UUID storeId, @Size(max = 120) String cuisine, Boolean halal, long avgPrice) {}

    @Operation(summary = "Lister les restaurants")
    @GetMapping
    @Transactional(readOnly = true)
    public List<RestaurantView> list() {
        return repository.findAll().stream().map(this::toView).toList();
    }

    @Operation(summary = "Détails restaurant d'une boutique")
    @GetMapping("/by-store/{storeId}")
    @Transactional(readOnly = true)
    public RestaurantView byStore(@PathVariable UUID storeId) {
        return toView(repository.findByStoreId(storeId)
                .orElseThrow(() -> NotFoundException.of("Restaurant (boutique)", storeId)));
    }

    @Operation(summary = "Créer/attacher les détails restaurant (MERCHANT/ADMIN)")
    @PreAuthorize("hasAnyRole('MERCHANT','ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public RestaurantView create(@Valid @RequestBody RestaurantUpsert req) {
        if (repository.existsByStoreId(req.storeId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Cette boutique a déjà un profil restaurant.");
        }
        Store store = storeRepository.findById(req.storeId())
                .orElseThrow(() -> NotFoundException.of("Boutique", req.storeId()));
        Restaurant r = new Restaurant();
        r.setStore(store);
        r.setCuisine(req.cuisine());
        if (req.halal() != null) r.setHalal(req.halal());
        r.setAvgPrice(req.avgPrice());
        return toView(repository.save(r));
    }

    @Operation(summary = "Mettre à jour les détails restaurant (MERCHANT/ADMIN)")
    @PreAuthorize("hasAnyRole('MERCHANT','ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    @Transactional
    public RestaurantView update(@PathVariable UUID id, @Valid @RequestBody RestaurantUpsert req) {
        Restaurant r = repository.findById(id).orElseThrow(() -> NotFoundException.of("Restaurant", id));
        if (req.cuisine() != null) r.setCuisine(req.cuisine());
        if (req.halal() != null) r.setHalal(req.halal());
        r.setAvgPrice(req.avgPrice());
        return toView(repository.save(r));
    }

    @Operation(summary = "Supprimer les détails restaurant (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Restaurant", id)));
    }

    private RestaurantView toView(Restaurant r) {
        return new RestaurantView(r.getId(), r.getStore().getId(), r.getCuisine(), r.isHalal(), r.getAvgPrice());
    }
}

package com.novigo.api.commerce;

import com.novigo.api.commerce.OrderDtos.*;
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

@Tag(name = "Commerce — Commandes")
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService service;

    @Operation(summary = "Lister les commandes (pagination, filtres client/boutique/livreur/statut)")
    @GetMapping
    public PageResponse<OrderView> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) UUID driverId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return service.list(q, customerId, storeId, driverId, status, paymentStatus, pageable);
    }

    @Operation(summary = "Obtenir une commande")
    @GetMapping("/{id}")
    public OrderView get(@PathVariable UUID id) {
        return service.get(id);
    }

    @Operation(summary = "Obtenir une commande par référence")
    @GetMapping("/ref/{ref}")
    public OrderView byRef(@PathVariable String ref) {
        return service.getByRef(ref);
    }

    @Operation(summary = "Passer une commande")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderView create(@Valid @RequestBody OrderCreate req) {
        return service.create(req);
    }

    @Operation(summary = "Mettre à jour le statut / assigner un livreur (MERCHANT/DRIVER/ADMIN)")
    @PreAuthorize("hasAnyRole('MERCHANT','DRIVER','ADMIN','SUPER_ADMIN')")
    @PatchMapping("/{id}/status")
    public OrderView updateStatus(@PathVariable UUID id, @Valid @RequestBody OrderStatusUpdate req) {
        return service.updateStatus(id, req);
    }

    @Operation(summary = "Supprimer une commande (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}

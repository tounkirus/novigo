package com.novigo.api.payment;

import com.novigo.api.payment.PaymentDtos.*;
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

@Tag(name = "Finance — Paiements")
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService service;

    @Operation(summary = "Lister les fournisseurs de paiement actifs (public)")
    @GetMapping("/providers")
    public List<ProviderView> providers() {
        return service.listProviders(false);
    }

    @Operation(summary = "Lister tous les fournisseurs, y compris désactivés (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping("/providers/all")
    public List<ProviderView> allProviders() {
        return service.listProviders(true);
    }

    @Operation(summary = "Activer/désactiver un fournisseur de paiement (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PatchMapping("/providers/{code}")
    public ProviderView toggleProvider(@PathVariable String code, @RequestParam boolean enabled) {
        return service.toggleProvider(code, enabled);
    }

    @Operation(summary = "Initier un paiement (recharge, commande, réservation, abonnement)")
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InitiateResponse initiate(@Valid @RequestBody InitiateRequest req) {
        return service.initiate(req);
    }

    @Operation(summary = "Confirmer un paiement (callback fournisseur) — déclenche recharge/règlement/cashback")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/confirm")
    public PaymentView confirm(@PathVariable UUID id) {
        return service.confirm(id);
    }

    @Operation(summary = "Marquer un paiement comme échoué")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/fail")
    public PaymentView fail(@PathVariable UUID id, @Valid @RequestBody FailRequest req) {
        return service.fail(id, req.reason());
    }

    @Operation(summary = "Lister les paiements (ADMIN, filtres statut/fournisseur/objet)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping
    public PageResponse<PaymentView> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) String purpose,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return service.list(status, provider, purpose, pageable);
    }

    @Operation(summary = "Obtenir un paiement")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public PaymentView get(@PathVariable UUID id) {
        return service.get(id);
    }
}

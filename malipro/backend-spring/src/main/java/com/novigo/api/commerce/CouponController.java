package com.novigo.api.commerce;

import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.commerce.Coupon;
import com.novigo.domain.commerce.CouponRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@Tag(name = "Commerce — Coupons")
@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository repository;

    public record CouponView(UUID id, String code, String label, int discountPercent,
                             long minAmount, boolean active, Instant expiresAt) {}

    public record CouponCreate(
            @NotBlank @Size(max = 40) String code,
            @Size(max = 120) String label,
            @Min(0) @Max(100) int discountPercent,
            long minAmount, Boolean active, Instant expiresAt) {}

    public record CouponUpdate(
            @Size(max = 120) String label,
            Integer discountPercent, Long minAmount, Boolean active, Instant expiresAt) {}

    @Operation(summary = "Lister les coupons (recherche, filtre actif)")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<CouponView> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "code") Pageable pageable) {
        Page<Coupon> page = repository.findAll(Specs.all(
                Specs.search(q, "code", "label"), Specs.eq("active", active)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Obtenir un coupon par code")
    @GetMapping("/{code}")
    @Transactional(readOnly = true)
    public CouponView byCode(@PathVariable String code) {
        return toView(repository.findByCode(code).orElseThrow(() -> NotFoundException.of("Coupon", code)));
    }

    @Operation(summary = "Créer un coupon (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CouponView create(@Valid @RequestBody CouponCreate req) {
        if (repository.existsByCode(req.code())) {
            throw new ApiException(HttpStatus.CONFLICT, "Code coupon déjà utilisé : " + req.code());
        }
        Coupon c = new Coupon();
        c.setCode(req.code());
        c.setLabel(req.label());
        c.setDiscountPercent(req.discountPercent());
        c.setMinAmount(req.minAmount());
        if (req.active() != null) c.setActive(req.active());
        c.setExpiresAt(req.expiresAt());
        return toView(repository.save(c));
    }

    @Operation(summary = "Mettre à jour un coupon (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    @Transactional
    public CouponView update(@PathVariable UUID id, @Valid @RequestBody CouponUpdate req) {
        Coupon c = repository.findById(id).orElseThrow(() -> NotFoundException.of("Coupon", id));
        if (req.label() != null) c.setLabel(req.label());
        if (req.discountPercent() != null) c.setDiscountPercent(req.discountPercent());
        if (req.minAmount() != null) c.setMinAmount(req.minAmount());
        if (req.active() != null) c.setActive(req.active());
        if (req.expiresAt() != null) c.setExpiresAt(req.expiresAt());
        return toView(repository.save(c));
    }

    @Operation(summary = "Supprimer un coupon (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Coupon", id)));
    }

    private CouponView toView(Coupon c) {
        return new CouponView(c.getId(), c.getCode(), c.getLabel(), c.getDiscountPercent(),
                c.getMinAmount(), c.isActive(), c.getExpiresAt());
    }
}

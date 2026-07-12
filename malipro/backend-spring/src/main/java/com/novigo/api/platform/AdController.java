package com.novigo.api.platform;

import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.platform.Ad;
import com.novigo.domain.platform.AdRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Plateforme — Publicités / Bannières")
@RestController
@RequestMapping("/api/v1/ads")
@RequiredArgsConstructor
public class AdController {

    private final AdRepository repository;

    public record AdView(UUID id, String title, String subtitle, String imageUrl, String targetUrl,
                         String placement, boolean active, Instant startsAt, Instant endsAt, int sortOrder) {}

    public record AdUpsert(@NotBlank @Size(max = 160) String title, @Size(max = 400) String subtitle,
                           @Size(max = 400) String imageUrl, @Size(max = 400) String targetUrl,
                           @Size(max = 40) String placement, Boolean active,
                           Instant startsAt, Instant endsAt, int sortOrder) {}

    @Operation(summary = "Bannières actives (public)")
    @GetMapping
    @Transactional(readOnly = true)
    public List<AdView> active() {
        return repository.findByActiveTrueOrderBySortOrderAsc().stream().map(this::toView).toList();
    }

    @Operation(summary = "Toutes les bannières (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping("/all")
    @Transactional(readOnly = true)
    public List<AdView> all() {
        return repository.findAll().stream().map(this::toView).toList();
    }

    @Operation(summary = "Créer une bannière (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AdView create(@Valid @RequestBody AdUpsert req) {
        return toView(repository.save(apply(new Ad(), req)));
    }

    @Operation(summary = "Mettre à jour une bannière (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    @Transactional
    public AdView update(@PathVariable UUID id, @Valid @RequestBody AdUpsert req) {
        Ad a = repository.findById(id).orElseThrow(() -> NotFoundException.of("Bannière", id));
        return toView(repository.save(apply(a, req)));
    }

    @Operation(summary = "Supprimer une bannière (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Bannière", id)));
    }

    private Ad apply(Ad a, AdUpsert req) {
        a.setTitle(req.title());
        a.setSubtitle(req.subtitle());
        a.setImageUrl(req.imageUrl());
        a.setTargetUrl(req.targetUrl());
        if (req.placement() != null) a.setPlacement(req.placement());
        if (req.active() != null) a.setActive(req.active());
        a.setStartsAt(req.startsAt());
        a.setEndsAt(req.endsAt());
        a.setSortOrder(req.sortOrder());
        return a;
    }

    private AdView toView(Ad a) {
        return new AdView(a.getId(), a.getTitle(), a.getSubtitle(), a.getImageUrl(), a.getTargetUrl(),
                a.getPlacement(), a.isActive(), a.getStartsAt(), a.getEndsAt(), a.getSortOrder());
    }
}

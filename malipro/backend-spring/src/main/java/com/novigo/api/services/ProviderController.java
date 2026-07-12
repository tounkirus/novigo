package com.novigo.api.services;

import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.services.Provider;
import com.novigo.domain.services.ProviderRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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

import java.math.BigDecimal;
import java.util.UUID;

@Tag(name = "Services — Prestataires")
@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final ProviderRepository repository;
    private final UserRepository userRepository;

    public record ProviderView(UUID id, UUID userId, String displayName, String profession, String vertical,
                               String bio, String city, String district, long hourlyRate, BigDecimal rating,
                               int reviewCount, String kycStatus, String status, boolean available,
                               String avatarUrl, String coverUrl) {}

    public record ProviderCreate(UUID userId, @NotBlank @Size(max = 160) String displayName,
                                 @Size(max = 80) String profession, @Size(max = 60) String vertical,
                                 @Size(max = 2000) String bio, @Size(max = 120) String city,
                                 @Size(max = 120) String district, long hourlyRate,
                                 @Size(max = 400) String avatarUrl, @Size(max = 400) String coverUrl) {}

    public record ProviderUpdate(@Size(max = 160) String displayName, @Size(max = 80) String profession,
                                 @Size(max = 60) String vertical, @Size(max = 2000) String bio,
                                 @Size(max = 120) String city, @Size(max = 120) String district,
                                 Long hourlyRate, @Size(max = 24) String kycStatus,
                                 @Size(max = 24) String status, Boolean available,
                                 @Size(max = 400) String avatarUrl, @Size(max = 400) String coverUrl) {}

    @Operation(summary = "Lister les prestataires (recherche, filtres vertical/ville/disponibilité)")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<ProviderView> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String vertical,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean available,
            @PageableDefault(size = 20, sort = "displayName") Pageable pageable) {
        Page<Provider> page = repository.findAll(Specs.all(
                Specs.search(q, "displayName", "profession", "bio"),
                Specs.eq("vertical", vertical), Specs.eqIgnoreCase("city", city),
                Specs.eq("available", available)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Obtenir un prestataire")
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ProviderView get(@PathVariable UUID id) {
        return toView(find(id));
    }

    @Operation(summary = "Enregistrer un prestataire (PROVIDER/ADMIN)")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ProviderView create(@Valid @RequestBody ProviderCreate req) {
        if (req.userId() != null && repository.existsByUserId(req.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Cet utilisateur est déjà prestataire.");
        }
        Provider p = new Provider();
        if (req.userId() != null) {
            p.setUser(userRepository.findById(req.userId())
                    .orElseThrow(() -> NotFoundException.of("Utilisateur", req.userId())));
        }
        p.setDisplayName(req.displayName());
        p.setProfession(req.profession());
        p.setVertical(req.vertical());
        p.setBio(req.bio());
        p.setCity(req.city());
        p.setDistrict(req.district());
        p.setHourlyRate(req.hourlyRate());
        p.setAvatarUrl(req.avatarUrl());
        p.setCoverUrl(req.coverUrl());
        return toView(repository.save(p));
    }

    @Operation(summary = "Mettre à jour un prestataire (PROVIDER/ADMIN)")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    @Transactional
    public ProviderView update(@PathVariable UUID id, @Valid @RequestBody ProviderUpdate req) {
        Provider p = find(id);
        if (req.displayName() != null) p.setDisplayName(req.displayName());
        if (req.profession() != null) p.setProfession(req.profession());
        if (req.vertical() != null) p.setVertical(req.vertical());
        if (req.bio() != null) p.setBio(req.bio());
        if (req.city() != null) p.setCity(req.city());
        if (req.district() != null) p.setDistrict(req.district());
        if (req.hourlyRate() != null) p.setHourlyRate(req.hourlyRate());
        if (req.kycStatus() != null) p.setKycStatus(req.kycStatus());
        if (req.status() != null) p.setStatus(req.status());
        if (req.available() != null) p.setAvailable(req.available());
        if (req.avatarUrl() != null) p.setAvatarUrl(req.avatarUrl());
        if (req.coverUrl() != null) p.setCoverUrl(req.coverUrl());
        return toView(repository.save(p));
    }

    @Operation(summary = "Supprimer un prestataire (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(find(id));
    }

    private Provider find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Prestataire", id));
    }

    private ProviderView toView(Provider p) {
        return new ProviderView(p.getId(), p.getUser() == null ? null : p.getUser().getId(),
                p.getDisplayName(), p.getProfession(), p.getVertical(), p.getBio(), p.getCity(),
                p.getDistrict(), p.getHourlyRate(), p.getRating(), p.getReviewCount(), p.getKycStatus(),
                p.getStatus(), p.isAvailable(), p.getAvatarUrl(), p.getCoverUrl());
    }
}

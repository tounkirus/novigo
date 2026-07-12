package com.novigo.api.logistics;

import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.logistics.Driver;
import com.novigo.domain.logistics.DriverRepository;
import com.novigo.domain.logistics.Vehicle;
import com.novigo.domain.logistics.VehicleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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

@Tag(name = "Logistique — Livreurs")
@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverRepository repository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    public record DriverView(UUID id, UUID userId, UUID vehicleId, String status, String kycStatus,
                             Double currentLat, Double currentLng, BigDecimal rating,
                             int totalDeliveries, boolean available) {}

    public record DriverCreate(@NotNull UUID userId, UUID vehicleId, @Size(max = 24) String status) {}

    public record DriverUpdate(@Size(max = 24) String status, @Size(max = 24) String kycStatus,
                               Boolean available, UUID vehicleId) {}

    public record LocationUpdate(@NotNull Double lat, @NotNull Double lng) {}

    @Operation(summary = "Lister les livreurs (filtres statut/disponibilité)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','MERCHANT')")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<DriverView> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String kycStatus,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<Driver> page = repository.findAll(Specs.all(
                Specs.eq("status", status), Specs.eq("available", available),
                Specs.eq("kycStatus", kycStatus)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Obtenir un livreur")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public DriverView get(@PathVariable UUID id) {
        return toView(find(id));
    }

    @Operation(summary = "Enrôler un livreur (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public DriverView create(@Valid @RequestBody DriverCreate req) {
        if (repository.existsByUserId(req.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Cet utilisateur est déjà livreur.");
        }
        Driver d = new Driver();
        d.setUser(userRepository.findById(req.userId())
                .orElseThrow(() -> NotFoundException.of("Utilisateur", req.userId())));
        if (req.vehicleId() != null) d.setVehicle(vehicle(req.vehicleId()));
        if (req.status() != null) d.setStatus(req.status());
        return toView(repository.save(d));
    }

    @Operation(summary = "Mettre à jour un livreur (statut/KYC/disponibilité)")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    @Transactional
    public DriverView update(@PathVariable UUID id, @Valid @RequestBody DriverUpdate req) {
        Driver d = find(id);
        if (req.status() != null) d.setStatus(req.status());
        if (req.kycStatus() != null) d.setKycStatus(req.kycStatus());
        if (req.available() != null) d.setAvailable(req.available());
        if (req.vehicleId() != null) d.setVehicle(vehicle(req.vehicleId()));
        return toView(repository.save(d));
    }

    @Operation(summary = "Mettre à jour la position GPS du livreur")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN','SUPER_ADMIN')")
    @PatchMapping("/{id}/location")
    @Transactional
    public DriverView updateLocation(@PathVariable UUID id, @Valid @RequestBody LocationUpdate req) {
        Driver d = find(id);
        d.setCurrentLat(req.lat());
        d.setCurrentLng(req.lng());
        return toView(repository.save(d));
    }

    @Operation(summary = "Retirer un livreur (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(find(id));
    }

    private Driver find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Livreur", id));
    }

    private Vehicle vehicle(UUID id) {
        return vehicleRepository.findById(id).orElseThrow(() -> NotFoundException.of("Véhicule", id));
    }

    private DriverView toView(Driver d) {
        return new DriverView(d.getId(), d.getUser() == null ? null : d.getUser().getId(),
                d.getVehicle() == null ? null : d.getVehicle().getId(), d.getStatus(), d.getKycStatus(),
                d.getCurrentLat(), d.getCurrentLng(), d.getRating(), d.getTotalDeliveries(), d.isAvailable());
    }
}

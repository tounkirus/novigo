package com.novigo.api.services;

import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.services.Booking;
import com.novigo.domain.services.BookingRepository;
import com.novigo.domain.services.ProviderRepository;
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

import java.time.Instant;
import java.util.UUID;

@Tag(name = "Services — Réservations")
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingRepository repository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;

    public record BookingView(UUID id, String ref, UUID customerId, UUID providerId, String serviceLabel,
                              String status, Instant scheduledAt, String address, String district,
                              long quotedPrice, Long finalPrice, String paymentStatus, String notes) {}

    public record BookingCreate(@NotNull UUID providerId, UUID customerId,
                                @Size(max = 160) String serviceLabel, Instant scheduledAt,
                                @Size(max = 240) String address, @Size(max = 120) String district,
                                long quotedPrice, @Size(max = 2000) String notes) {}

    public record BookingStatusUpdate(@Size(max = 24) String status, Long finalPrice,
                                      @Size(max = 24) String paymentStatus) {}

    @Operation(summary = "Lister les réservations (filtres client/prestataire/statut)")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<BookingView> list(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID providerId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<Booking> page = repository.findAll(Specs.all(
                Specs.joinEq("customer", "id", customerId),
                Specs.joinEq("provider", "id", providerId),
                Specs.eq("status", status)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Obtenir une réservation")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public BookingView get(@PathVariable UUID id) {
        return toView(find(id));
    }

    @Operation(summary = "Créer une réservation")
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public BookingView create(@Valid @RequestBody BookingCreate req) {
        Booking b = new Booking();
        b.setRef(generateRef());
        b.setProvider(providerRepository.findById(req.providerId())
                .orElseThrow(() -> NotFoundException.of("Prestataire", req.providerId())));
        if (req.customerId() != null) {
            b.setCustomer(userRepository.findById(req.customerId())
                    .orElseThrow(() -> NotFoundException.of("Client", req.customerId())));
        }
        b.setServiceLabel(req.serviceLabel());
        b.setScheduledAt(req.scheduledAt());
        b.setAddress(req.address());
        b.setDistrict(req.district());
        b.setQuotedPrice(req.quotedPrice());
        b.setNotes(req.notes());
        return toView(repository.save(b));
    }

    @Operation(summary = "Mettre à jour le statut d'une réservation")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN','SUPER_ADMIN')")
    @PatchMapping("/{id}/status")
    @Transactional
    public BookingView updateStatus(@PathVariable UUID id, @Valid @RequestBody BookingStatusUpdate req) {
        Booking b = find(id);
        if (req.status() != null) b.setStatus(req.status());
        if (req.finalPrice() != null) b.setFinalPrice(req.finalPrice());
        if (req.paymentStatus() != null) b.setPaymentStatus(req.paymentStatus());
        return toView(repository.save(b));
    }

    @Operation(summary = "Supprimer une réservation (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(find(id));
    }

    private Booking find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Réservation", id));
    }

    private String generateRef() {
        String ref;
        do {
            ref = "RDV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (repository.existsByRef(ref));
        return ref;
    }

    private BookingView toView(Booking b) {
        return new BookingView(b.getId(), b.getRef(),
                b.getCustomer() == null ? null : b.getCustomer().getId(),
                b.getProvider() == null ? null : b.getProvider().getId(),
                b.getServiceLabel(), b.getStatus(), b.getScheduledAt(), b.getAddress(), b.getDistrict(),
                b.getQuotedPrice(), b.getFinalPrice(), b.getPaymentStatus(), b.getNotes());
    }
}

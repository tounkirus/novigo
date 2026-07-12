package com.novigo.api.platform;

import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.platform.Subscription;
import com.novigo.domain.platform.SubscriptionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Plateforme — Abonnements")
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class SubscriptionController {

    private final SubscriptionRepository repository;
    private final UserRepository userRepository;

    public record SubscriptionView(UUID id, UUID subscriberId, String plan, String subscriberRole,
                                   String status, long pricePerMonth, Instant startedAt, Instant renewsAt,
                                   boolean autoRenew) {}

    public record SubscriptionCreate(@NotNull UUID subscriberId, @NotBlank @Size(max = 40) String plan,
                                     @Size(max = 24) String subscriberRole, long pricePerMonth, Boolean autoRenew) {}

    @Operation(summary = "Abonnements d'un utilisateur")
    @GetMapping("/by-subscriber/{subscriberId}")
    @Transactional(readOnly = true)
    public List<SubscriptionView> bySubscriber(@PathVariable UUID subscriberId) {
        return repository.findBySubscriberId(subscriberId).stream().map(this::toView).toList();
    }

    @Operation(summary = "Souscrire un abonnement")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SubscriptionView create(@Valid @RequestBody SubscriptionCreate req) {
        Subscription s = new Subscription();
        s.setSubscriber(userRepository.findById(req.subscriberId())
                .orElseThrow(() -> NotFoundException.of("Utilisateur", req.subscriberId())));
        s.setPlan(req.plan());
        s.setSubscriberRole(req.subscriberRole());
        s.setPricePerMonth(req.pricePerMonth());
        if (req.autoRenew() != null) s.setAutoRenew(req.autoRenew());
        s.setStartedAt(Instant.now());
        return toView(repository.save(s));
    }

    @Operation(summary = "Annuler un abonnement")
    @PatchMapping("/{id}/cancel")
    @Transactional
    public SubscriptionView cancel(@PathVariable UUID id) {
        Subscription s = repository.findById(id).orElseThrow(() -> NotFoundException.of("Abonnement", id));
        s.setStatus("CANCELLED");
        s.setAutoRenew(false);
        return toView(repository.save(s));
    }

    private SubscriptionView toView(Subscription s) {
        return new SubscriptionView(s.getId(), s.getSubscriber() == null ? null : s.getSubscriber().getId(),
                s.getPlan(), s.getSubscriberRole(), s.getStatus(), s.getPricePerMonth(),
                s.getStartedAt(), s.getRenewsAt(), s.isAutoRenew());
    }
}

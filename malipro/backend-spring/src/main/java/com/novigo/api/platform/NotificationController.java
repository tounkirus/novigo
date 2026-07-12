package com.novigo.api.platform;

import com.novigo.auth.AuthPrincipal;
import com.novigo.common.api.PageResponse;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.platform.Notification;
import com.novigo.domain.platform.NotificationRepository;
import com.novigo.notification.NotificationDispatcher;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Plateforme — Notifications")
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final NotificationDispatcher dispatcher;

    public record NotificationView(UUID id, UUID userId, String channel, String title, String body,
                                   String category, boolean read, String actionUrl, Instant createdAt) {}

    public record NotificationCreate(@NotNull UUID userId, @Size(max = 24) String channel,
                                     @NotBlank @Size(max = 160) String title, @Size(max = 1000) String body,
                                     @Size(max = 40) String category, @Size(max = 400) String actionUrl) {}

    public record DispatchRequest(@NotNull UUID userId, java.util.List<String> channels,
                                  @NotBlank @Size(max = 160) String title, @Size(max = 1000) String body,
                                  @Size(max = 40) String category, @Size(max = 400) String actionUrl) {}

    @Operation(summary = "Mes notifications")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<NotificationView> list(@AuthenticationPrincipal AuthPrincipal principal,
                                               @PageableDefault(size = 30, sort = "createdAt") Pageable pageable) {
        Page<Notification> page = repository.findByUserId(principal.userId(), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Nombre de notifications non lues")
    @GetMapping("/unread-count")
    @Transactional(readOnly = true)
    public Map<String, Long> unreadCount(@AuthenticationPrincipal AuthPrincipal principal) {
        return Map.of("count", repository.countByUserIdAndReadFalse(principal.userId()));
    }

    @Operation(summary = "Envoyer une notification (ADMIN/système)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public NotificationView create(@Valid @RequestBody NotificationCreate req) {
        Notification n = new Notification();
        n.setUser(userRepository.findById(req.userId())
                .orElseThrow(() -> NotFoundException.of("Utilisateur", req.userId())));
        if (req.channel() != null) n.setChannel(req.channel());
        n.setTitle(req.title());
        n.setBody(req.body());
        n.setCategory(req.category());
        n.setActionUrl(req.actionUrl());
        return toView(repository.save(n));
    }

    @Operation(summary = "Canaux de notification disponibles")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping("/channels")
    public java.util.List<String> channels() {
        return dispatcher.availableChannels();
    }

    @Operation(summary = "Diffuser une notification multi-canal (ADMIN/système)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping("/dispatch")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> dispatch(@Valid @RequestBody DispatchRequest req) {
        var sent = dispatcher.dispatch(req.userId(), req.channels(), req.title(), req.body(),
                req.category(), req.actionUrl());
        return Map.of("dispatched", sent);
    }

    @Operation(summary = "Marquer une notification comme lue")
    @PatchMapping("/{id}/read")
    @Transactional
    public NotificationView markRead(@PathVariable UUID id) {
        Notification n = repository.findById(id).orElseThrow(() -> NotFoundException.of("Notification", id));
        n.setRead(true);
        return toView(repository.save(n));
    }

    @Operation(summary = "Tout marquer comme lu")
    @PatchMapping("/read-all")
    @Transactional
    public Map<String, Integer> markAllRead(@AuthenticationPrincipal AuthPrincipal principal) {
        var unread = repository.findByUserId(principal.userId(), Pageable.unpaged()).getContent().stream()
                .filter(n -> !n.isRead()).peek(n -> n.setRead(true)).toList();
        repository.saveAll(unread);
        return Map.of("updated", unread.size());
    }

    @Operation(summary = "Supprimer une notification")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Notification", id)));
    }

    private NotificationView toView(Notification n) {
        return new NotificationView(n.getId(), n.getUser() == null ? null : n.getUser().getId(),
                n.getChannel(), n.getTitle(), n.getBody(), n.getCategory(), n.isRead(),
                n.getActionUrl(), n.getCreatedAt());
    }
}

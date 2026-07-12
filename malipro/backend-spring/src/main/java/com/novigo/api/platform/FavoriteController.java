package com.novigo.api.platform;

import com.novigo.auth.AuthPrincipal;
import com.novigo.common.api.PageResponse;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.platform.Favorite;
import com.novigo.domain.platform.FavoriteRepository;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@Tag(name = "Plateforme — Favoris")
@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class FavoriteController {

    private final FavoriteRepository repository;
    private final UserRepository userRepository;

    public record FavoriteView(UUID id, UUID userId, String targetType, UUID targetId, Instant createdAt) {}

    public record FavoriteCreate(@NotNull @Size(max = 24) String targetType, @NotNull UUID targetId) {}

    @Operation(summary = "Lister mes favoris")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<FavoriteView> list(@AuthenticationPrincipal AuthPrincipal principal,
                                           @PageableDefault(size = 30, sort = "createdAt") Pageable pageable) {
        Page<Favorite> page = repository.findByUserId(principal.userId(), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Ajouter un favori (idempotent)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public FavoriteView add(@AuthenticationPrincipal AuthPrincipal principal,
                            @Valid @RequestBody FavoriteCreate req) {
        Favorite existing = repository.findByUserIdAndTargetTypeAndTargetId(
                principal.userId(), req.targetType(), req.targetId()).orElse(null);
        if (existing != null) return toView(existing);
        Favorite f = new Favorite();
        f.setUser(userRepository.findById(principal.userId())
                .orElseThrow(() -> NotFoundException.of("Utilisateur", principal.userId())));
        f.setTargetType(req.targetType());
        f.setTargetId(req.targetId());
        return toView(repository.save(f));
    }

    @Operation(summary = "Retirer un favori par cible")
    @DeleteMapping
    @Transactional
    public ResponseEntity<Void> removeByTarget(@AuthenticationPrincipal AuthPrincipal principal,
                                               @RequestParam String targetType, @RequestParam UUID targetId) {
        repository.findByUserIdAndTargetTypeAndTargetId(principal.userId(), targetType, targetId)
                .ifPresent(repository::delete);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Retirer un favori par identifiant")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void remove(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Favori", id)));
    }

    private FavoriteView toView(Favorite f) {
        return new FavoriteView(f.getId(), f.getUser().getId(), f.getTargetType(), f.getTargetId(), f.getCreatedAt());
    }
}

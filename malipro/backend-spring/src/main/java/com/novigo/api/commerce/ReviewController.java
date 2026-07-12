package com.novigo.api.commerce;

import com.novigo.auth.AuthPrincipal;
import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.commerce.Review;
import com.novigo.domain.commerce.ReviewRepository;
import com.novigo.domain.identity.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
import java.util.UUID;

@Tag(name = "Commerce — Avis")
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository repository;
    private final UserRepository userRepository;

    public record ReviewView(UUID id, UUID authorId, String targetType, UUID targetId,
                             int rating, String comment, Instant createdAt) {}

    public record ReviewCreate(
            @NotNull @Size(max = 24) String targetType,
            @NotNull UUID targetId,
            @Min(1) @Max(5) int rating,
            @Size(max = 1000) String comment) {}

    @Operation(summary = "Lister les avis (filtres cible)")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<ReviewView> list(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) UUID targetId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<Review> page = repository.findAll(Specs.all(
                Specs.eq("targetType", targetType), Specs.eq("targetId", targetId)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Publier un avis (authentifié)")
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ReviewView create(@Valid @RequestBody ReviewCreate req,
                             @AuthenticationPrincipal AuthPrincipal principal) {
        Review r = new Review();
        userRepository.findById(principal.userId()).ifPresent(r::setAuthor);
        r.setTargetType(req.targetType());
        r.setTargetId(req.targetId());
        r.setRating(req.rating());
        r.setComment(req.comment());
        return toView(repository.save(r));
    }

    @Operation(summary = "Supprimer un avis (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Avis", id)));
    }

    private ReviewView toView(Review r) {
        return new ReviewView(r.getId(), r.getAuthor() == null ? null : r.getAuthor().getId(),
                r.getTargetType(), r.getTargetId(), r.getRating(), r.getComment(), r.getCreatedAt());
    }
}

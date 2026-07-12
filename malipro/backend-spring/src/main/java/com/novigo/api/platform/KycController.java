package com.novigo.api.platform;

import com.novigo.auth.AuthPrincipal;
import com.novigo.common.api.PageResponse;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.platform.Kyc;
import com.novigo.domain.platform.KycRepository;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@Tag(name = "Plateforme — KYC")
@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class KycController {

    private final KycRepository repository;
    private final UserRepository userRepository;

    public record KycView(UUID id, UUID subjectId, String subjectRole, String status,
                          UUID reviewedBy, Instant reviewedAt, String rejectionReason) {}

    public record KycSubmit(@NotBlank @Size(max = 24) String subjectRole) {}

    public record KycReview(@NotBlank @Size(max = 24) String status, @Size(max = 240) String rejectionReason) {}

    @Operation(summary = "Soumettre un dossier KYC")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public KycView submit(@AuthenticationPrincipal AuthPrincipal principal, @Valid @RequestBody KycSubmit req) {
        Kyc k = new Kyc();
        userRepository.findById(principal.userId()).ifPresent(k::setSubject);
        k.setSubjectRole(req.subjectRole());
        return toView(repository.save(k));
    }

    @Operation(summary = "Lister les dossiers KYC par statut (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<KycView> list(@RequestParam(defaultValue = "PENDING") String status,
                                      @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<Kyc> page = repository.findByStatus(status, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Statuer sur un dossier KYC (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PatchMapping("/{id}/review")
    @Transactional
    public KycView review(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal principal,
                          @Valid @RequestBody KycReview req) {
        Kyc k = repository.findById(id).orElseThrow(() -> NotFoundException.of("Dossier KYC", id));
        k.setStatus(req.status());
        k.setRejectionReason(req.rejectionReason());
        k.setReviewedBy(principal.userId());
        k.setReviewedAt(Instant.now());
        return toView(repository.save(k));
    }

    private KycView toView(Kyc k) {
        return new KycView(k.getId(), k.getSubject() == null ? null : k.getSubject().getId(),
                k.getSubjectRole(), k.getStatus(), k.getReviewedBy(), k.getReviewedAt(), k.getRejectionReason());
    }
}

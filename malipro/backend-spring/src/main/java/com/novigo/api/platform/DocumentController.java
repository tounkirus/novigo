package com.novigo.api.platform;

import com.novigo.auth.AuthPrincipal;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.platform.Document;
import com.novigo.domain.platform.DocumentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Plateforme — Documents")
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DocumentController {

    private final DocumentRepository repository;
    private final UserRepository userRepository;

    public record DocumentView(UUID id, UUID ownerId, String type, String fileUrl, String status,
                               String rejectionReason) {}

    public record DocumentCreate(@NotBlank @Size(max = 40) String type,
                                 @NotBlank @Size(max = 400) String fileUrl) {}

    public record DocumentReview(@NotBlank @Size(max = 24) String status, @Size(max = 240) String rejectionReason) {}

    @Operation(summary = "Mes documents")
    @GetMapping
    @Transactional(readOnly = true)
    public List<DocumentView> mine(@AuthenticationPrincipal AuthPrincipal principal) {
        return repository.findByOwnerId(principal.userId()).stream().map(this::toView).toList();
    }

    @Operation(summary = "Documents d'un utilisateur (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping("/by-owner/{ownerId}")
    @Transactional(readOnly = true)
    public List<DocumentView> byOwner(@PathVariable UUID ownerId) {
        return repository.findByOwnerId(ownerId).stream().map(this::toView).toList();
    }

    @Operation(summary = "Téléverser un document")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public DocumentView create(@AuthenticationPrincipal AuthPrincipal principal,
                               @Valid @RequestBody DocumentCreate req) {
        Document d = new Document();
        userRepository.findById(principal.userId()).ifPresent(d::setOwner);
        d.setType(req.type());
        d.setFileUrl(req.fileUrl());
        return toView(repository.save(d));
    }

    @Operation(summary = "Valider/rejeter un document (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PatchMapping("/{id}/review")
    @Transactional
    public DocumentView review(@PathVariable UUID id, @Valid @RequestBody DocumentReview req) {
        Document d = repository.findById(id).orElseThrow(() -> NotFoundException.of("Document", id));
        d.setStatus(req.status());
        d.setRejectionReason(req.rejectionReason());
        return toView(repository.save(d));
    }

    @Operation(summary = "Supprimer un document")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Document", id)));
    }

    private DocumentView toView(Document d) {
        return new DocumentView(d.getId(), d.getOwner() == null ? null : d.getOwner().getId(),
                d.getType(), d.getFileUrl(), d.getStatus(), d.getRejectionReason());
    }
}

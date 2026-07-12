package com.novigo.api.platform;

import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.platform.Media;
import com.novigo.domain.platform.MediaRepository;
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

import java.util.List;
import java.util.UUID;

@Tag(name = "Plateforme — Médiathèque")
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MediaController {

    private final MediaRepository repository;

    public record MediaView(UUID id, String url, String provider, String contentType, long fileSize,
                            String ownerType, UUID ownerId, String label) {}

    public record MediaCreate(@NotBlank @Size(max = 400) String url, @Size(max = 24) String provider,
                              @Size(max = 80) String contentType, long fileSize,
                              @Size(max = 40) String ownerType, UUID ownerId, @Size(max = 160) String label) {}

    @Operation(summary = "Lister les médias d'un propriétaire")
    @GetMapping
    @Transactional(readOnly = true)
    public List<MediaView> byOwner(@RequestParam String ownerType, @RequestParam UUID ownerId) {
        return repository.findByOwnerTypeAndOwnerId(ownerType, ownerId).stream().map(this::toView).toList();
    }

    @Operation(summary = "Enregistrer un média")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MediaView create(@Valid @RequestBody MediaCreate req) {
        Media m = new Media();
        m.setUrl(req.url());
        if (req.provider() != null) m.setProvider(req.provider());
        m.setContentType(req.contentType());
        m.setFileSize(req.fileSize());
        m.setOwnerType(req.ownerType());
        m.setOwnerId(req.ownerId());
        m.setLabel(req.label());
        return toView(repository.save(m));
    }

    @Operation(summary = "Supprimer un média")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Média", id)));
    }

    private MediaView toView(Media m) {
        return new MediaView(m.getId(), m.getUrl(), m.getProvider(), m.getContentType(), m.getFileSize(),
                m.getOwnerType(), m.getOwnerId(), m.getLabel());
    }
}

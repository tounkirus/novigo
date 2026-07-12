package com.novigo.api.storage;

import com.novigo.common.exception.ApiException;
import com.novigo.domain.platform.Media;
import com.novigo.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Stockage — Médias")
@RestController
@RequestMapping("/api/v1/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService service;

    public record MediaView(UUID id, String url, String provider, String contentType, long fileSize,
                            String ownerType, UUID ownerId, String label) {}

    @Operation(summary = "Fournisseurs de stockage disponibles + actif (public)")
    @GetMapping("/providers")
    public List<Map<String, Object>> providers() {
        return service.listProviders();
    }

    @Operation(summary = "Téléverser un fichier via le fournisseur actif")
    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public MediaView upload(@RequestParam("file") MultipartFile file,
                            @RequestParam(required = false) String provider,
                            @RequestParam(required = false) String ownerType,
                            @RequestParam(required = false) UUID ownerId,
                            @RequestParam(required = false) String label) {
        if (file.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Fichier vide.");
        try {
            Media m = service.upload(provider, file.getOriginalFilename(), file.getContentType(),
                    file.getBytes(), ownerType, ownerId, label);
            return toView(m);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lecture du fichier échouée : " + e.getMessage());
        }
    }

    @Operation(summary = "Supprimer un média")
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{mediaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID mediaId) {
        service.delete(mediaId);
    }

    private MediaView toView(Media m) {
        return new MediaView(m.getId(), m.getUrl(), m.getProvider(), m.getContentType(), m.getFileSize(),
                m.getOwnerType(), m.getOwnerId(), m.getLabel());
    }
}

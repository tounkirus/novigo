package com.novigo.storage.provider;

import com.novigo.common.exception.ApiException;
import com.novigo.config.NovigoProperties;
import com.novigo.storage.StorageProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Stockage local sur disque : écrit les octets dans un dossier configurable et renvoie une URL publique. */
@Component
@RequiredArgsConstructor
public class LocalStorageProvider implements StorageProvider {

    private final NovigoProperties props;

    @Override public String code() { return "LOCAL"; }
    @Override public String label() { return "Stockage local"; }

    @Override
    public StoredFile store(String filename, String contentType, byte[] content) {
        String safe = sanitize(filename);
        String stored = UUID.randomUUID().toString().substring(0, 8) + "_" + safe;
        try {
            Path dir = Path.of(props.getStorage().getLocalDir());
            Files.createDirectories(dir);
            Files.write(dir.resolve(stored), content == null ? new byte[0] : content);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Écriture du fichier échouée : " + e.getMessage());
        }
        String url = props.getStorage().getPublicBaseUrl() + "/" + stored;
        return new StoredFile(url, code(), contentType, content == null ? 0 : content.length);
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) return "fichier";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}

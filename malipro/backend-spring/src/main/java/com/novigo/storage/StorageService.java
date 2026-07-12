package com.novigo.storage;

import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.config.NovigoProperties;
import com.novigo.domain.platform.Media;
import com.novigo.domain.platform.MediaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Sélectionne le fournisseur de stockage actif, stocke les octets et persiste un {@link Media}. */
@Service
public class StorageService {

    private final Map<String, StorageProvider> providers;
    private final NovigoProperties props;
    private final MediaRepository mediaRepository;

    public StorageService(List<StorageProvider> providerBeans, NovigoProperties props,
                          MediaRepository mediaRepository) {
        this.providers = providerBeans.stream()
                .collect(Collectors.toMap(StorageProvider::code, Function.identity()));
        this.props = props;
        this.mediaRepository = mediaRepository;
    }

    public List<Map<String, Object>> listProviders() {
        return providers.values().stream()
                .map(p -> Map.<String, Object>of("code", p.code(), "label", p.label(),
                        "active", p.code().equals(props.getStorage().getProvider())))
                .toList();
    }

    private StorageProvider resolve(String code) {
        String target = (code == null || code.isBlank()) ? props.getStorage().getProvider() : code;
        StorageProvider p = providers.get(target);
        if (p == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Fournisseur de stockage inconnu : " + target);
        return p;
    }

    @Transactional
    public Media upload(String providerCode, String filename, String contentType, byte[] content,
                        String ownerType, UUID ownerId, String label) {
        StorageProvider.StoredFile stored = resolve(providerCode).store(filename, contentType, content);
        Media m = new Media();
        m.setUrl(stored.url());
        m.setProvider(stored.provider());
        m.setContentType(stored.contentType());
        m.setFileSize(stored.size());
        m.setOwnerType(ownerType);
        m.setOwnerId(ownerId);
        m.setLabel(label == null ? filename : label);
        return mediaRepository.save(m);
    }

    @Transactional
    public void delete(UUID mediaId) {
        Media m = mediaRepository.findById(mediaId).orElseThrow(() -> NotFoundException.of("Média", mediaId));
        providers.values().stream()
                .filter(p -> p.code().equals(m.getProvider()))
                .findFirst().ifPresent(p -> p.delete(m.getUrl()));
        mediaRepository.delete(m);
    }
}

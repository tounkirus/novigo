package com.novigo.api.platform;

import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.platform.Setting;
import com.novigo.domain.platform.SettingRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Plateforme — Paramètres")
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingController {

    private final SettingRepository repository;

    public record SettingView(String key, String value, String category, String description) {}

    public record SettingUpsert(@NotBlank @Size(max = 120) String key, @Size(max = 2000) String value,
                                @Size(max = 40) String category, @Size(max = 240) String description) {}

    @Operation(summary = "Lister les paramètres (public)")
    @GetMapping
    @Transactional(readOnly = true)
    public List<SettingView> list() {
        return repository.findAll().stream().map(this::toView).toList();
    }

    @Operation(summary = "Obtenir un paramètre par clé (public)")
    @GetMapping("/{key}")
    @Transactional(readOnly = true)
    public SettingView byKey(@PathVariable String key) {
        return toView(repository.findByKey(key).orElseThrow(() -> NotFoundException.of("Paramètre", key)));
    }

    @Operation(summary = "Créer/mettre à jour un paramètre (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PutMapping
    @Transactional
    public SettingView upsert(@Valid @RequestBody SettingUpsert req) {
        Setting s = repository.findByKey(req.key()).orElseGet(Setting::new);
        s.setKey(req.key());
        s.setValue(req.value());
        if (req.category() != null) s.setCategory(req.category());
        s.setDescription(req.description());
        return toView(repository.save(s));
    }

    @Operation(summary = "Supprimer un paramètre (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{key}")
    @Transactional
    public void delete(@PathVariable String key) {
        repository.findByKey(key).ifPresent(repository::delete);
    }

    private SettingView toView(Setting s) {
        return new SettingView(s.getKey(), s.getValue(), s.getCategory(), s.getDescription());
    }
}

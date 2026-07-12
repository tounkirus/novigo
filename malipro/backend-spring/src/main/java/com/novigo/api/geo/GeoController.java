package com.novigo.api.geo;

import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.geo.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Géo — Pays / Villes / Zones")
@RestController
@RequestMapping("/api/v1/geo")
@RequiredArgsConstructor
public class GeoController {

    private final CountryRepository countryRepository;
    private final CityRepository cityRepository;
    private final DeliveryZoneRepository zoneRepository;

    // ---- DTOs ----
    public record CountryView(UUID id, String code, String name, String dialCode, String currency) {}
    public record CountryUpsert(@NotBlank @Size(max = 2) String code, @NotBlank @Size(max = 80) String name,
                                @Size(max = 8) String dialCode, @Size(max = 8) String currency) {}

    public record CityView(UUID id, String name, UUID countryId, Double lat, Double lng) {}
    public record CityUpsert(@NotBlank @Size(max = 120) String name, UUID countryId, Double lat, Double lng) {}

    public record ZoneView(UUID id, String name, UUID cityId, boolean active, long baseFee) {}
    public record ZoneUpsert(@NotBlank @Size(max = 120) String name, @NotNull UUID cityId,
                             Boolean active, long baseFee) {}

    // ---- Countries ----
    @Operation(summary = "Lister les pays (public)")
    @GetMapping("/countries")
    @Transactional(readOnly = true)
    public List<CountryView> countries() {
        return countryRepository.findAll().stream()
                .map(c -> new CountryView(c.getId(), c.getCode(), c.getName(), c.getDialCode(), c.getCurrency()))
                .toList();
    }

    @Operation(summary = "Créer un pays (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping("/countries")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CountryView createCountry(@Valid @RequestBody CountryUpsert req) {
        if (countryRepository.findByCode(req.code()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Code pays déjà utilisé : " + req.code());
        }
        Country c = new Country();
        c.setCode(req.code());
        c.setName(req.name());
        c.setDialCode(req.dialCode());
        c.setCurrency(req.currency());
        Country saved = countryRepository.save(c);
        return new CountryView(saved.getId(), saved.getCode(), saved.getName(), saved.getDialCode(), saved.getCurrency());
    }

    // ---- Cities ----
    @Operation(summary = "Lister les villes (public, filtre pays)")
    @GetMapping("/cities")
    @Transactional(readOnly = true)
    public List<CityView> cities(@RequestParam(required = false) UUID countryId) {
        var cities = countryId != null ? cityRepository.findByCountryId(countryId) : cityRepository.findAll();
        return cities.stream()
                .map(c -> new CityView(c.getId(), c.getName(),
                        c.getCountry() == null ? null : c.getCountry().getId(), c.getLat(), c.getLng()))
                .toList();
    }

    @Operation(summary = "Créer une ville (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping("/cities")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CityView createCity(@Valid @RequestBody CityUpsert req) {
        City c = new City();
        c.setName(req.name());
        c.setLat(req.lat());
        c.setLng(req.lng());
        if (req.countryId() != null) {
            c.setCountry(countryRepository.findById(req.countryId())
                    .orElseThrow(() -> NotFoundException.of("Pays", req.countryId())));
        }
        City saved = cityRepository.save(c);
        return new CityView(saved.getId(), saved.getName(),
                saved.getCountry() == null ? null : saved.getCountry().getId(), saved.getLat(), saved.getLng());
    }

    // ---- Delivery zones ----
    @Operation(summary = "Lister les zones de livraison (public, filtre ville)")
    @GetMapping("/zones")
    @Transactional(readOnly = true)
    public List<ZoneView> zones(@RequestParam(required = false) UUID cityId) {
        var zones = cityId != null ? zoneRepository.findByCityId(cityId) : zoneRepository.findAll();
        return zones.stream()
                .map(z -> new ZoneView(z.getId(), z.getName(),
                        z.getCity() == null ? null : z.getCity().getId(), z.isActive(), z.getBaseFee()))
                .toList();
    }

    @Operation(summary = "Créer une zone de livraison (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping("/zones")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ZoneView createZone(@Valid @RequestBody ZoneUpsert req) {
        DeliveryZone z = new DeliveryZone();
        z.setName(req.name());
        z.setCity(cityRepository.findById(req.cityId())
                .orElseThrow(() -> NotFoundException.of("Ville", req.cityId())));
        if (req.active() != null) z.setActive(req.active());
        z.setBaseFee(req.baseFee());
        DeliveryZone saved = zoneRepository.save(z);
        return new ZoneView(saved.getId(), saved.getName(), saved.getCity().getId(), saved.isActive(), saved.getBaseFee());
    }
}

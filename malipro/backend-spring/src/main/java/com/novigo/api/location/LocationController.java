package com.novigo.api.location;

import com.novigo.location.LocationProvider;
import com.novigo.location.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Géolocalisation — Distance / ETA / Tracking")
@RestController
@RequestMapping("/api/v1/location")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService service;

    @Operation(summary = "Fournisseurs de géolocalisation disponibles + actif (public)")
    @GetMapping("/providers")
    public List<Map<String, Object>> providers() {
        return service.listProviders();
    }

    @Operation(summary = "Distance + ETA entre deux points (public)")
    @GetMapping("/distance")
    public LocationProvider.RouteEstimate distance(
            @RequestParam double fromLat, @RequestParam double fromLng,
            @RequestParam double toLat, @RequestParam double toLng) {
        return service.estimate(fromLat, fromLng, toLat, toLng);
    }

    @Operation(summary = "Géocodage d'une adresse (public, simulé)")
    @GetMapping("/geocode")
    public LocationProvider.GeoPoint geocode(@RequestParam String address) {
        return service.geocode(address);
    }

    @Operation(summary = "Ville la plus proche d'un point (public)")
    @GetMapping("/nearest-city")
    public Map<String, Object> nearestCity(@RequestParam double lat, @RequestParam double lng) {
        return service.resolveNearestCity(lat, lng);
    }

    @Operation(summary = "Suivi d'une commande : position livreur + ETA")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/tracking/orders/{orderId}")
    public Map<String, Object> trackOrder(@PathVariable UUID orderId) {
        return service.trackOrder(orderId);
    }
}

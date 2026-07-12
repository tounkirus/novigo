package com.novigo.location;

import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.config.NovigoProperties;
import com.novigo.domain.commerce.Order;
import com.novigo.domain.commerce.OrderRepository;
import com.novigo.domain.geo.City;
import com.novigo.domain.geo.CityRepository;
import com.novigo.domain.logistics.Driver;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Sélectionne le fournisseur de géolocalisation actif et expose distance/ETA/zone/tracking. */
@Service
public class LocationService {

    private final Map<String, LocationProvider> providers;
    private final NovigoProperties props;
    private final CityRepository cityRepository;
    private final OrderRepository orderRepository;

    public LocationService(List<LocationProvider> providerBeans, NovigoProperties props,
                           CityRepository cityRepository, OrderRepository orderRepository) {
        this.providers = providerBeans.stream()
                .collect(Collectors.toMap(LocationProvider::code, Function.identity()));
        this.props = props;
        this.cityRepository = cityRepository;
        this.orderRepository = orderRepository;
    }

    public LocationProvider active() {
        LocationProvider p = providers.get(props.getLocation().getProvider());
        if (p == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fournisseur de géolocalisation introuvable : " + props.getLocation().getProvider());
        }
        return p;
    }

    @Cacheable("locationProviders")
    public List<Map<String, Object>> listProviders() {
        return providers.values().stream()
                .map(p -> Map.<String, Object>of("code", p.code(), "label", p.label(),
                        "avgSpeedKmh", p.avgSpeedKmh(), "active", p.code().equals(props.getLocation().getProvider())))
                .toList();
    }

    public LocationProvider.RouteEstimate estimate(double fromLat, double fromLng, double toLat, double toLng) {
        return active().estimate(fromLat, fromLng, toLat, toLng);
    }

    public LocationProvider.GeoPoint geocode(String address) {
        return active().geocode(address);
    }

    /** Résout la ville la plus proche d'un point (référentiel des villes géolocalisées). */
    @Transactional(readOnly = true)
    public Map<String, Object> resolveNearestCity(double lat, double lng) {
        City nearest = null;
        double best = Double.MAX_VALUE;
        for (City c : cityRepository.findAll()) {
            if (c.getLat() == null || c.getLng() == null) continue;
            double d = GeoMath.haversineKm(lat, lng, c.getLat(), c.getLng());
            if (d < best) {
                best = d;
                nearest = c;
            }
        }
        if (nearest == null) throw new ApiException(HttpStatus.NOT_FOUND, "Aucune ville géolocalisée.");
        return Map.of("cityId", nearest.getId(), "city", nearest.getName(),
                "distanceKm", LocationProvider.round(best));
    }

    /** Suivi d'une commande : position du livreur + ETA jusqu'à la boutique (point de retrait). */
    @Transactional(readOnly = true)
    public Map<String, Object> trackOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> NotFoundException.of("Commande", orderId));
        Driver driver = order.getDriver();
        if (driver == null || driver.getCurrentLat() == null || driver.getCurrentLng() == null) {
            return Map.of("orderRef", order.getRef(), "status", order.getStatus(),
                    "tracking", false, "message", "Aucun livreur positionné.");
        }
        Double destLat = order.getStore() == null ? null : order.getStore().getLat();
        Double destLng = order.getStore() == null ? null : order.getStore().getLng();
        var result = new java.util.LinkedHashMap<String, Object>();
        result.put("orderRef", order.getRef());
        result.put("status", order.getStatus());
        result.put("tracking", true);
        result.put("driverLat", driver.getCurrentLat());
        result.put("driverLng", driver.getCurrentLng());
        if (destLat != null && destLng != null) {
            var est = estimate(driver.getCurrentLat(), driver.getCurrentLng(), destLat, destLng);
            result.put("distanceKm", est.distanceKm());
            result.put("etaMinutes", est.etaMinutes());
        }
        return result;
    }
}

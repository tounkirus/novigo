package com.novigo.location;

/**
 * SPI d'un fournisseur de géolocalisation (OSM, Google, Mapbox).
 * En mode démo/dev, distance et ETA sont calculés localement (Haversine + vitesse moyenne),
 * sans appel externe. Un vrai provider surchargerait {@code estimate}/{@code geocode}.
 */
public interface LocationProvider {

    String code();

    String label();

    /** Vitesse moyenne (km/h) utilisée pour l'ETA. */
    double avgSpeedKmh();

    default RouteEstimate estimate(double fromLat, double fromLng, double toLat, double toLng) {
        double km = GeoMath.haversineKm(fromLat, fromLng, toLat, toLng);
        double etaMin = avgSpeedKmh() <= 0 ? 0 : (km / avgSpeedKmh()) * 60.0;
        return new RouteEstimate(round(km), round(etaMin));
    }

    /** Géocodage simulé : renvoie un point déterministe autour de Bamako. */
    default GeoPoint geocode(String address) {
        int h = address == null ? 0 : Math.abs(address.hashCode());
        double lat = 12.6392 + ((h % 200) - 100) / 1000.0;
        double lng = -8.0029 + (((h / 200) % 200) - 100) / 1000.0;
        return new GeoPoint(round(lat), round(lng), address);
    }

    static double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    record GeoPoint(double lat, double lng, String label) {}

    record RouteEstimate(double distanceKm, double etaMinutes) {}
}

package com.novigo.location;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GeoMathTest {

    @Test
    void distanceIsZeroForSamePoint() {
        assertThat(GeoMath.haversineKm(12.6392, -8.0029, 12.6392, -8.0029)).isEqualTo(0.0);
    }

    @Test
    void distanceBamakoToSegouIsRoughly200km() {
        // Bamako (12.639, -8.003) → Ségou (13.443, -6.266) ≈ 195 km
        double km = GeoMath.haversineKm(12.639, -8.003, 13.443, -6.266);
        assertThat(km).isBetween(180.0, 215.0);
    }

    @Test
    void etaScalesWithDistanceViaProviderDefault() {
        LocationProvider osm = new com.novigo.location.provider.OsmLocationProvider();
        LocationProvider.RouteEstimate est = osm.estimate(12.60, -8.00, 12.70, -8.00);
        assertThat(est.distanceKm()).isGreaterThan(0);
        assertThat(est.etaMinutes()).isGreaterThan(0);
        // ETA cohérente : distance / 25 km/h * 60
        assertThat(est.etaMinutes()).isCloseTo(est.distanceKm() / 25.0 * 60.0,
                org.assertj.core.data.Offset.offset(0.5));
    }
}

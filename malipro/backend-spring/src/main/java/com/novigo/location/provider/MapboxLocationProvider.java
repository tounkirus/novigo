package com.novigo.location.provider;

import com.novigo.location.LocationProvider;
import org.springframework.stereotype.Component;

@Component
public class MapboxLocationProvider implements LocationProvider {
    @Override public String code() { return "MAPBOX"; }
    @Override public String label() { return "Mapbox"; }
    @Override public double avgSpeedKmh() { return 27.0; }
}

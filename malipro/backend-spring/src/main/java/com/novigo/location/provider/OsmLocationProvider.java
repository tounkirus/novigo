package com.novigo.location.provider;

import com.novigo.location.LocationProvider;
import org.springframework.stereotype.Component;

@Component
public class OsmLocationProvider implements LocationProvider {
    @Override public String code() { return "OSM"; }
    @Override public String label() { return "OpenStreetMap"; }
    @Override public double avgSpeedKmh() { return 25.0; }
}

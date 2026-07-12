package com.novigo.location.provider;

import com.novigo.location.LocationProvider;
import org.springframework.stereotype.Component;

@Component
public class GoogleLocationProvider implements LocationProvider {
    @Override public String code() { return "GOOGLE"; }
    @Override public String label() { return "Google Maps"; }
    @Override public double avgSpeedKmh() { return 28.0; }
}

package com.novigo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration applicative NOVIGO (préfixe `novigo` dans application.yml / variables d'env).
 */
@ConfigurationProperties(prefix = "novigo")
public class NovigoProperties {

    /** Mode d'exécution : demo | dev | preprod | production. */
    private String mode = "demo";

    /** Origines autorisées CORS (Frontend Next.js). */
    private List<String> corsOrigins = new ArrayList<>(List.of(
            "http://localhost:5173", "http://localhost:3000", "http://localhost:5000"));

    private final Jwt jwt = new Jwt();
    private final Otp otp = new Otp();
    private final Payments payments = new Payments();
    private final Location location = new Location();
    private final Storage storage = new Storage();
    private final Security security = new Security();

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public List<String> getCorsOrigins() { return corsOrigins; }
    public void setCorsOrigins(List<String> corsOrigins) { this.corsOrigins = corsOrigins; }

    public Jwt getJwt() { return jwt; }
    public Otp getOtp() { return otp; }
    public Payments getPayments() { return payments; }
    public Location getLocation() { return location; }
    public Storage getStorage() { return storage; }
    public Security getSecurity() { return security; }

    /** Renvoie true si le code OTP peut être exposé dans la réponse (modes non-production). */
    public boolean isOtpDebugMode() {
        return !"production".equalsIgnoreCase(mode) && !"preprod".equalsIgnoreCase(mode);
    }

    /** Paramètres JWT (implémentés en SP3). */
    public static class Jwt {
        private String accessSecret = "change-me-access-secret-please-override-in-production-32b";
        private String refreshSecret = "change-me-refresh-secret-please-override-in-production-32b";
        private long accessTtlMinutes = 15;
        private long refreshTtlDays = 30;

        public String getAccessSecret() { return accessSecret; }
        public void setAccessSecret(String v) { this.accessSecret = v; }
        public String getRefreshSecret() { return refreshSecret; }
        public void setRefreshSecret(String v) { this.refreshSecret = v; }
        public long getAccessTtlMinutes() { return accessTtlMinutes; }
        public void setAccessTtlMinutes(long v) { this.accessTtlMinutes = v; }
        public long getRefreshTtlDays() { return refreshTtlDays; }
        public void setRefreshTtlDays(long v) { this.refreshTtlDays = v; }
    }

    /** Paramètres OTP (code à usage unique). */
    public static class Otp {
        private int length = 6;
        private long ttlMinutes = 10;
        private int maxAttempts = 5;

        public int getLength() { return length; }
        public void setLength(int v) { this.length = v; }
        public long getTtlMinutes() { return ttlMinutes; }
        public void setTtlMinutes(long v) { this.ttlMinutes = v; }
        public int getMaxAttempts() { return maxAttempts; }
        public void setMaxAttempts(int v) { this.maxAttempts = v; }
    }

    /** Paramètres financiers (commission plateforme, cashback) en points de base (bps). */
    public static class Payments {
        /** Commission plateforme sur les ventes, en bps (1000 = 10 %). */
        private int commissionBps = 1000;
        /** Cashback client sur les recharges/commandes, en bps (100 = 1 %). */
        private int cashbackBps = 100;

        public int getCommissionBps() { return commissionBps; }
        public void setCommissionBps(int v) { this.commissionBps = v; }
        public int getCashbackBps() { return cashbackBps; }
        public void setCashbackBps(int v) { this.cashbackBps = v; }
    }

    /** Fournisseur de géolocalisation actif. */
    public static class Location {
        private String provider = "OSM";
        public String getProvider() { return provider; }
        public void setProvider(String v) { this.provider = v; }
    }

    /** Fournisseur de stockage de médias actif + base d'URL locale. */
    public static class Storage {
        private String provider = "LOCAL";
        private String publicBaseUrl = "http://localhost:8081/files";
        private String localDir = "uploads";
        public String getProvider() { return provider; }
        public void setProvider(String v) { this.provider = v; }
        public String getPublicBaseUrl() { return publicBaseUrl; }
        public void setPublicBaseUrl(String v) { this.publicBaseUrl = v; }
        public String getLocalDir() { return localDir; }
        public void setLocalDir(String v) { this.localDir = v; }
    }

    /** Durcissement sécurité : limitation de débit sur les endpoints d'authentification. */
    public static class Security {
        private boolean rateLimitEnabled = true;
        private int authRequestsPerMinute = 60;

        public boolean isRateLimitEnabled() { return rateLimitEnabled; }
        public void setRateLimitEnabled(boolean v) { this.rateLimitEnabled = v; }
        public int getAuthRequestsPerMinute() { return authRequestsPerMinute; }
        public void setAuthRequestsPerMinute(int v) { this.authRequestsPerMinute = v; }
    }
}

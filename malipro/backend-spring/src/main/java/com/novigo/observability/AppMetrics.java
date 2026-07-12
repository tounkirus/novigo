package com.novigo.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

/**
 * Compteurs métier exposés via Micrometer/Prometheus (`/actuator/prometheus`).
 * Injecté dans les services pour instrumenter les événements clés.
 */
@Component
public class AppMetrics {

    private final Counter ordersCreated;
    private final Counter paymentsInitiated;
    private final Counter paymentsConfirmed;
    private final Counter notificationsDispatched;

    public AppMetrics(MeterRegistry registry) {
        this.ordersCreated = Counter.builder("novigo.orders.created")
                .description("Nombre de commandes créées").register(registry);
        this.paymentsInitiated = Counter.builder("novigo.payments.initiated")
                .description("Nombre de paiements initiés").register(registry);
        this.paymentsConfirmed = Counter.builder("novigo.payments.confirmed")
                .description("Nombre de paiements confirmés").register(registry);
        this.notificationsDispatched = Counter.builder("novigo.notifications.dispatched")
                .description("Nombre de notifications diffusées (tous canaux)").register(registry);
    }

    public void orderCreated() { ordersCreated.increment(); }
    public void paymentInitiated() { paymentsInitiated.increment(); }
    public void paymentConfirmed() { paymentsConfirmed.increment(); }
    public void notificationsDispatched(int count) { notificationsDispatched.increment(count); }
}

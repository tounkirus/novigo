package com.novigo.event.rabbit;

import com.novigo.api.wallet.FinanceSettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Profile;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Consommateur des événements de domaine (profils avec RabbitMQ).
 * Route les événements Nest vers les effets finance (règlement cross-backend, ADR-5/P1).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile({"dev", "preprod", "prod", "production"})
public class DomainEventListener {

    private final FinanceSettlementService settlement;

    @RabbitListener(queues = RabbitConfig.QUEUE)
    @SuppressWarnings("unchecked")
    public void onEvent(Map<String, Object> payload,
                        @Header(name = "amqp_receivedRoutingKey", required = false) String routingKey) {
        log.info("[EVENT⇐RabbitMQ:{}] {}", routingKey, payload);
        try {
            Object data = payload.get("data");
            if (data instanceof Map<?, ?> m) {
                if ("order.created".equals(routingKey)) {
                    settlement.onOrderCreated((Map<String, Object>) m);
                } else if ("delivery.completed".equals(routingKey)) {
                    settlement.onDeliveryCompleted((Map<String, Object>) m);
                } else if ("delivery.compensated".equals(routingKey)) {
                    settlement.onDeliveryCompensated((Map<String, Object>) m);
                }
            }
        } catch (Exception e) {
            log.warn("[settlement] échec {} : {}", routingKey, e.getMessage());
        }
    }
}

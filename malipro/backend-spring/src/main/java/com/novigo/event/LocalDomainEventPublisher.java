package com.novigo.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Publication locale (mode démo, sans RabbitMQ) : journalise l'événement.
 * Garantit un fonctionnement 100 % autonome sans infra de messagerie.
 */
@Slf4j
@Component
@Profile("demo")
public class LocalDomainEventPublisher implements DomainEventPublisher {

    @Override
    public void publish(String routingKey, Object payload) {
        log.info("[EVENT:{}] {}", routingKey, payload);
    }
}

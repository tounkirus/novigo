package com.novigo.event;

/**
 * Publication d'événements de domaine (paiement confirmé, commande réglée, notification diffusée).
 * Deux implémentations : locale (démo, journalisation) et RabbitMQ (dev/préprod/prod).
 */
public interface DomainEventPublisher {

    String EXCHANGE = "novigo.events";

    void publish(String routingKey, Object payload);
}

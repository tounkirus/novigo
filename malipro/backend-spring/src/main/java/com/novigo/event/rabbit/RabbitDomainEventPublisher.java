package com.novigo.event.rabbit;

import com.novigo.event.DomainEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Publication via RabbitMQ (échange topic {@code novigo.events}). */
@Slf4j
@Component
@Profile({"dev", "preprod", "prod", "production"})
@RequiredArgsConstructor
public class RabbitDomainEventPublisher implements DomainEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Override
    public void publish(String routingKey, Object payload) {
        rabbitTemplate.convertAndSend(EXCHANGE, routingKey, payload);
        log.debug("[EVENT→RabbitMQ:{}] publié", routingKey);
    }
}

package com.novigo.event.rabbit;

import com.novigo.event.DomainEventPublisher;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/** Déclare l'échange topic, la file d'événements et le binding (profils avec RabbitMQ). */
@Configuration
@Profile({"dev", "preprod", "prod", "production"})
public class RabbitConfig {

    public static final String QUEUE = "novigo.events.queue";

    @Bean
    public TopicExchange eventsExchange() {
        return ExchangeBuilder.topicExchange(DomainEventPublisher.EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue eventsQueue() {
        return QueueBuilder.durable(QUEUE).build();
    }

    @Bean
    public Binding eventsBinding(Queue eventsQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(eventsQueue).to(eventsExchange).with("#");
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(cf);
        template.setMessageConverter(converter);
        return template;
    }
}

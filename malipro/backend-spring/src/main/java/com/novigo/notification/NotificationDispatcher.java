package com.novigo.notification;

import com.novigo.common.exception.ApiException;
import com.novigo.domain.identity.User;
import com.novigo.domain.identity.UserRepository;
import com.novigo.event.DomainEventPublisher;
import com.novigo.notification.NotificationChannel.NotificationMessage;
import com.novigo.observability.AppMetrics;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Diffuse une notification sur un ou plusieurs canaux, en résolvant la cible (email/téléphone). */
@Service
public class NotificationDispatcher {

    private final Map<String, NotificationChannel> channels;
    private final UserRepository users;
    private final AppMetrics metrics;
    private final DomainEventPublisher events;

    public NotificationDispatcher(List<NotificationChannel> channelBeans, UserRepository users,
                                  AppMetrics metrics, DomainEventPublisher events) {
        this.channels = channelBeans.stream()
                .collect(Collectors.toMap(NotificationChannel::code, Function.identity()));
        this.users = users;
        this.metrics = metrics;
        this.events = events;
    }

    public List<String> availableChannels() {
        return channels.keySet().stream().sorted().toList();
    }

    /** Diffuse sur les canaux demandés (IN_APP par défaut). Renvoie les canaux effectivement notifiés. */
    public List<String> dispatch(UUID userId, List<String> requested, String title, String body,
                                 String category, String actionUrl) {
        List<String> targets = (requested == null || requested.isEmpty()) ? List.of("IN_APP") : requested;
        User user = userId == null ? null : users.findById(userId).orElse(null);
        String email = user == null ? null : user.getEmail();
        String phone = user == null ? null : user.getPhone();

        List<String> sent = new java.util.ArrayList<>();
        for (String code : targets) {
            NotificationChannel channel = channels.get(code);
            if (channel == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Canal de notification inconnu : " + code);
            }
            String target = switch (code) {
                case "EMAIL" -> email;
                case "SMS", "WHATSAPP" -> phone;
                default -> null;
            };
            channel.send(new NotificationMessage(userId, target, title, body, category, actionUrl));
            sent.add(code);
        }
        metrics.notificationsDispatched(sent.size());
        events.publish("notification.dispatched", Map.of(
                "userId", String.valueOf(userId), "channels", sent, "title", title));
        return sent;
    }
}

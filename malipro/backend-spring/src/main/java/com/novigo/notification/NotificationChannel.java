package com.novigo.notification;

import java.util.UUID;

/**
 * SPI d'un canal de notification (IN_APP, PUSH, SMS, EMAIL, WHATSAPP).
 * En démo/dev, les canaux externes journalisent ; IN_APP persiste une notification.
 */
public interface NotificationChannel {

    String code();

    void send(NotificationMessage message);

    /** Message à diffuser. {@code target} = email/téléphone/token selon le canal. */
    record NotificationMessage(UUID userId, String target, String title, String body,
                               String category, String actionUrl) {}
}

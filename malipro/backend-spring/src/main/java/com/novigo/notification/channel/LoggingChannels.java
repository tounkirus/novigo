package com.novigo.notification.channel;

import com.novigo.notification.NotificationChannel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Canaux externes (Push/SMS/Email/WhatsApp) — implémentations de démonstration qui journalisent.
 * À remplacer par de vrais fournisseurs (FCM, Twilio, SMTP, WhatsApp Business) en production.
 */
public final class LoggingChannels {

    private LoggingChannels() {}

    @Slf4j
    @Component
    public static class PushChannel implements NotificationChannel {
        @Override public String code() { return "PUSH"; }
        @Override public void send(NotificationMessage m) {
            log.info("[PUSH] → user={} : {} — {}", m.userId(), m.title(), m.body());
        }
    }

    @Slf4j
    @Component
    public static class SmsChannel implements NotificationChannel {
        @Override public String code() { return "SMS"; }
        @Override public void send(NotificationMessage m) {
            log.info("[SMS] → {} : {} {}", m.target(), m.title(), m.body());
        }
    }

    @Slf4j
    @Component
    public static class EmailChannel implements NotificationChannel {
        @Override public String code() { return "EMAIL"; }
        @Override public void send(NotificationMessage m) {
            log.info("[EMAIL] → {} : {} — {}", m.target(), m.title(), m.body());
        }
    }

    @Slf4j
    @Component
    public static class WhatsAppChannel implements NotificationChannel {
        @Override public String code() { return "WHATSAPP"; }
        @Override public void send(NotificationMessage m) {
            log.info("[WHATSAPP] → {} : {} {}", m.target(), m.title(), m.body());
        }
    }
}

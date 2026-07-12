package com.novigo.auth.otp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Envoi OTP par défaut : journalise le code (modes demo/dev/preprod).
 * Sera remplacé par un vrai provider (SMS/Email) via NotificationProvider en SP7.
 */
@Slf4j
@Component
public class LogOtpSender implements OtpSender {
    @Override
    public void send(String target, String channel, String code) {
        log.info("[OTP:{}] code envoyé à {} → {}", channel, target, code);
    }
}

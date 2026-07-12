package com.novigo.auth.otp;

/** Abstraction d'envoi d'OTP (SMS/Email). L'implémentation réelle (Twilio/SMTP/WhatsApp) arrive en SP7. */
public interface OtpSender {
    void send(String target, String channel, String code);
}

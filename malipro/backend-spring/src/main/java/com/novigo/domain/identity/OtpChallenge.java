package com.novigo.domain.identity;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Défi OTP (code à usage unique) envoyé par email ou SMS pour login/vérification. */
@Getter
@Setter
@Entity
@Table(name = "otp_challenges")
public class OtpChallenge extends BaseEntity {

    /** Destinataire : email ou numéro de téléphone. */
    @Column(nullable = false, length = 160)
    private String target;

    /** Canal : EMAIL | SMS. */
    @Column(nullable = false, length = 16)
    private String channel = "SMS";

    /** But : LOGIN | VERIFY_EMAIL | VERIFY_PHONE. */
    @Column(nullable = false, length = 24)
    private String purpose = "LOGIN";

    @Column(name = "code_hash", nullable = false, length = 120)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean consumed = false;

    @Column(nullable = false)
    private int attempts = 0;
}

package com.novigo.auth.otp;

import com.novigo.auth.Hashing;
import com.novigo.config.NovigoProperties;
import com.novigo.domain.identity.OtpChallenge;
import com.novigo.domain.identity.OtpChallengeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Génération, envoi et vérification des codes OTP. */
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository repository;
    private final OtpSender sender;
    private final NovigoProperties props;

    /** Génère un code, persiste le défi, l'envoie, et retourne le code en clair (exposé seulement hors prod). */
    @Transactional
    public String issue(String target, String channel, String purpose) {
        String code = generateCode(props.getOtp().getLength());
        OtpChallenge challenge = new OtpChallenge();
        challenge.setTarget(target);
        challenge.setChannel(channel);
        challenge.setPurpose(purpose);
        challenge.setCodeHash(Hashing.sha256(code));
        challenge.setExpiresAt(Instant.now().plus(props.getOtp().getTtlMinutes(), ChronoUnit.MINUTES));
        repository.save(challenge);
        sender.send(target, channel, code);
        return code;
    }

    /** Vérifie un code. Consomme le défi si valide. Lève IllegalArgumentException sinon. */
    @Transactional
    public void verify(String target, String purpose, String code) {
        OtpChallenge challenge = repository
                .findFirstByTargetAndPurposeAndConsumedFalseOrderByCreatedAtDesc(target, purpose)
                .orElseThrow(() -> new IllegalArgumentException("Aucun code OTP actif pour cette cible."));

        if (Instant.now().isAfter(challenge.getExpiresAt())) {
            throw new IllegalArgumentException("Code OTP expiré.");
        }
        if (challenge.getAttempts() >= props.getOtp().getMaxAttempts()) {
            throw new IllegalArgumentException("Trop de tentatives — demandez un nouveau code.");
        }
        if (!challenge.getCodeHash().equals(Hashing.sha256(code))) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            repository.save(challenge);
            throw new IllegalArgumentException("Code OTP invalide.");
        }
        challenge.setConsumed(true);
        repository.save(challenge);
    }

    private String generateCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}

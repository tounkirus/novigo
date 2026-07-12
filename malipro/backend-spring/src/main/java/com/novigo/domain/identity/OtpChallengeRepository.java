package com.novigo.domain.identity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {
    /** Dernier défi actif (non consommé) pour une cible + but donnés. */
    Optional<OtpChallenge> findFirstByTargetAndPurposeAndConsumedFalseOrderByCreatedAtDesc(
            String target, String purpose);
}

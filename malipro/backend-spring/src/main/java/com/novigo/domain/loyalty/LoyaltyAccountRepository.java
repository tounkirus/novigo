package com.novigo.domain.loyalty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LoyaltyAccountRepository extends JpaRepository<LoyaltyAccount, UUID> {
    Optional<LoyaltyAccount> findByUserId(UUID userId);
}

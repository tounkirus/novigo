package com.novigo.domain.loyalty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LoyaltyEntryRepository extends JpaRepository<LoyaltyEntry, UUID> {
    List<LoyaltyEntry> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);

    /** Anti double-crédit : une commande donnée ne rapporte des points qu'une fois. */
    boolean existsByUserIdAndLabel(UUID userId, String label);
}

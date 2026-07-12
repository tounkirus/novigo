package com.novigo.domain.cash;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CashMovementRepository extends JpaRepository<CashMovement, UUID> {
    Page<CashMovement> findBySessionId(UUID sessionId, Pageable pageable);
}

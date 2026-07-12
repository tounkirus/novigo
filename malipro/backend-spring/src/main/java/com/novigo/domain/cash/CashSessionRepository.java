package com.novigo.domain.cash;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface CashSessionRepository extends JpaRepository<CashSession, UUID>, JpaSpecificationExecutor<CashSession> {
    Page<CashSession> findByAgentId(UUID agentId, Pageable pageable);
}

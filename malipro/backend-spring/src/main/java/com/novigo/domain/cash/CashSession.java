package com.novigo.domain.cash;

import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "cash_sessions")
public class CashSession extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent;
    @Column(name = "opening_balance", nullable = false)
    private long openingBalance = 0;
    @Column(name = "closing_balance")
    private Long closingBalance;
    @Column(name = "expected_balance")
    private long expectedBalance = 0;
    @Column(name = "counted_balance")
    private Long countedBalance;
    @Column(name = "variance")
    private long variance = 0;
    @Column(nullable = false, length = 24)
    private String status = "OPEN";
    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;
    @Column(name = "closed_at")
    private Instant closedAt;
}

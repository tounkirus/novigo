package com.novigo.domain.cash;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "cash_movements")
public class CashMovement extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private CashSession session;
    @Column(nullable = false, length = 24)
    private String type = "IN";
    @Column(nullable = false)
    private long amount;
    @Column(name = "reference", length = 40)
    private String reference;
    @Column(length = 240)
    private String reason;
}

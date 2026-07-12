package com.novigo.domain.wallet;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "wallet_transactions")
public class Transaction extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;
    @Column(nullable = false, length = 24)
    private String type;
    @Column(nullable = false, length = 24)
    private String direction = "CREDIT";
    @Column(nullable = false)
    private long amount;
    @Column(name = "balance_after")
    private long balanceAfter;
    @Column(nullable = false, length = 24)
    private String status = "COMPLETED";
    @Column(name = "reference", length = 40)
    private String reference;
    @Column(length = 240)
    private String description;
    @Column(name = "provider", length = 40)
    private String provider;
}

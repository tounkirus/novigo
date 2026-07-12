package com.novigo.domain.wallet;

import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "wallets")
public class Wallet extends AuditedEntity {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", unique = true)
    private User owner;
    @Column(name = "owner_role", nullable = false, length = 24)
    private String ownerRole = "CLIENT";
    @Column(nullable = false)
    private long balance = 0;
    @Column(name = "pending_balance", nullable = false)
    private long pendingBalance = 0;
    @Column(nullable = false, length = 8)
    private String currency = "XOF";
    @Column(nullable = false)
    private boolean frozen = false;
}

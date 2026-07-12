package com.novigo.domain.payment;

import com.novigo.domain.common.AuditedEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Transaction de paiement via un fournisseur externe (Orange Money, Wave, Stripe…). */
@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment extends AuditedEntity {

    @Column(nullable = false, unique = true, length = 24)
    private String ref;

    @Column(nullable = false, length = 24)
    private String provider;

    /** RECHARGE | ORDER | BOOKING | SUBSCRIPTION. */
    @Column(nullable = false, length = 24)
    private String purpose = "RECHARGE";

    @Column(nullable = false)
    private long amount;

    @Column(nullable = false, length = 8)
    private String currency = "XOF";

    /** PENDING | PAID | FAILED | CANCELLED. */
    @Column(nullable = false, length = 24)
    private String status = "PENDING";

    @Column(name = "payer_id")
    private UUID payerId;

    /** Wallet crédité en cas de recharge. */
    @Column(name = "wallet_id")
    private UUID walletId;

    @Column(name = "target_type", length = 24)
    private String targetType;

    @Column(name = "target_id")
    private UUID targetId;

    @Column(name = "external_ref", length = 80)
    private String externalRef;

    /** Commission plateforme retenue (calculée à la confirmation). */
    @Column(nullable = false)
    private long commission = 0;

    @Column(name = "failure_reason", length = 240)
    private String failureReason;
}

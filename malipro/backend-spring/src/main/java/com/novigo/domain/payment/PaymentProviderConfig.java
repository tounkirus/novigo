package com.novigo.domain.payment;

import com.novigo.domain.common.AuditedEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Configuration d'un fournisseur de paiement — activable/désactivable au runtime. */
@Getter
@Setter
@Entity
@Table(name = "payment_providers")
public class PaymentProviderConfig extends AuditedEntity {

    @Column(nullable = false, unique = true, length = 24)
    private String code;

    @Column(nullable = false, length = 80)
    private String label;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    /** Frais fournisseur en points de base (ex: 150 = 1,5 %) — informatif. */
    @Column(name = "fee_bps", nullable = false)
    private int feeBps = 0;
}

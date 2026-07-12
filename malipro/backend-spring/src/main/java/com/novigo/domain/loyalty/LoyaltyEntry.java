package com.novigo.domain.loyalty;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Écriture au registre de fidélité : variation de points (+gain / -échange) horodatée. */
@Getter
@Setter
@Entity
@Table(name = "loyalty_ledger")
public class LoyaltyEntry extends BaseEntity {
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;
    @Column(nullable = false)
    private int delta;
    @Column(nullable = false, length = 160)
    private String label;
}

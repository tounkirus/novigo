package com.novigo.domain.loyalty;

import com.novigo.domain.common.AuditedEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Compte de fidélité d'un utilisateur (schéma finance). Solde de points + palier. */
@Getter
@Setter
@Entity
@Table(name = "loyalty_accounts")
public class LoyaltyAccount extends AuditedEntity {
    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "uuid")
    private UUID userId;
    @Column(nullable = false)
    private int points = 0;
    @Column(nullable = false, length = 16)
    private String tier = "BRONZE";
}

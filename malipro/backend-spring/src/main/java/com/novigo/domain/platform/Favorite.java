package com.novigo.domain.platform;

import com.novigo.domain.common.BaseEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Favori d'un utilisateur sur une cible (boutique, produit, prestataire). */
@Getter
@Setter
@Entity
@Table(name = "favorites", uniqueConstraints = @UniqueConstraint(
        name = "uk_favorite_user_target", columnNames = {"user_id", "target_type", "target_id"}))
public class Favorite extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "target_type", nullable = false, length = 24)
    private String targetType = "STORE";

    @Column(name = "target_id", nullable = false)
    private UUID targetId;
}

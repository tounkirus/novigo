package com.novigo.domain.catalog;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Détails restaurant rattachés à un Store (1:1). */
@Getter
@Setter
@Entity
@Table(name = "restaurants")
public class Restaurant extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false, unique = true)
    private Store store;
    @Column(length = 120)
    private String cuisine;
    @Column(nullable = false)
    private boolean halal = true;
    @Column(name = "avg_price")
    private long avgPrice;
}

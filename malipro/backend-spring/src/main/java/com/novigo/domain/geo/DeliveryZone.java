package com.novigo.domain.geo;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "delivery_zones")
public class DeliveryZone extends BaseEntity {
    @Column(nullable = false, length = 120)
    private String name;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;
    @Column(nullable = false)
    private boolean active = true;
    @Column(name = "base_fee", nullable = false)
    private long baseFee = 0;
}

package com.novigo.domain.catalog;

import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.geo.City;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "stores")
public class Store extends AuditedEntity {
    @Column(nullable = false, unique = true, length = 160)
    private String slug;
    @Column(nullable = false, length = 160)
    private String name;
    @Column(nullable = false, length = 40)
    private String category;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;
    @Column(length = 120)
    private String district;
    @Column(length = 240)
    private String address;
    @Column(length = 32)
    private String phone;
    private Double lat;
    private Double lng;
    @Column(precision = 3, scale = 2)
    private BigDecimal rating;
    @Column(name = "review_count")
    private int reviewCount;
    @Column(name = "is_open", nullable = false)
    private boolean open = true;
    @Column(name = "delivery_fee")
    private long deliveryFee;
    @Column(name = "delivery_time_min")
    private int deliveryTimeMin;
    @Column(name = "cover_url", length = 400)
    private String coverUrl;
    @Column(name = "logo_url", length = 400)
    private String logoUrl;
    @Column(nullable = false, length = 24)
    private String status = "APPROVED";
}

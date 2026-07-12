package com.novigo.domain.commerce;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "coupons")
public class Coupon extends BaseEntity {
    @Column(nullable = false, unique = true, length = 40)
    private String code;
    @Column(length = 120)
    private String label;
    @Column(name = "discount_percent")
    private int discountPercent;
    @Column(name = "min_amount")
    private long minAmount;
    @Column(nullable = false)
    private boolean active = true;
    @Column(name = "expires_at")
    private Instant expiresAt;
}

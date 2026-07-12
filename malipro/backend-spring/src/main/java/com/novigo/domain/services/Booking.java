package com.novigo.domain.services;

import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "bookings")
public class Booking extends AuditedEntity {
    @Column(nullable = false, unique = true, length = 24)
    private String ref;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id")
    private Provider provider;
    @Column(length = 160)
    private String serviceLabel;
    @Column(nullable = false, length = 24)
    private String status = "PENDING";
    @Column(name = "scheduled_at")
    private Instant scheduledAt;
    @Column(length = 240)
    private String address;
    @Column(length = 120)
    private String district;
    @Column(name = "quoted_price")
    private long quotedPrice;
    @Column(name = "final_price")
    private Long finalPrice;
    @Column(name = "payment_status", length = 24)
    private String paymentStatus = "PENDING";
    @Column(length = 2000)
    private String notes;
}

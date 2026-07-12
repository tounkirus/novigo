package com.novigo.domain.logistics;

import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "drivers")
public class Driver extends AuditedEntity {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
    @Column(nullable = false, length = 24)
    private String status = "OFFLINE";
    @Column(name = "kyc_status", nullable = false, length = 24)
    private String kycStatus = "PENDING";
    @Column(name = "current_lat")
    private Double currentLat;
    @Column(name = "current_lng")
    private Double currentLng;
    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;
    @Column(name = "total_deliveries")
    private int totalDeliveries;
    @Column(nullable = false)
    private boolean available = false;
}

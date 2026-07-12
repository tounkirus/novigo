package com.novigo.domain.services;

import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "providers")
public class Provider extends AuditedEntity {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;
    @Column(nullable = false, length = 160)
    private String displayName;
    @Column(length = 80)
    private String profession;
    @Column(length = 60)
    private String vertical;
    @Column(length = 2000)
    private String bio;
    @Column(length = 120)
    private String city;
    @Column(length = 120)
    private String district;
    @Column(name = "hourly_rate")
    private long hourlyRate;
    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;
    @Column(name = "review_count")
    private int reviewCount;
    @Column(name = "kyc_status", nullable = false, length = 24)
    private String kycStatus = "PENDING";
    @Column(nullable = false, length = 24)
    private String status = "APPROVED";
    @Column(nullable = false)
    private boolean available = true;
    @Column(name = "avatar_url", length = 400)
    private String avatarUrl;
    @Column(name = "cover_url", length = 400)
    private String coverUrl;
}

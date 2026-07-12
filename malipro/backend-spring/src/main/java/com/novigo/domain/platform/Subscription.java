package com.novigo.domain.platform;

import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "subscriptions")
public class Subscription extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscriber_id")
    private User subscriber;
    @Column(nullable = false, length = 40)
    private String plan = "FREE";
    @Column(name = "subscriber_role", length = 24)
    private String subscriberRole;
    @Column(nullable = false, length = 24)
    private String status = "ACTIVE";
    @Column(name = "price_per_month")
    private long pricePerMonth;
    @Column(name = "started_at")
    private Instant startedAt;
    @Column(name = "renews_at")
    private Instant renewsAt;
    @Column(name = "auto_renew", nullable = false)
    private boolean autoRenew = true;
}

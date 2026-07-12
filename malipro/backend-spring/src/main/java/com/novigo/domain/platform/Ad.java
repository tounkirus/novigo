package com.novigo.domain.platform;

import com.novigo.domain.common.AuditedEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "ads")
public class Ad extends AuditedEntity {
    @Column(nullable = false, length = 160)
    private String title;
    @Column(length = 400)
    private String subtitle;
    @Column(name = "image_url", length = 400)
    private String imageUrl;
    @Column(name = "target_url", length = 400)
    private String targetUrl;
    @Column(length = 40)
    private String placement = "HOME_BANNER";
    @Column(nullable = false)
    private boolean active = true;
    @Column(name = "starts_at")
    private Instant startsAt;
    @Column(name = "ends_at")
    private Instant endsAt;
    @Column(name = "sort_order")
    private int sortOrder;
}

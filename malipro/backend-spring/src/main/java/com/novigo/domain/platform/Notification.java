package com.novigo.domain.platform;

import com.novigo.domain.common.BaseEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @Column(nullable = false, length = 24)
    private String channel = "IN_APP";
    @Column(nullable = false, length = 160)
    private String title;
    @Column(length = 1000)
    private String body;
    @Column(length = 40)
    private String category;
    @Column(name = "is_read", nullable = false)
    private boolean read = false;
    @Column(name = "action_url", length = 400)
    private String actionUrl;
}

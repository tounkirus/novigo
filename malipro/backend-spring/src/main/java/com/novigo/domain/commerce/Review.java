package com.novigo.domain.commerce;

import com.novigo.domain.common.BaseEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "reviews")
public class Review extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;
    @Column(name = "target_type", nullable = false, length = 24)
    private String targetType = "STORE";
    @Column(name = "target_id")
    private java.util.UUID targetId;
    @Column(nullable = false)
    private int rating;
    @Column(length = 1000)
    private String comment;
}

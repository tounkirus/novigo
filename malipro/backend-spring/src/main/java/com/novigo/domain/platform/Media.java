package com.novigo.domain.platform;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "media")
public class Media extends BaseEntity {
    @Column(nullable = false, length = 400)
    private String url;
    @Column(nullable = false, length = 24)
    private String provider = "LOCAL";
    @Column(name = "content_type", length = 80)
    private String contentType;
    @Column(name = "file_size")
    private long fileSize;
    @Column(name = "owner_type", length = 40)
    private String ownerType;
    @Column(name = "owner_id")
    private java.util.UUID ownerId;
    @Column(length = 160)
    private String label;
}

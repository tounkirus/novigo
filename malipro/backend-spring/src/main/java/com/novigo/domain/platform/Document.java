package com.novigo.domain.platform;

import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.identity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "documents")
public class Document extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;
    @Column(nullable = false, length = 40)
    private String type = "ID_CARD";
    @Column(name = "file_url", nullable = false, length = 400)
    private String fileUrl;
    @Column(nullable = false, length = 24)
    private String status = "PENDING";
    @Column(name = "rejection_reason", length = 240)
    private String rejectionReason;
}

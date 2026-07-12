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
@Table(name = "kyc_records")
public class Kyc extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private User subject;
    @Column(name = "subject_role", nullable = false, length = 24)
    private String subjectRole = "DRIVER";
    @Column(nullable = false, length = 24)
    private String status = "PENDING";
    @Column(name = "reviewed_by")
    private java.util.UUID reviewedBy;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
    @Column(name = "rejection_reason", length = 240)
    private String rejectionReason;
}

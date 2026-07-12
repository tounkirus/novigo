package com.novigo.domain.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/** Base auditée : ajoute la date de mise à jour. */
@Getter
@Setter
@MappedSuperclass
public abstract class AuditedEntity extends BaseEntity {

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

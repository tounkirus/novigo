package com.novigo.domain.platform;

import com.novigo.domain.common.AuditedEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "settings")
public class Setting extends AuditedEntity {
    @Column(name = "setting_key", nullable = false, unique = true, length = 120)
    private String key;
    @Column(name = "setting_value", length = 2000)
    private String value;
    @Column(length = 40)
    private String category = "GENERAL";
    @Column(length = 240)
    private String description;
}

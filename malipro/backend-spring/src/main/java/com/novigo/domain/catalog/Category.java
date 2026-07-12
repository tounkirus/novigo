package com.novigo.domain.catalog;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "categories")
public class Category extends BaseEntity {
    @Column(nullable = false, unique = true, length = 60)
    private String code;
    @Column(nullable = false, length = 80)
    private String label;
    @Column(length = 60)
    private String icon;
    @Column(length = 40)
    private String vertical;
}

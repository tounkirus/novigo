package com.novigo.domain.geo;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "countries")
public class Country extends BaseEntity {
    @Column(nullable = false, unique = true, length = 2)
    private String code;
    @Column(nullable = false, length = 80)
    private String name;
    @Column(name = "dial_code", length = 8)
    private String dialCode;
    @Column(length = 8)
    private String currency;
}

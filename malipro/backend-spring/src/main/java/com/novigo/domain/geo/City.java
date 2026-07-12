package com.novigo.domain.geo;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "cities")
public class City extends BaseEntity {
    @Column(nullable = false, length = 120)
    private String name;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id")
    private Country country;
    private Double lat;
    private Double lng;
}

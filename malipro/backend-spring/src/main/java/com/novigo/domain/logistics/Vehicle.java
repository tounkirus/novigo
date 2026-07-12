package com.novigo.domain.logistics;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "vehicles")
public class Vehicle extends BaseEntity {
    @Column(nullable = false, length = 24)
    private String type = "MOTO";
    @Column(length = 40)
    private String plate;
    @Column(length = 80)
    private String model;
    @Column(length = 40)
    private String color;
}

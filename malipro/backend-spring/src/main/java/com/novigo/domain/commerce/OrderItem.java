package com.novigo.domain.commerce;

import com.novigo.domain.catalog.Product;
import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "order_items")
public class OrderItem extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;
    @Column(nullable = false, length = 160)
    private String name;
    @Column(name = "unit_price", nullable = false)
    private long unitPrice;
    @Column(nullable = false)
    private int quantity = 1;
    @Column(name = "options_label", length = 240)
    private String optionsLabel;
}

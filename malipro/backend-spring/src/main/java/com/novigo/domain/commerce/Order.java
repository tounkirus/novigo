package com.novigo.domain.commerce;

import com.novigo.domain.catalog.Store;
import com.novigo.domain.common.AuditedEntity;
import com.novigo.domain.identity.User;
import com.novigo.domain.logistics.Driver;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "orders")
public class Order extends AuditedEntity {
    @Column(nullable = false, unique = true, length = 24)
    private String ref;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;
    @Column(nullable = false, length = 24)
    private String status = "PENDING";
    private long subtotal;
    @Column(name = "delivery_fee")
    private long deliveryFee;
    private long total;
    @Column(name = "payment_method", length = 24)
    private String paymentMethod;
    @Column(name = "payment_status", length = 24)
    private String paymentStatus = "PENDING";
    @Column(length = 240)
    private String address;
    @Column(length = 120)
    private String district;
    @Column(name = "placed_at")
    private Instant placedAt;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}

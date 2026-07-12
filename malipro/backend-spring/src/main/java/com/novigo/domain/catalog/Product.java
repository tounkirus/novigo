package com.novigo.domain.catalog;

import com.novigo.domain.common.AuditedEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "products")
public class Product extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    @Column(nullable = false, length = 160)
    private String name;
    @Column(length = 2000)
    private String description;
    @Column(nullable = false)
    private long price;
    @Column(name = "old_price")
    private Long oldPrice;
    @Column(name = "image_url", length = 400)
    private String imageUrl;
    @Column(nullable = false)
    private boolean available = true;
    @Column(name = "is_best_seller", nullable = false)
    private boolean bestSeller = false;
    @Column(name = "is_new", nullable = false)
    private boolean isNew = false;
    private int stock;
    @Column(name = "menu_section", length = 80)
    private String menuSection;
}

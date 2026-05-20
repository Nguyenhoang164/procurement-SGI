package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data // Tự động tạo getter, setter, toString...
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pos_code", nullable = false, length = 150, unique = true)
    private String posCode;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "market_code", length = 10)
    private String marketCode;

    @Column(length = 255)
    private String spec;

    @Column(length = 50)
    private String unit;

    @Column(length = 50)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}

package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_combos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCombo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "combo_code", length = 80)
    private String comboCode;

    @Column(name = "combo_name", nullable = false, length = 255)
    private String comboName;

    @Column(name = "base_qty", precision = 12, scale = 3, nullable = false)
    private BigDecimal baseQty = BigDecimal.ONE;

    @Column(name = "sale_unit", length = 50)
    private String saleUnit;

    @Column(name = "sale_price_vnd", precision = 15, scale = 0)
    private BigDecimal salePriceVnd = BigDecimal.ZERO;

    @Column(length = 500)
    private String note;

    @Column(length = 50)
    private String status = "ACTIVE";

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

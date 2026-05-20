package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "purchase_orders")
@Data // Tự động tạo getter, setter, toString...
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String posCode;

    @Column(nullable = false)
    private Integer orderedQty;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(length = 10)
    private String currency = "USD";

    @Column(precision = 8, scale = 4)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    // Chi phí vận chuyển
    @Column(precision = 15, scale = 0)
    private BigDecimal domesticShippingVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal intlShippingVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal orderFeeVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal localDeliveryFeeVnd = BigDecimal.ZERO;

    // Tính toán tự động
    @Column(precision = 15, scale = 0)
    private BigDecimal totalLotCostVnd = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal recentUnitPrice = BigDecimal.ZERO;

    @Column(length = 255)
    private String spec;

    @Column(length = 100)
    private String country;

    @Column(length = 50)
    private String shippingMethod;

    @Column(length = 1000)
    private String note;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitCostFullVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal depositVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal remainingPaymentVnd = BigDecimal.ZERO;

    @Column(nullable = false, length = 50)
    private String status = "DRAFT";  // DRAFT, PENDING, APPROVED, IN_TRANSIT, COMPLETED

    @Column(name = "created_by")
    private String createdBy;

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

package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "po_code", length = 50)
    private String poCode;

    @Column(name = "source_plan_id")
    private Long sourcePlanId;

    @Column(length = 50)
    private String posCode;

    @Column(length = 255)
    private String productName;

    @Column(length = 100)
    private String productShortCode;

    @Column(name = "product_type", length = 20)
    private String productType;

    @Column(length = 255)
    private String supplierName;

    private Integer orderedQty;

    @Column(precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(length = 10)
    private String currency = "USD";

    @Column(precision = 12, scale = 4)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(precision = 15, scale = 0)
    private BigDecimal domesticShippingVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal intlShippingVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal internationalShippingUnitPriceVnd = BigDecimal.ZERO;

    @Column(length = 100)
    private String packageMeasurement;

    @Column(precision = 15, scale = 0)
    private BigDecimal orderFeeVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal localDeliveryFeeVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal totalLotCostVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal totalGoodsCostVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalGoodsAmount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal recentUnitPrice = BigDecimal.ZERO;

    @Column(length = 200)
    private String landing;

    @Column(length = 255)
    private String spec;

    @Column(length = 100)
    private String country;

    @Column(length = 50)
    private String shippingMethod;

    @Column(name = "order_date")
    private LocalDate orderDate;

    @Column(name = "expected_warehouse_arrival_date")
    private LocalDate expectedWarehouseArrivalDate;

    @Column(name = "goods_payment_date")
    private LocalDate goodsPaymentDate;

    @Column(name = "freight_payment_date")
    private LocalDate freightPaymentDate;

    @Column(length = 100)
    private String paymentMethod;

    @Column(length = 1000)
    private String note;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitCostFullVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal depositVnd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 0)
    private BigDecimal remainingPaymentVnd = BigDecimal.ZERO;

    @Column(name = "rejected_by", length = 100)
    private String rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Column(nullable = false, length = 50)
    private String status = "DRAFT";

    @Column(name = "payment_status", length = 50)
    private String paymentStatus;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PurchaseOrderItem> items = new ArrayList<>();

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



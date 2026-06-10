package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Column(name = "pos_code", nullable = false, length = 50)
    private String posCode;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "product_short_code", length = 100)
    private String productShortCode;

    @Column(name = "product_type", length = 20)
    private String productType;

    @Column(name = "ordered_qty", nullable = false)
    private Integer orderedQty;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(length = 10)
    private String currency = "USD";

    @Column(name = "exchange_rate", precision = 12, scale = 4)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(name = "total_amount_foreign", precision = 15, scale = 2)
    private BigDecimal totalAmountForeign = BigDecimal.ZERO;

    @Column(name = "total_amount_vnd", precision = 15, scale = 0)
    private BigDecimal totalAmountVnd = BigDecimal.ZERO;

    @Column(length = 255)
    private String spec;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "source_link", length = 500)
    private String sourceLink;

    @Column(length = 100)
    private String department;

    @Transient
    private BigDecimal weightedAvgCostVnd;

    @Transient
    private BigDecimal latestUnitCostVnd;

    @Transient
    private String latestOrderCode;

    @Transient
    private LocalDateTime latestCostDate;

}



package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "cost_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CostAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pos_code", nullable = false, length = 150)
    private String posCode;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "expected_cost_vnd", precision = 15, scale = 0)
    private BigDecimal expectedCostVnd;

    @Column(name = "actual_cost_vnd", precision = 15, scale = 0)
    private BigDecimal actualCostVnd;

    @Column(name = "variance_amount_vnd", precision = 15, scale = 0)
    private BigDecimal varianceAmountVnd;

    @Column(name = "variance_percentage", precision = 7, scale = 2)
    private BigDecimal variancePercentage;

    @Column(name = "alert_type", length = 50)
    private String alertType; // HIGH_VARIANCE or LOW_VARIANCE

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
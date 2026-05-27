package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "cost_comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CostComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "po_id", nullable = false)
    private Long poId;

    @Column(name = "expected_cost_vnd", precision = 15, scale = 0)
    private java.math.BigDecimal expectedCostVnd;

    @Column(name = "actual_cost_vnd", precision = 15, scale = 0)
    private java.math.BigDecimal actualCostVnd;

    @Column(name = "variance_amount_vnd", precision = 15, scale = 0)
    private java.math.BigDecimal varianceAmountVnd;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String type;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

}

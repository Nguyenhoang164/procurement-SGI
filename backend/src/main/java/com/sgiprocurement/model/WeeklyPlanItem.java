package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "weekly_plan_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private WeeklyPlan plan;

    @Column(name = "pos_code", length = 50)
    private String posCode;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "product_type", length = 20)
    private String productType;

    @Column(nullable = false)
    private Integer suggestedQty;

    @Column(length = 100)
    private String country;

    @Column(name = "trade_route", length = 100)
    private String tradeRoute;

    @Column(name = "shipping_method", length = 50)
    private String shippingMethod;

    @Column(name = "reference_price", precision = 15, scale = 2)
    private BigDecimal referencePrice;

    @Column(length = 10)
    private String currency = "CNY";

    @Column(columnDefinition = "TEXT")
    private String spec;

    @Column(name = "source_link", length = 500)
    private String sourceLink;

    @Column(name = "priority_level", length = 20)
    private String priorityLevel;

    @Column(length = 200)
    private String landing;

    @Column(length = 100)
    private String department;
}

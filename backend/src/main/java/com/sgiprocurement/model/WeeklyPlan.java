package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "weekly_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime proposedDate;

    @Column(length = 50)
    private String posCode;

    private Integer suggestedQty;

    @Column(length = 500)
    private String spec;

    @Column(length = 50)
    private String country;

    @Column(length = 50)
    private String shippingMethod;

    @Column(precision = 10, scale = 2)
    private BigDecimal recentUnitPrice;

    @Column(length = 500)
    private String note;

    @Column(nullable = false, length = 50)
    private String status = "DRAFT";

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WeeklyPlanItem> items = new ArrayList<>();

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

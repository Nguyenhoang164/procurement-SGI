package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "payment_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "po_id", nullable = false)
    private Long poId;

    @Column(nullable = false, length = 50)
    private String type;  // DEPOSIT, BALANCE, FULL_PAYMENT

    @Column(precision = 15, scale = 0)
    private BigDecimal amountVnd = BigDecimal.ZERO;

    @Column(length = 10)
    private String currency = "VND";

    @Column(nullable = false, length = 50)
    private String status = "DRAFT";  // DRAFT, PENDING, APPROVED, REJECTED, PAID

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

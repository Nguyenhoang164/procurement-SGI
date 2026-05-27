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

    @Column(length = 50)
    private String type;

    @Column(precision = 15, scale = 0)
    private BigDecimal amountVnd = BigDecimal.ZERO;

    @Column(length = 10)
    private String currency = "VND";

    @Column(nullable = false, length = 50)
    private String status = "DRAFT";

    @Column(length = 2000)
    private String attachments;

    @Column(length = 500)
    private String note;

    @Column(length = 500)
    private String reason;

    @Column(name = "exchange_rate_diff_vnd", precision = 15, scale = 0)
    private BigDecimal exchangeRateDiffVnd = BigDecimal.ZERO;

    @Column(name = "additional_shipping_vnd", precision = 15, scale = 0)
    private BigDecimal additionalShippingVnd = BigDecimal.ZERO;

    @Column(name = "total_amount_vnd", precision = 15, scale = 0)
    private BigDecimal totalAmountVnd = BigDecimal.ZERO;

    @Column(name = "payment_confirmed_at")
    private LocalDateTime paymentConfirmedAt;

    @Column(name = "payment_confirmed_by", length = 100)
    private String paymentConfirmedBy;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "rejected_by", length = 100)
    private String rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Column(name = "rejected_level", length = 10)
    private String rejectedLevel;

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

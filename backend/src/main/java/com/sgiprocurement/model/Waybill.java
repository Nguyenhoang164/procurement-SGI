package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "waybills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Waybill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "waybill_code", nullable = false, length = 100)
    private String waybillCode;

    @Column(name = "carrier", length = 100)
    private String carrier;

    @Column(name = "origin", length = 100)
    private String origin;

    @Column(name = "destination", length = 100)
    private String destination;

    @Column(name = "expected_qty")
    private Integer expectedQty;

    @Column(name = "actual_qty")
    private Integer actualQty;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "payment_request_id")
    private Long paymentRequestId;

    @Column(name = "products", columnDefinition = "TEXT")
    private String products;

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

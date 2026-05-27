package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "warehouse_receipts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "po_id", nullable = false)
    private Long poId;

    @Column(nullable = false)
    private Integer receivedQty;

    @Column(nullable = false)
    private LocalDateTime receivedDate;

    @Column(length = 100)
    private String inspector;

    @Column(name = "condition_description", length = 500)
    private String condition;

    @Column(name = "waybill_id")
    private Long waybillId;

    @Column(name = "waybill_code", length = 100)
    private String waybillCode;

    @Column(name = "expected_qty")
    private Integer expectedQty;

    @Column(name = "goods_condition", length = 50)
    private String goodsCondition;

    @Column(length = 500)
    private String attachments;

    @Column(nullable = false, length = 50)
    private String status = "RECEIVED";  // RECEIVED, VERIFIED, REJECTED

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

package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "warehouse_receipt_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseReceiptItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_id", nullable = false)
    private Long receiptId;

    @Column(name = "po_item_id", nullable = false)
    private Long poItemId;

    @Column(name = "received_qty", nullable = false)
    private Integer receivedQty;

    @Column(name = "goods_condition", length = 50)
    private String goodsCondition;

    @Column(name = "condition_description", length = 500)
    private String conditionDescription;

    @Column(columnDefinition = "TEXT")
    private String images;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

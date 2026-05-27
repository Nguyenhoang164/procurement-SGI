package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "payment_request_purchase_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestPurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_request_id", nullable = false)
    private Long paymentRequestId;

    @Column(name = "po_id", nullable = false)
    private Long poId;

    @Column(name = "allocated_amount_vnd", precision = 15, scale = 0)
    private BigDecimal allocatedAmountVnd = BigDecimal.ZERO;

}

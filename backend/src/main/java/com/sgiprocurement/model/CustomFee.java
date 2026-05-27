package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "custom_fees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomFee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_request_id", nullable = false)
    private Long paymentRequestId;

    @Column(name = "fee_name", nullable = false, length = 200)
    private String feeName;

    @Column(name = "fee_amount", nullable = false, precision = 15, scale = 0)
    private BigDecimal feeAmount = BigDecimal.ZERO;

}

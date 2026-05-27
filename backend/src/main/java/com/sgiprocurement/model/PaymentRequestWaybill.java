package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "payment_request_waybills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestWaybill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_request_id", nullable = false)
    private Long paymentRequestId;

    @Column(name = "waybill_id", nullable = false)
    private Long waybillId;

}

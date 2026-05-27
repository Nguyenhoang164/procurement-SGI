package com.sgiprocurement.repository;

import com.sgiprocurement.model.PaymentRequestPurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRequestPurchaseOrderRepository extends JpaRepository<PaymentRequestPurchaseOrder, Long> {

    List<PaymentRequestPurchaseOrder> findByPaymentRequestId(Long paymentRequestId);

    List<PaymentRequestPurchaseOrder> findByPoId(Long poId);

    void deleteByPaymentRequestId(Long paymentRequestId);

}

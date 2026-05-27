package com.sgiprocurement.repository;

import com.sgiprocurement.model.PaymentRequestWaybill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRequestWaybillRepository extends JpaRepository<PaymentRequestWaybill, Long> {

    List<PaymentRequestWaybill> findByPaymentRequestId(Long paymentRequestId);

    void deleteByPaymentRequestId(Long paymentRequestId);

}

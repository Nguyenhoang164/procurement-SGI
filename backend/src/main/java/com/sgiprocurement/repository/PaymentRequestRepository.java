package com.sgiprocurement.repository;

import com.sgiprocurement.model.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {

    List<PaymentRequest> findByPoId(Long poId);

    List<PaymentRequest> findByStatus(String status);

}

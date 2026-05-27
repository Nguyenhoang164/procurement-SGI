package com.sgiprocurement.repository;

import com.sgiprocurement.model.CustomFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomFeeRepository extends JpaRepository<CustomFee, Long> {

    List<CustomFee> findByPaymentRequestId(Long paymentRequestId);

    void deleteByPaymentRequestId(Long paymentRequestId);

}

package com.sgiprocurement.repository;

import com.sgiprocurement.model.Waybill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface WaybillRepository extends JpaRepository<Waybill, Long> {

    Optional<Waybill> findByWaybillCode(String waybillCode);

    List<Waybill> findByPaymentRequestId(Long paymentRequestId);

    List<Waybill> findByStatus(String status);

}

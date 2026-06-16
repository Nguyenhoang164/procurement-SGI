package com.sgiprocurement.repository;

import com.sgiprocurement.model.Waybill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface WaybillRepository extends JpaRepository<Waybill, Long> {

    Optional<Waybill> findByWaybillCode(String waybillCode);

    List<Waybill> findByPaymentRequestId(Long paymentRequestId);

    List<Waybill> findByStatus(String status);

    long countByStatusNot(String status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT w FROM Waybill w WHERE w.waybillCode LIKE %:keyword% OR w.carrier LIKE %:keyword% OR w.note LIKE %:keyword% OR w.products LIKE %:keyword%")
    List<Waybill> searchByKeyword(@Param("keyword") String keyword);

}

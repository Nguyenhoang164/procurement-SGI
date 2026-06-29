package com.sgiprocurement.repository;

import com.sgiprocurement.model.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {

    List<PaymentRequest> findByPoId(Long poId);

    List<PaymentRequest> findByStatus(String status);

    List<PaymentRequest> findByStatusIn(List<String> statuses);

    @Query("SELECT pr FROM PaymentRequest pr WHERE CAST(pr.id AS string) LIKE %:keyword% OR pr.note LIKE %:keyword%")
    List<PaymentRequest> searchByKeyword(@Param("keyword") String keyword);

    long countByStatus(String status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(pr.totalAmountVnd), 0) FROM PaymentRequest pr")
    BigDecimal sumTotalAmountVnd();

    @Query("SELECT COALESCE(SUM(pr.totalAmountVnd), 0) FROM PaymentRequest pr WHERE pr.createdAt BETWEEN :start AND :end")
    BigDecimal sumTotalAmountVndBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

}

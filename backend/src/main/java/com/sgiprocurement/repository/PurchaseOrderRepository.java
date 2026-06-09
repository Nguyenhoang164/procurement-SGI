package com.sgiprocurement.repository;

import com.sgiprocurement.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findByStatus(String status);

    List<PurchaseOrder> findByPosCode(String posCode);

    List<PurchaseOrder> findByPaymentStatus(String paymentStatus);

    long countByStatus(String status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(po.totalGoodsCostVnd), 0) FROM PurchaseOrder po")
    BigDecimal sumTotalGoodsCostVnd();

    @Query("SELECT COALESCE(SUM(po.totalGoodsCostVnd), 0) FROM PurchaseOrder po WHERE po.createdAt BETWEEN :start AND :end")
    BigDecimal sumTotalGoodsCostVndBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<PurchaseOrder> findTop5ByOrderByCreatedAtDesc();

    Optional<PurchaseOrder> findByPoCode(String poCode);

}

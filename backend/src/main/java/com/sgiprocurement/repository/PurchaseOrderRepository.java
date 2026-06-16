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

    List<PurchaseOrder> findByInitiatorDepartment(String initiatorDepartment);

    @Query("SELECT DISTINCT po FROM PurchaseOrder po LEFT JOIN FETCH po.items WHERE po.initiatorDepartment = :dept")
    List<PurchaseOrder> findByInitiatorDepartmentWithItems(@Param("dept") String dept);

    @Query("SELECT DISTINCT po FROM PurchaseOrder po LEFT JOIN FETCH po.items")
    List<PurchaseOrder> findAllWithItems();

    @Query("SELECT DISTINCT po.initiatorDepartment FROM PurchaseOrder po WHERE po.initiatorDepartment IS NOT NULL AND po.initiatorDepartment <> '' ORDER BY po.initiatorDepartment")
    List<String> findDistinctDepartments();

    @Query("SELECT DISTINCT po FROM PurchaseOrder po LEFT JOIN FETCH po.items WHERE (po.poCode LIKE %:keyword% OR po.posCode LIKE %:keyword%)")
    List<PurchaseOrder> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT DISTINCT po FROM PurchaseOrder po LEFT JOIN FETCH po.items WHERE (po.poCode LIKE %:keyword% OR po.posCode LIKE %:keyword%) AND po.initiatorDepartment = :dept")
    List<PurchaseOrder> searchByKeywordAndDepartment(@Param("keyword") String keyword, @Param("dept") String dept);

    @Query("SELECT MAX(po.poCode) FROM PurchaseOrder po WHERE po.poCode LIKE :prefix ORDER BY po.poCode DESC")
    Optional<String> findMaxPoCodeByPrefix(@Param("prefix") String prefix);
}

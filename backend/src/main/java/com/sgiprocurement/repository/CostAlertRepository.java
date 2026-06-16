package com.sgiprocurement.repository;

import com.sgiprocurement.model.CostAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CostAlertRepository extends JpaRepository<CostAlert, Long> {
    List<CostAlert> findByPosCode(String posCode);
    List<CostAlert> findByAlertType(String alertType);

    @Modifying
    @Query("DELETE FROM CostAlert c WHERE c.expectedCostVnd < :minOldCost OR ABS(c.varianceAmountVnd) < :minVariance")
    int deleteInvalidAlerts(BigDecimal minOldCost, BigDecimal minVariance);
}
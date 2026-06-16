package com.sgiprocurement.repository;

import com.sgiprocurement.model.CostAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CostAlertRepository extends JpaRepository<CostAlert, Long> {
    List<CostAlert> findByPosCode(String posCode);
    List<CostAlert> findByAlertType(String alertType);
}
package com.sgiprocurement.repository;

import com.sgiprocurement.model.WeeklyPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WeeklyPlanItemRepository extends JpaRepository<WeeklyPlanItem, Long> {

    List<WeeklyPlanItem> findByPlanId(Long planId);

    void deleteByPlanId(Long planId);

}

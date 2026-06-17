package com.sgiprocurement.repository;

import com.sgiprocurement.model.WeeklyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WeeklyPlanRepository extends JpaRepository<WeeklyPlan, Long> {

    List<WeeklyPlan> findByStatus(String status);

    List<WeeklyPlan> findByStatusIn(List<String> statuses);

    List<WeeklyPlan> findByPosCode(String posCode);

    long countByStatus(String status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT wp FROM WeeklyPlan wp WHERE wp.posCode LIKE %:keyword% OR wp.note LIKE %:keyword%")
    List<WeeklyPlan> searchByKeyword(@Param("keyword") String keyword);

}

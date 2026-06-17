package com.sgiprocurement.controller;

import com.sgiprocurement.dto.WeeklyPlanDTO;
import com.sgiprocurement.service.WeeklyPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/v1/weekly-plans")
@CrossOrigin(origins = "http://localhost:3000")
public class WeeklyPlanController {

    @Autowired
    private WeeklyPlanService weeklyPlanService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<WeeklyPlanDTO>> getAllWeeklyPlans(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WeeklyPlanDTO> plans = weeklyPlanService.getAllWeeklyPlans(startDate, endDate);
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<WeeklyPlanDTO>> getPendingWeeklyPlans() {
        return ResponseEntity.ok(weeklyPlanService.getPendingWeeklyPlans());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<WeeklyPlanDTO> getWeeklyPlanById(@PathVariable Long id) {
        WeeklyPlanDTO plan = weeklyPlanService.getWeeklyPlanById(id);
        return ResponseEntity.ok(plan);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<WeeklyPlanDTO> createWeeklyPlan(@Valid @RequestBody WeeklyPlanDTO dto) {
        WeeklyPlanDTO created = weeklyPlanService.createWeeklyPlan(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<WeeklyPlanDTO> updateWeeklyPlan(
            @PathVariable Long id,
            @Valid @RequestBody WeeklyPlanDTO dto) {
        WeeklyPlanDTO updated = weeklyPlanService.updateWeeklyPlan(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteWeeklyPlan(@PathVariable Long id) {
        weeklyPlanService.deleteWeeklyPlan(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<WeeklyPlanDTO> submitForApproval(@PathVariable Long id) {
        WeeklyPlanDTO submitted = weeklyPlanService.submitForApproval(id);
        return ResponseEntity.ok(submitted);
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<WeeklyPlanDTO> approveL1(@PathVariable Long id) {
        WeeklyPlanDTO approved = weeklyPlanService.approveL1(id);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/approve-l2")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WeeklyPlanDTO> approveL2(@PathVariable Long id) {
        WeeklyPlanDTO approved = weeklyPlanService.approveL2(id);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<WeeklyPlanDTO> reject(@PathVariable Long id) {
        WeeklyPlanDTO rejected = weeklyPlanService.reject(id);
        return ResponseEntity.ok(rejected);
    }
}

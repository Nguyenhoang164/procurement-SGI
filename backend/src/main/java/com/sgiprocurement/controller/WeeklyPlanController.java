package com.sgiprocurement.controller;

import com.sgiprocurement.dto.WeeklyPlanDTO;
import com.sgiprocurement.service.WeeklyPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/weekly-plans")
@CrossOrigin(origins = "http://localhost:3000")
public class WeeklyPlanController {

    @Autowired
    private WeeklyPlanService weeklyPlanService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<WeeklyPlanDTO>> getAllWeeklyPlans() {
        List<WeeklyPlanDTO> plans = weeklyPlanService.getAllWeeklyPlans();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<WeeklyPlanDTO> getWeeklyPlanById(@PathVariable Long id) {
        WeeklyPlanDTO plan = weeklyPlanService.getWeeklyPlanById(id);
        return ResponseEntity.ok(plan);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<WeeklyPlanDTO> createWeeklyPlan(@Valid @RequestBody WeeklyPlanDTO dto) {
        WeeklyPlanDTO created = weeklyPlanService.createWeeklyPlan(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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

}

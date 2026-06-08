package com.sgiprocurement.controller;

import com.sgiprocurement.dto.DashboardKpiResponse;
import com.sgiprocurement.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<DashboardKpiResponse> getDashboard() {
        DashboardKpiResponse response = dashboardService.getDashboard();
        return ResponseEntity.ok(response);
    }
}

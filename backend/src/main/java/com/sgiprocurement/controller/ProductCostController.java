package com.sgiprocurement.controller;

import com.sgiprocurement.dto.ProductCostDTO;
import com.sgiprocurement.dto.CostAlertDTO;
import com.sgiprocurement.service.ProductCostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/product-costs")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductCostController {

    @Autowired
    private ProductCostService productCostService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProductCostDTO>> getAllProductCosts() {
        return ResponseEntity.ok(productCostService.getAllProductCosts());
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<CostAlertDTO>> getAllCostAlerts() {
        return ResponseEntity.ok(productCostService.getAllCostAlerts());
    }

    @GetMapping("/alerts/{posCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<CostAlertDTO>> getCostAlertsByPosCode(@PathVariable String posCode) {
        return ResponseEntity.ok(productCostService.getCostAlertsByPosCode(posCode));
    }
}

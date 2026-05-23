package com.sgiprocurement.controller;

import com.sgiprocurement.dto.ProductCostDTO;
import com.sgiprocurement.service.ProductCostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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
}

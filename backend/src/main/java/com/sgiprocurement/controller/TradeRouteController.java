package com.sgiprocurement.controller;

import com.sgiprocurement.dto.TradeRouteDTO;
import com.sgiprocurement.service.TradeRouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/v1/trade-routes")
@CrossOrigin(origins = "http://localhost:3000")
public class TradeRouteController {

    @Autowired
    private TradeRouteService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<TradeRouteDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<TradeRouteDTO>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<TradeRouteDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<TradeRouteDTO> create(@Valid @RequestBody TradeRouteDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<TradeRouteDTO> update(@PathVariable Long id, @Valid @RequestBody TradeRouteDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

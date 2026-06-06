package com.sgiprocurement.controller;

import com.sgiprocurement.dto.ExchangeRateConfigDTO;
import com.sgiprocurement.service.ExchangeRateConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/v1/exchange-rates")
@CrossOrigin(origins = "http://localhost:3000")
public class ExchangeRateConfigController {

    @Autowired
    private ExchangeRateConfigService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<List<ExchangeRateConfigDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{currency}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<ExchangeRateConfigDTO> getByCurrency(@PathVariable String currency) {
        ExchangeRateConfigDTO dto = service.getByCurrency(currency);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{currency}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<ExchangeRateConfigDTO> save(
            @PathVariable String currency,
            @Valid @RequestBody ExchangeRateConfigDTO dto) {
        dto.setCurrency(currency);
        return ResponseEntity.ok(service.save(dto));
    }
}

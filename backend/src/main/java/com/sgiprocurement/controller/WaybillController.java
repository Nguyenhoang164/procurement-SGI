package com.sgiprocurement.controller;

import com.sgiprocurement.dto.WaybillDTO;
import com.sgiprocurement.service.WaybillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/v1/waybills")
@CrossOrigin(origins = "http://localhost:3000")
public class WaybillController {

    @Autowired
    private WaybillService waybillService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<WaybillDTO>> getAllWaybills() {
        return ResponseEntity.ok(waybillService.getAllWaybills());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<WaybillDTO>> searchWaybills(@RequestParam String keyword) {
        return ResponseEntity.ok(waybillService.searchByCode(keyword));
    }

    @GetMapping("/by-payment-request/{paymentRequestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<WaybillDTO>> getWaybillsByPaymentRequestId(@PathVariable Long paymentRequestId) {
        return ResponseEntity.ok(waybillService.getWaybillsByPaymentRequestId(paymentRequestId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<WaybillDTO> getWaybillById(@PathVariable Long id) {
        return ResponseEntity.ok(waybillService.getWaybillById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<WaybillDTO> createWaybill(@Valid @RequestBody WaybillDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(waybillService.createWaybill(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<WaybillDTO> updateWaybill(@PathVariable Long id, @Valid @RequestBody WaybillDTO dto) {
        return ResponseEntity.ok(waybillService.updateWaybill(id, dto));
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<WaybillDTO> confirmDelivery(@PathVariable Long id) {
        return ResponseEntity.ok(waybillService.confirmDelivery(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteWaybill(@PathVariable Long id) {
        waybillService.deleteWaybill(id);
        return ResponseEntity.noContent().build();
    }
}
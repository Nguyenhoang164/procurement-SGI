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
import java.util.Map;

@RestController
@RequestMapping("/v1/waybills")
@CrossOrigin(origins = "http://localhost:3000")
public class WaybillController {

    @Autowired
    private WaybillService waybillService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<WaybillDTO>> getAllWaybills() {
        return ResponseEntity.ok(waybillService.getAllWaybills());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<WaybillDTO>> searchWaybills(@RequestParam String keyword) {
        return ResponseEntity.ok(waybillService.searchByCode(keyword));
    }

    @GetMapping("/by-payment-request/{paymentRequestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<WaybillDTO>> getWaybillsByPaymentRequestId(@PathVariable Long paymentRequestId) {
        return ResponseEntity.ok(waybillService.getWaybillsByPaymentRequestId(paymentRequestId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<WaybillDTO> getWaybillById(@PathVariable Long id) {
        return ResponseEntity.ok(waybillService.getWaybillById(id));
    }

@PostMapping
    // Allow ADMIN, CEO and PURCHASING to create waybills so procurement staff can set freightVnd when creating
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'PURCHASING')")
    public ResponseEntity<WaybillDTO> createWaybill(@Valid @RequestBody WaybillDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(waybillService.createWaybill(dto));
    }

@PutMapping("/{id}")
    // Allow ADMIN, CEO and PURCHASING to update waybills so procurement staff can edit freightVnd
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'PURCHASING')")
    public ResponseEntity<WaybillDTO> updateWaybill(@PathVariable Long id, @Valid @RequestBody WaybillDTO dto) {
        return ResponseEntity.ok(waybillService.updateWaybill(id, dto));
    }

@PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole(\'ADMIN\', \'CEO\')")
    public ResponseEntity<WaybillDTO> confirmDelivery(@PathVariable Long id) {
        return ResponseEntity.ok(waybillService.confirmDelivery(id));
    }

@PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASING')")
    public ResponseEntity<WaybillDTO> updateWaybillStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        return ResponseEntity.ok(waybillService.updateWaybillStatus(id, newStatus));
    }

@DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole(\'ADMIN\', \'CEO\')")
    public ResponseEntity<Void> deleteWaybill(@PathVariable Long id) {
        waybillService.deleteWaybill(id);
        return ResponseEntity.noContent().build();
    }
}
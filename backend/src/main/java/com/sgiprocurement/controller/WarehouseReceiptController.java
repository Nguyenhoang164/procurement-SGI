package com.sgiprocurement.controller;

import com.sgiprocurement.dto.WarehouseReceiptDTO;
import com.sgiprocurement.dto.PendingReceiveDTO;
import com.sgiprocurement.dto.WarehouseReceiveRequest;
import com.sgiprocurement.service.WarehouseReceiptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/v1/warehouse-receipts")
@CrossOrigin(origins = "http://localhost:3000")
public class WarehouseReceiptController {

    @Autowired
    private WarehouseReceiptService warehouseReceiptService;

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<PendingReceiveDTO>> getPendingReceives() {
        return ResponseEntity.ok(warehouseReceiptService.getPendingReceives());
    }

    @PostMapping("/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<WarehouseReceiptDTO> receiveGoods(@Valid @RequestBody WarehouseReceiveRequest request) {
        WarehouseReceiptDTO created = warehouseReceiptService.receiveGoods(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<WarehouseReceiptDTO>> getAllWarehouseReceipts() {
        List<WarehouseReceiptDTO> receipts = warehouseReceiptService.getAllWarehouseReceipts();
        return ResponseEntity.ok(receipts);
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<WarehouseReceiptDTO> getWarehouseReceiptById(@PathVariable Long id) {
        WarehouseReceiptDTO receipt = warehouseReceiptService.getWarehouseReceiptById(id);
        return ResponseEntity.ok(receipt);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<WarehouseReceiptDTO> createWarehouseReceipt(@Valid @RequestBody WarehouseReceiptDTO dto) {
        WarehouseReceiptDTO created = warehouseReceiptService.createWarehouseReceipt(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<WarehouseReceiptDTO> updateWarehouseReceipt(
            @PathVariable Long id,
            @Valid @RequestBody WarehouseReceiptDTO dto) {
        WarehouseReceiptDTO updated = warehouseReceiptService.updateWarehouseReceipt(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteWarehouseReceipt(@PathVariable Long id) {
        warehouseReceiptService.deleteWarehouseReceipt(id);
        return ResponseEntity.noContent().build();
    }

}

package com.sgiprocurement.controller;

import com.sgiprocurement.dto.PurchaseOrderDTO;
import com.sgiprocurement.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@CrossOrigin(origins = "http://localhost:3000")
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<PurchaseOrderDTO>> getAllPurchaseOrders() {
        List<PurchaseOrderDTO> orders = purchaseOrderService.getAllPurchaseOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<PurchaseOrderDTO> getPurchaseOrderById(@PathVariable Long id) {
        PurchaseOrderDTO order = purchaseOrderService.getPurchaseOrderById(id);
        return ResponseEntity.ok(order);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PurchaseOrderDTO> createPurchaseOrder(@Valid @RequestBody PurchaseOrderDTO dto) {
        PurchaseOrderDTO created = purchaseOrderService.createPurchaseOrder(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PurchaseOrderDTO> updatePurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderDTO dto) {
        PurchaseOrderDTO updated = purchaseOrderService.updatePurchaseOrder(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePurchaseOrder(@PathVariable Long id) {
        purchaseOrderService.deletePurchaseOrder(id);
        return ResponseEntity.noContent().build();
    }

}

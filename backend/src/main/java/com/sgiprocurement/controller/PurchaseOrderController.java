package com.sgiprocurement.controller;

import com.sgiprocurement.dto.PurchaseOrderDTO;
import com.sgiprocurement.dto.PurchaseOrderImportResult;
import com.sgiprocurement.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/purchase-orders")
@CrossOrigin(origins = "http://localhost:3000")
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<Map<String, Object>> getAllPurchaseOrders(
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        java.time.LocalDateTime start = null;
        java.time.LocalDateTime end = null;
        if (startDate != null && !startDate.isEmpty()) {
            start = java.time.LocalDate.parse(startDate).atStartOfDay();
        }
        if (endDate != null && !endDate.isEmpty()) {
            end = java.time.LocalDate.parse(endDate).plusDays(1).atStartOfDay();
        }
        Map<String, Object> result = purchaseOrderService.getAllPurchaseOrdersPaged(department, page, size, start, end);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<PurchaseOrderDTO>> getPendingPurchaseOrders() {
        return ResponseEntity.ok(purchaseOrderService.getPendingPurchaseOrders());
    }

    @GetMapping("/departments")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<String>> getAllDepartments() {
        return ResponseEntity.ok(purchaseOrderService.getAllDepartments());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<PurchaseOrderDTO> getPurchaseOrderById(@PathVariable Long id) {
        PurchaseOrderDTO order = purchaseOrderService.getPurchaseOrderById(id);
        return ResponseEntity.ok(order);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASING')")
    public ResponseEntity<PurchaseOrderDTO> createPurchaseOrder(@Valid @RequestBody PurchaseOrderDTO dto) {
        PurchaseOrderDTO created = purchaseOrderService.createPurchaseOrder(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASING')")
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

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAllPurchaseOrders() {
        purchaseOrderService.deleteAllPurchaseOrders();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<PurchaseOrderDTO> submitForApproval(@PathVariable Long id) {
        PurchaseOrderDTO submitted = purchaseOrderService.submitForApproval(id);
        return ResponseEntity.ok(submitted);
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<PurchaseOrderDTO> approveL1(@PathVariable Long id) {
        PurchaseOrderDTO approved = purchaseOrderService.approveL1(id);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/send-to-accounting")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PurchaseOrderDTO> sendToAccounting(@PathVariable Long id) {
        PurchaseOrderDTO sent = purchaseOrderService.sendToAccounting(id);
        return ResponseEntity.ok(sent);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<PurchaseOrderDTO> reject(@PathVariable Long id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String rejectedBy) {
        PurchaseOrderDTO rejected = purchaseOrderService.reject(id, reason, rejectedBy);
        return ResponseEntity.ok(rejected);
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<PurchaseOrderDTO> updateStatus(@PathVariable Long id, @RequestParam String status) {
        PurchaseOrderDTO updated = purchaseOrderService.updateStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<PurchaseOrderDTO>> search(
            @RequestParam String keyword,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        java.time.LocalDateTime start = null;
        java.time.LocalDateTime end = null;
        if (startDate != null && !startDate.isEmpty()) {
            start = java.time.LocalDate.parse(startDate).atStartOfDay();
        }
        if (endDate != null && !endDate.isEmpty()) {
            end = java.time.LocalDate.parse(endDate).plusDays(1).atStartOfDay();
        }
        return ResponseEntity.ok(purchaseOrderService.searchByKeyword(keyword, department, start, end));
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASING')")
    public ResponseEntity<Map<String, Object>> importPurchaseOrders(@RequestBody List<PurchaseOrderDTO> orders) {
        int count = purchaseOrderService.importPurchaseOrders(orders);
        return ResponseEntity.ok(Map.of("imported", count, "message", "Đã import " + count + " đơn hàng"));
    }

    @PostMapping("/import/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASING')")
    public ResponseEntity<PurchaseOrderImportResult> importExcel(@RequestParam("file") MultipartFile file) {
        PurchaseOrderImportResult result = purchaseOrderService.importFromExcel(file);
        HttpStatus status = result.getErrorCount() > 0 ? HttpStatus.MULTI_STATUS : HttpStatus.OK;
        return ResponseEntity.status(status).body(result);
    }

}

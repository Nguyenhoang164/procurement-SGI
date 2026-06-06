package com.sgiprocurement.controller;

import com.sgiprocurement.dto.PaymentRequestDTO;
import com.sgiprocurement.service.PaymentRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/payment-requests")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentRequestController {

    @Autowired
    private PaymentRequestService paymentRequestService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<List<PaymentRequestDTO>> getAllPaymentRequests() {
        List<PaymentRequestDTO> requests = paymentRequestService.getAllPaymentRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<List<PaymentRequestDTO>> searchPaymentRequests(@RequestParam String keyword) {
        List<PaymentRequestDTO> results = paymentRequestService.searchPaymentRequests(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<PaymentRequestDTO> getPaymentRequestById(@PathVariable Long id) {
        PaymentRequestDTO request = paymentRequestService.getPaymentRequestById(id);
        return ResponseEntity.ok(request);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<PaymentRequestDTO> createPaymentRequest(@Valid @RequestBody PaymentRequestDTO dto) {
        PaymentRequestDTO created = paymentRequestService.createPaymentRequest(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<PaymentRequestDTO> updatePaymentRequest(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequestDTO dto) {
        PaymentRequestDTO updated = paymentRequestService.updatePaymentRequest(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePaymentRequest(@PathVariable Long id) {
        paymentRequestService.deletePaymentRequest(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<PaymentRequestDTO> approveL1(@PathVariable Long id) {
        PaymentRequestDTO approved = paymentRequestService.approveL1(id);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/approve-l2")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentRequestDTO> approveL2(@PathVariable Long id) {
        PaymentRequestDTO approved = paymentRequestService.approveL2(id);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/accounting-check")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<PaymentRequestDTO> accountingCheck(
            @PathVariable Long id,
            @RequestParam String checkedBy) {
        PaymentRequestDTO result = paymentRequestService.accountingCheck(id, checkedBy);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<PaymentRequestDTO> reject(@PathVariable Long id, @RequestParam(required = false) String reason, @RequestParam(required = false) String rejectedBy) {
        PaymentRequestDTO rejected = paymentRequestService.reject(id, reason, rejectedBy);
        return ResponseEntity.ok(rejected);
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<PaymentRequestDTO> markAsPaid(
            @PathVariable Long id,
            @RequestParam(required = false) String confirmedBy,
            @RequestParam(required = false) Long bankAccountId) {
        PaymentRequestDTO paid = paymentRequestService.markAsPaid(id, confirmedBy, bankAccountId);
        return ResponseEntity.ok(paid);
    }

    @GetMapping("/{id}/exchange-rate-diff")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<Map<String, Object>> getExchangeRateDiffByReference(@PathVariable Long id) {
        PaymentRequestDTO pr = paymentRequestService.getPaymentRequestById(id);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", pr.getId());
        result.put("exchangeRateDiffVnd", pr.getExchangeRateDiffVnd());
        result.put("referencePaymentRequestId", pr.getReferencePaymentRequestId());
        result.put("amountVnd", pr.getAmountVnd());
        result.put("type", pr.getType());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/confirm-payment")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<PaymentRequestDTO> confirmPayment(
            @PathVariable Long id,
            @RequestParam String confirmedBy) {
        PaymentRequestDTO confirmed = paymentRequestService.confirmPayment(id, confirmedBy);
        return ResponseEntity.ok(confirmed);
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<String> attachmentsMethodHint(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .header(HttpHeaders.ALLOW, "POST")
                .body("Upload minh chung: dung POST multipart/form-data, field name \"files\", toi /v1/payment-requests/" + id + "/attachments");
    }

    @PostMapping(path = "/{id}/attachments", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<PaymentRequestDTO> uploadAttachments(
            @PathVariable Long id,
            @RequestPart("files") MultipartFile[] files) throws IOException {
        PaymentRequestDTO updated = paymentRequestService.uploadAttachments(id, files);
        return ResponseEntity.ok(updated);
    }

}

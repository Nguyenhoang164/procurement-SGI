package com.sgiprocurement.controller;

import com.sgiprocurement.dto.PaymentRequestDTO;
import com.sgiprocurement.service.PaymentRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payment-requests")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentRequestController {

    @Autowired
    private PaymentRequestService paymentRequestService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<PaymentRequestDTO>> getAllPaymentRequests() {
        List<PaymentRequestDTO> requests = paymentRequestService.getAllPaymentRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<PaymentRequestDTO> getPaymentRequestById(@PathVariable Long id) {
        PaymentRequestDTO request = paymentRequestService.getPaymentRequestById(id);
        return ResponseEntity.ok(request);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PaymentRequestDTO> createPaymentRequest(@Valid @RequestBody PaymentRequestDTO dto) {
        PaymentRequestDTO created = paymentRequestService.createPaymentRequest(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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

}

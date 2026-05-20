package com.sgiprocurement.service;

import com.sgiprocurement.model.PaymentRequest;
import com.sgiprocurement.dto.PaymentRequestDTO;
import com.sgiprocurement.repository.PaymentRequestRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentRequestService {

    @Autowired
    private PaymentRequestRepository paymentRequestRepository;

    public List<PaymentRequestDTO> getAllPaymentRequests() {
        return paymentRequestRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentRequestDTO getPaymentRequestById(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));
        return convertToDTO(pr);
    }

    public List<PaymentRequestDTO> getPaymentRequestsByPoId(Long poId) {
        return paymentRequestRepository.findByPoId(poId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentRequestDTO> getPaymentRequestsByStatus(String status) {
        return paymentRequestRepository.findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentRequestDTO createPaymentRequest(PaymentRequestDTO dto) {
        PaymentRequest pr = convertToEntity(dto);
        pr.setStatus("DRAFT");
        PaymentRequest saved = paymentRequestRepository.save(pr);
        return convertToDTO(saved);
    }

    public PaymentRequestDTO updatePaymentRequest(Long id, PaymentRequestDTO dto) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        pr.setPoId(dto.getPoId());
        pr.setType(dto.getType());
        pr.setAmountVnd(dto.getAmountVnd());
        pr.setCurrency(dto.getCurrency());

        PaymentRequest updated = paymentRequestRepository.save(pr);
        return convertToDTO(updated);
    }

    public void deletePaymentRequest(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));
        paymentRequestRepository.delete(pr);
    }

    private PaymentRequestDTO convertToDTO(PaymentRequest pr) {
        return new PaymentRequestDTO(
                pr.getId(),
                pr.getPoId(),
                pr.getType(),
                pr.getAmountVnd(),
                pr.getCurrency(),
                pr.getStatus(),
                pr.getCreatedBy(),
                pr.getCreatedAt(),
                pr.getUpdatedAt()
        );
    }

    private PaymentRequest convertToEntity(PaymentRequestDTO dto) {
        return new PaymentRequest(
                dto.getId(),
                dto.getPoId(),
                dto.getType(),
                dto.getAmountVnd(),
                dto.getCurrency(),
                dto.getStatus(),
                dto.getCreatedBy(),
                dto.getCreatedAt(),
                dto.getUpdatedAt()
        );
    }

}

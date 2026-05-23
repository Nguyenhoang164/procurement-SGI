package com.sgiprocurement.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgiprocurement.model.PaymentRequest;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.dto.PaymentRequestDTO;
import com.sgiprocurement.repository.PaymentRequestRepository;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentRequestService {

    @Autowired
    private PaymentRequestRepository paymentRequestRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ObjectMapper objectMapper;

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
        PurchaseOrder po = purchaseOrderRepository.findById(dto.getPoId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + dto.getPoId()));
        validatePurchaseOrderCanCreatePayment(po);

        PaymentRequest pr = convertToEntity(dto);
        pr.setStatus("PENDING_L1");
        PaymentRequest saved = paymentRequestRepository.save(pr);
        syncLinkedPurchaseOrderPaymentStatus(saved.getPoId(), saved.getStatus());
        return convertToDTO(saved);
    }

    public PaymentRequestDTO approveL1(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (!"PENDING_L1".equals(pr.getStatus())) {
            throw new IllegalStateException("YĂªu cáº§u khĂ´ng á»Ÿ tráº¡ng thĂ¡i chá» duyá»‡t L1");
        }

        pr.setStatus("PENDING_L2");
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPurchaseOrderPaymentStatus(updated.getPoId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO approveL2(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (!"PENDING_L2".equals(pr.getStatus())) {
            throw new IllegalStateException("YĂªu cáº§u khĂ´ng á»Ÿ tráº¡ng thĂ¡i chá» duyá»‡t L2");
        }

        pr.setStatus("APPROVED");
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPurchaseOrderPaymentStatus(updated.getPoId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO reject(Long id, String reason) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        pr.setStatus("REJECTED");
        if (reason != null && !reason.isBlank()) {
            pr.setNote(reason.trim());
        }
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPurchaseOrderPaymentStatus(updated.getPoId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO markAsPaid(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (!"APPROVED".equals(pr.getStatus())) {
            throw new IllegalStateException("YĂªu cáº§u chÆ°a Ä‘Æ°á»£c phĂª duyá»‡t hoĂ n toĂ n");
        }

        PurchaseOrder po = purchaseOrderRepository.findById(pr.getPoId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + pr.getPoId()));
        validatePurchaseOrderCanMarkPaid(po);

        pr.setStatus("PAID");
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPurchaseOrderPaymentStatus(updated.getPoId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO updatePaymentRequest(Long id, PaymentRequestDTO dto) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        pr.setPoId(dto.getPoId());
        pr.setType(dto.getType());
        pr.setAmountVnd(dto.getAmountVnd());
        pr.setCurrency(dto.getCurrency());
        if (dto.getNote() != null) {
            pr.setNote(dto.getNote());
        }

        PaymentRequest updated = paymentRequestRepository.save(pr);
        return convertToDTO(updated);
    }

    public PaymentRequestDTO uploadAttachments(Long id, MultipartFile[] files) throws IOException {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("ChÆ°a chá»n file Ä‘á»ƒ táº£i lĂªn");
        }

        List<String> urls = parseAttachmentUrls(pr.getAttachments());
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                urls.add(fileStorageService.storePaymentAttachment(id, file));
            }
        }
        pr.setAttachments(serializeAttachmentUrls(urls));
        PaymentRequest updated = paymentRequestRepository.save(pr);
        return convertToDTO(updated);
    }

    public void deletePaymentRequest(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));
        paymentRequestRepository.delete(pr);
    }

    private PaymentRequestDTO convertToDTO(PaymentRequest pr) {
        PaymentRequestDTO dto = new PaymentRequestDTO();
        dto.setId(pr.getId());
        dto.setPoId(pr.getPoId());
        dto.setType(pr.getType());
        dto.setAmountVnd(pr.getAmountVnd());
        dto.setCurrency(pr.getCurrency());
        dto.setStatus(pr.getStatus());
        dto.setAttachments(pr.getAttachments());
        dto.setNote(pr.getNote());
        dto.setCreatedBy(pr.getCreatedBy());
        dto.setCreatedAt(pr.getCreatedAt());
        dto.setUpdatedAt(pr.getUpdatedAt());
        return dto;
    }

    private PaymentRequest convertToEntity(PaymentRequestDTO dto) {
        PaymentRequest pr = new PaymentRequest();
        pr.setId(dto.getId());
        pr.setPoId(dto.getPoId());
        pr.setType(dto.getType());
        pr.setAmountVnd(dto.getAmountVnd());
        pr.setCurrency(dto.getCurrency());
        pr.setStatus(dto.getStatus());
        pr.setAttachments(dto.getAttachments());
        pr.setNote(dto.getNote());
        pr.setCreatedBy(dto.getCreatedBy());
        pr.setCreatedAt(dto.getCreatedAt());
        pr.setUpdatedAt(dto.getUpdatedAt());
        return pr;
    }

    /**
     * Äá»“ng bá»™ tráº¡ng thĂ¡i thanh toĂ¡n cá»§a PO (payment_status) theo DNTT.
     * Giá»¯ nguyĂªn status Ä‘Æ¡n hĂ ng (duyá»‡t Ä‘áº·t hĂ ng / váº­n chuyá»ƒn).
     */
    private void syncLinkedPurchaseOrderPaymentStatus(Long poId, String paymentStatus) {
        if (poId == null || paymentStatus == null) {
            return;
        }
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + poId));
        po.setPaymentStatus(paymentStatus);
        if ("PAID".equals(paymentStatus)) {
            po.setStatus("IN_TRANSIT");
        }
        purchaseOrderRepository.save(po);
    }

    private void validatePurchaseOrderCanCreatePayment(PurchaseOrder po) {
        if (!"APPROVED".equals(po.getStatus())) {
            throw new IllegalStateException("Chi duoc lap DNTT cho don hang da phe duyet");
        }

        if (po.getPaymentStatus() != null && !"REJECTED".equals(po.getPaymentStatus())) {
            throw new IllegalStateException("Don hang da co DNTT dang xu ly hoac da thanh toan");
        }
    }

    private void validatePurchaseOrderCanMarkPaid(PurchaseOrder po) {
        if (!"APPROVED".equals(po.getStatus())) {
            throw new IllegalStateException("Chi duoc xac nhan thanh toan cho don hang da phe duyet");
        }

        if ("PAID".equals(po.getPaymentStatus())) {
            throw new IllegalStateException("Don hang da thanh toan");
        }
    }

    private List<String> parseAttachmentUrls(String raw) {
        if (raw == null || raw.isBlank()) {
            return new ArrayList<>();
        }
        try {
            if (raw.trim().startsWith("[")) {
                return objectMapper.readValue(raw, new TypeReference<List<String>>() {});
            }
            List<String> legacy = new ArrayList<>();
            for (String part : raw.split(",")) {
                if (!part.isBlank()) {
                    legacy.add(part.trim());
                }
            }
            return legacy;
        } catch (IOException e) {
            throw new IllegalStateException("KhĂ´ng Ä‘á»c Ä‘Æ°á»£c danh sĂ¡ch file Ä‘Ă­nh kĂ¨m", e);
        }
    }

    private String serializeAttachmentUrls(List<String> urls) {
        try {
            return objectMapper.writeValueAsString(urls);
        } catch (IOException e) {
            throw new IllegalStateException("KhĂ´ng lÆ°u Ä‘Æ°á»£c danh sĂ¡ch file Ä‘Ă­nh kĂ¨m", e);
        }
    }
}


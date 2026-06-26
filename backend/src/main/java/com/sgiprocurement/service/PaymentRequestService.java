package com.sgiprocurement.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgiprocurement.model.*;
import com.sgiprocurement.dto.*;
import com.sgiprocurement.repository.*;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;

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

    @Autowired
    private PaymentRequestPurchaseOrderRepository paymentRequestPurchaseOrderRepository;

    @Autowired
    private PaymentRequestWaybillRepository paymentRequestWaybillRepository;

    @Autowired
    private CustomFeeRepository customFeeRepository;

    @Autowired
    private WaybillRepository waybillRepository;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Autowired
    private WarehouseReceiptRepository warehouseReceiptRepository;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    public List<PaymentRequestDTO> getAllPaymentRequests() {
        return paymentRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentRequestDTO getPaymentRequestById(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));
        return convertToDTO(pr);
    }

    public List<PaymentRequestDTO> searchPaymentRequests(String keyword) {
        return paymentRequestRepository.searchByKeyword(keyword)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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

    public List<PaymentRequestDTO> getPendingPaymentRequests() {
        return paymentRequestRepository.findByStatusIn(List.of("PENDING_L1", "PENDING_L2", "ACCOUNTING_CHECK"))
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentRequestDTO createPaymentRequest(PaymentRequestDTO dto) {
        if (dto.getPoId() != null && !"VAN_CHUYEN".equals(dto.getType())) {
            PurchaseOrder po = purchaseOrderRepository.findById(dto.getPoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + dto.getPoId()));
            validatePurchaseOrderCanCreatePayment(po);
        }

        if (dto.getReferencePaymentRequestId() != null) {
            PaymentRequest ref = paymentRequestRepository.findById(dto.getReferencePaymentRequestId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reference payment request not found with id: " + dto.getReferencePaymentRequestId()));
            if (ref.getExchangeRateDiffVnd() != null && ref.getExchangeRateDiffVnd().compareTo(BigDecimal.ZERO) > 0) {
                dto.setExchangeRateDiffVnd(ref.getExchangeRateDiffVnd());
            }
        }

        PaymentRequest pr = convertToEntity(dto);
        pr.setStatus("PENDING_L1");
        PaymentRequest saved = paymentRequestRepository.save(pr);

        if (dto.getPoIds() != null) {
            for (Long poId : dto.getPoIds()) {
                PaymentRequestPurchaseOrder link = new PaymentRequestPurchaseOrder();
                link.setPaymentRequestId(saved.getId());
                link.setPoId(poId);
                paymentRequestPurchaseOrderRepository.save(link);
                syncLinkedPurchaseOrderPaymentStatus(poId, saved.getStatus());
            }
        }

        if (dto.getWaybillIds() != null) {
            for (Long waybillId : dto.getWaybillIds()) {
                PaymentRequestWaybill link = new PaymentRequestWaybill();
                link.setPaymentRequestId(saved.getId());
                link.setWaybillId(waybillId);
                paymentRequestWaybillRepository.save(link);
            }
        }

        if (dto.getCustomFees() != null) {
            for (CustomFeeDTO feeDTO : dto.getCustomFees()) {
                CustomFee fee = new CustomFee();
                fee.setPaymentRequestId(saved.getId());
                fee.setFeeName(feeDTO.getFeeName());
                fee.setFeeAmount(feeDTO.getFeeAmount());
                customFeeRepository.save(fee);
            }
        }

        if (dto.getPoId() != null && dto.getPoId() > 0) {
            syncLinkedPurchaseOrderPaymentStatus(dto.getPoId(), saved.getStatus());
        }

        return convertToDTO(saved);
    }

    public PaymentRequestDTO approveL1(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (!"PENDING_L1".equals(pr.getStatus())) {
            throw new IllegalStateException("Yeu cau khong o trang thai cho duyet L1");
        }

        pr.setStatus("ACCOUNTING_CHECK");
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPaymentStatus(updated.getId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO accountingCheck(Long id, String checkedBy) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (!"ACCOUNTING_CHECK".equals(pr.getStatus())) {
            throw new IllegalStateException("Yeu cau khong o trang thai cho ke toan kiem tra");
        }

        pr.setStatus("PENDING_L2");
        pr.setAccountingCheckedBy(checkedBy);
        pr.setAccountingCheckedAt(LocalDateTime.now());
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPaymentStatus(updated.getId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO approveL2(Long id) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (!"PENDING_L2".equals(pr.getStatus())) {
            throw new IllegalStateException("Yeu cau khong o trang thai cho duyet L2");
        }

        pr.setStatus("APPROVED");
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPaymentStatus(updated.getId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO reject(Long id, String reason, String rejectedBy) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        String currentStatus = pr.getStatus();
        pr.setStatus("REJECTED");
        pr.setRejectedBy(rejectedBy);
        pr.setRejectedAt(LocalDateTime.now());
        pr.setRejectReason(reason);
        if ("PENDING_L1".equals(currentStatus)) {
            pr.setRejectedLevel("L1");
        } else if ("ACCOUNTING_CHECK".equals(currentStatus)) {
            pr.setRejectedLevel("ACCOUNTING");
        } else if ("PENDING_L2".equals(currentStatus)) {
            pr.setRejectedLevel("L2");
        } else {
            pr.setRejectedLevel("L1");
        }
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPaymentStatus(updated.getId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO markAsPaid(Long id, String confirmedBy, Long bankAccountId) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (!"APPROVED".equals(pr.getStatus())) {
            throw new IllegalStateException("Yeu cau chua duoc phe duyet hoan toan");
        }

        if (bankAccountId != null) {
            bankAccountRepository.findById(bankAccountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + bankAccountId));
            pr.setBankAccountId(bankAccountId);
        }

        // Only create waybills for non-MUA_HANG and non-VAN_CHUYEN types
        if (!"MUA_HANG".equals(pr.getType()) && !"VAN_CHUYEN".equals(pr.getType())) {
            PurchaseOrder po = purchaseOrderRepository.findById(pr.getPoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + pr.getPoId()));
            validatePurchaseOrderCanMarkPaid(po);

            Set<Long> poIdSet = new HashSet<>();
            if (pr.getPoId() != null) poIdSet.add(pr.getPoId());
            List<PaymentRequestPurchaseOrder> poLinks = paymentRequestPurchaseOrderRepository
                    .findByPaymentRequestId(pr.getId());
            for (PaymentRequestPurchaseOrder link : poLinks) {
                poIdSet.add(link.getPoId());
            }

            for (Long poId : poIdSet) {
                PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(poId).orElse(null);
                if (purchaseOrder == null) continue;

                List<PurchaseOrderItem> items = purchaseOrderItemRepository.findByPurchaseOrderId(poId);
                for (PurchaseOrderItem item : items) {
                    String productsJson = "[]";
                    try {
                        List<Map<String, Object>> productList = new ArrayList<>();
                        Map<String, Object> p = new HashMap<>();
                        p.put("posCode", item.getPosCode());
                        p.put("productName", item.getProductName());
                        p.put("productShortCode", item.getProductShortCode());
                        p.put("orderedQty", item.getOrderedQty());
                        p.put("unitPrice", item.getUnitPrice());
                        p.put("totalAmountVnd", item.getTotalAmountVnd());
                        productList.add(p);
                        productsJson = objectMapper.writeValueAsString(productList);
                    } catch (Exception e) {
                        productsJson = "[{\"posCode\":\"" + item.getPosCode() + "\",\"productName\":\"" + (item.getProductName() != null ? item.getProductName() : "") + "\"}]";
                    }

                    Waybill waybill = new Waybill();
                    waybill.setWaybillCode("WB-" + System.currentTimeMillis() + "-" + poId + "-" + item.getId());
                    waybill.setCarrier(purchaseOrder.getShippingMethod());
                    waybill.setOrigin(purchaseOrder.getCountry());
                    waybill.setExpectedQty(item.getOrderedQty());
                    waybill.setStatus("PENDING");
                    waybill.setPaymentRequestId(pr.getId());
                    waybill.setProducts(productsJson);

                    BigDecimal poIntlShippingUnitPrice = purchaseOrder.getInternationalShippingUnitPriceVnd() != null ?
                        purchaseOrder.getInternationalShippingUnitPriceVnd() : BigDecimal.ZERO;
                    String weightVolume = purchaseOrder.getPackageMeasurement();
                    Long freightVnd = 0L;
                    if (weightVolume != null && !weightVolume.isBlank() && poIntlShippingUnitPrice != null) {
                        String measurementStr = extractFirstNumber(weightVolume);
                        if (measurementStr != null) {
                            BigDecimal measurement = new BigDecimal(measurementStr.replace(",", "."));
                            BigDecimal calculatedFreight = poIntlShippingUnitPrice.multiply(measurement);
                            freightVnd = calculatedFreight != null ? calculatedFreight.longValue() : 0L;
                        }
                    }
                    waybill.setFreightVnd(freightVnd);

                    Waybill saved = waybillRepository.save(waybill);

                    PaymentRequestWaybill link = new PaymentRequestWaybill();
                    link.setPaymentRequestId(pr.getId());
                    link.setWaybillId(saved.getId());
                    paymentRequestWaybillRepository.save(link);
                }
            }
        }

        pr.setStatus("PAID");
        pr.setPaymentConfirmedAt(LocalDateTime.now());
        if (confirmedBy != null && !confirmedBy.isBlank()) {
            pr.setPaymentConfirmedBy(confirmedBy.trim());
        }
        PaymentRequest updated = paymentRequestRepository.save(pr);
        syncLinkedPaymentStatus(updated.getId(), updated.getStatus());
        return convertToDTO(updated);
    }

    public PaymentRequestDTO confirmPayment(Long id, String confirmedBy) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (!"APPROVED".equals(pr.getStatus())) {
            throw new IllegalStateException("Chi co the xac nhan thanh toan cho yeu cau da duyet");
        }

        pr.setPaymentConfirmedAt(LocalDateTime.now());
        pr.setPaymentConfirmedBy(confirmedBy);
        PaymentRequest updated = paymentRequestRepository.save(pr);
        return convertToDTO(updated);
    }

    public PaymentRequestDTO updatePaymentRequest(Long id, PaymentRequestDTO dto) {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        pr.setPoId(dto.getPoId());
        pr.setType(dto.getType());
        pr.setAmountVnd(dto.getAmountVnd());
        pr.setCurrency(dto.getCurrency());
        pr.setExchangeRateDiffVnd(dto.getExchangeRateDiffVnd());
        pr.setAdditionalShippingVnd(dto.getAdditionalShippingVnd());
        pr.setTotalAmountVnd(dto.getTotalAmountVnd());
        if (dto.getReason() != null) {
            pr.setReason(dto.getReason());
        }
        if (dto.getNote() != null) {
            pr.setNote(dto.getNote());
        }
        if (dto.getReferencePaymentRequestId() != null) {
            pr.setReferencePaymentRequestId(dto.getReferencePaymentRequestId());
        }
        if (dto.getBankAccountId() != null) {
            pr.setBankAccountId(dto.getBankAccountId());
        }
        if (dto.getDepartment() != null) {
            pr.setDepartment(dto.getDepartment());
        }

        PaymentRequest updated = paymentRequestRepository.save(pr);

        if (dto.getCustomFees() != null) {
            customFeeRepository.deleteByPaymentRequestId(updated.getId());
            for (CustomFeeDTO feeDTO : dto.getCustomFees()) {
                CustomFee fee = new CustomFee();
                fee.setPaymentRequestId(updated.getId());
                fee.setFeeName(feeDTO.getFeeName());
                fee.setFeeAmount(feeDTO.getFeeAmount());
                customFeeRepository.save(fee);
            }
        }

        return convertToDTO(updated);
    }

    public PaymentRequestDTO uploadAttachments(Long id, MultipartFile[] files) throws IOException {
        PaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + id));

        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("Chua chon file de tai len");
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
        paymentRequestPurchaseOrderRepository.deleteByPaymentRequestId(id);
        paymentRequestWaybillRepository.deleteByPaymentRequestId(id);
        customFeeRepository.deleteByPaymentRequestId(id);
        paymentRequestRepository.delete(pr);
    }

    private void syncLinkedPaymentStatus(Long paymentRequestId, String paymentStatus) {
        List<PaymentRequestPurchaseOrder> links = paymentRequestPurchaseOrderRepository
                .findByPaymentRequestId(paymentRequestId);
        for (PaymentRequestPurchaseOrder link : links) {
            syncLinkedPurchaseOrderPaymentStatus(link.getPoId(), paymentStatus);
        }
        PaymentRequest pr = paymentRequestRepository.findById(paymentRequestId).orElse(null);
        if (pr != null && pr.getPoId() != null && pr.getPoId() > 0) {
            syncLinkedPurchaseOrderPaymentStatus(pr.getPoId(), paymentStatus);
        }
    }

    private void syncLinkedPurchaseOrderPaymentStatus(Long poId, String paymentStatus) {
        if (poId == null || poId <= 0 || paymentStatus == null) {
            return;
        }
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + poId));
        po.setPaymentStatus(paymentStatus);
        if ("PAID".equals(paymentStatus)) {
            po.setStatus("IN_TRANSIT");
            po.setGoodsPaymentDate(LocalDate.now());
        }
        purchaseOrderRepository.save(po);
    }

    private void validatePurchaseOrderCanCreatePayment(PurchaseOrder po) {
        if (!"APPROVED".equals(po.getStatus()) && !"SENT_TO_ACCOUNTING".equals(po.getStatus())) {
            throw new IllegalStateException("Chi duoc lap DNTT cho don hang da phe duyet");
        }
        if (po.getPaymentStatus() != null && !"REJECTED".equals(po.getPaymentStatus())) {
            throw new IllegalStateException("Don hang da co DNTT dang xu ly hoac da thanh toan");
        }
    }

    private void validatePurchaseOrderCanMarkPaid(PurchaseOrder po) {
        if (!"APPROVED".equals(po.getStatus()) && !"SENT_TO_ACCOUNTING".equals(po.getStatus())) {
            throw new IllegalStateException("Chi duoc xac nhan thanh toan cho don hang da phe duyet");
        }
        if ("PAID".equals(po.getPaymentStatus())) {
            throw new IllegalStateException("Don hang da thanh toan");
        }
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
        dto.setReason(pr.getReason());
        dto.setExchangeRateDiffVnd(pr.getExchangeRateDiffVnd());
        dto.setAdditionalShippingVnd(pr.getAdditionalShippingVnd());
        dto.setTotalAmountVnd(pr.getTotalAmountVnd());
        dto.setPaymentConfirmedAt(pr.getPaymentConfirmedAt());
        dto.setPaymentConfirmedBy(pr.getPaymentConfirmedBy());
        dto.setCreatedBy(pr.getCreatedBy());
        dto.setCreatedAt(pr.getCreatedAt());
        dto.setUpdatedAt(pr.getUpdatedAt());
        dto.setRejectedBy(pr.getRejectedBy());
        dto.setRejectedAt(pr.getRejectedAt());
        dto.setRejectReason(pr.getRejectReason());
        dto.setRejectedLevel(pr.getRejectedLevel());
        dto.setReferencePaymentRequestId(pr.getReferencePaymentRequestId());
        dto.setBankAccountId(pr.getBankAccountId());
        dto.setAccountingCheckedBy(pr.getAccountingCheckedBy());
        dto.setAccountingCheckedAt(pr.getAccountingCheckedAt());
        dto.setSourceDnttIds(pr.getSourceDnttIds());
        dto.setShipmentItems(pr.getShipmentItems());
        dto.setDepartment(pr.getDepartment());

        List<PaymentRequestPurchaseOrder> poLinks = paymentRequestPurchaseOrderRepository
                .findByPaymentRequestId(pr.getId());
        dto.setPoIds(poLinks.stream().map(PaymentRequestPurchaseOrder::getPoId).collect(Collectors.toList()));

        List<PaymentRequestWaybill> wbLinks = paymentRequestWaybillRepository
                .findByPaymentRequestId(pr.getId());
        List<Long> junctionWaybillIds = wbLinks.stream().map(PaymentRequestWaybill::getWaybillId).collect(Collectors.toList());

        List<Waybill> directWaybills = waybillRepository.findByPaymentRequestId(pr.getId());
        List<Long> directWaybillIds = directWaybills.stream().map(Waybill::getId).collect(Collectors.toList());

        List<Long> allWaybillIds = new ArrayList<>(junctionWaybillIds);
        for (Long id : directWaybillIds) {
            if (!allWaybillIds.contains(id)) {
                allWaybillIds.add(id);
            }
        }
        dto.setWaybillIds(allWaybillIds);

        List<CustomFee> fees = customFeeRepository.findByPaymentRequestId(pr.getId());
        dto.setCustomFees(fees.stream().map(fee -> new CustomFeeDTO(fee.getId(), fee.getFeeName(), fee.getFeeAmount()))
                .collect(Collectors.toList()));

        List<WarehouseReceipt> allReceipts = new ArrayList<>();
        Set<Long> seenReceiptIds = new HashSet<>();

        for (Long wbId : allWaybillIds) {
            List<WarehouseReceipt> wbReceipts = warehouseReceiptRepository.findAllByWaybillId(wbId);
            for (WarehouseReceipt r : wbReceipts) {
                if (seenReceiptIds.add(r.getId())) {
                    allReceipts.add(r);
                }
            }
        }

        List<Long> allPoIds = new ArrayList<>(dto.getPoIds());
        if (pr.getPoId() != null && !allPoIds.contains(pr.getPoId())) {
            allPoIds.add(pr.getPoId());
        }

        // Populate initiatorDepartment from first linked PO
        for (Long poId : allPoIds) {
            PurchaseOrder po = purchaseOrderRepository.findById(poId).orElse(null);
            if (po != null && po.getInitiatorDepartment() != null && !po.getInitiatorDepartment().isEmpty()) {
                dto.setInitiatorDepartment(po.getInitiatorDepartment());
                break;
            }
        }
        for (Long poId : allPoIds) {
            List<WarehouseReceipt> poReceipts = warehouseReceiptRepository.findAllByPoId(poId);
            for (WarehouseReceipt r : poReceipts) {
                if (seenReceiptIds.add(r.getId())) {
                    allReceipts.add(r);
                }
            }
        }

        dto.setWarehouseReceipts(allReceipts.stream().map(this::toWarehouseReceiptBrief).collect(Collectors.toList()));

        return dto;
    }

    private WarehouseReceiptDTO toWarehouseReceiptBrief(WarehouseReceipt r) {
        WarehouseReceiptDTO dto = new WarehouseReceiptDTO();
        dto.setId(r.getId());
        dto.setPoId(r.getPoId());
        dto.setReceivedQty(r.getReceivedQty());
        dto.setReceivedDate(r.getReceivedDate());
        dto.setInspector(r.getInspector());
        dto.setCondition(r.getCondition());
        dto.setStatus(r.getStatus());
        dto.setWaybillId(r.getWaybillId());
        dto.setWaybillCode(r.getWaybillCode());
        dto.setExpectedQty(r.getExpectedQty());
        dto.setGoodsCondition(r.getGoodsCondition());
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
        pr.setReason(dto.getReason());
        pr.setNote(dto.getNote());
        pr.setExchangeRateDiffVnd(dto.getExchangeRateDiffVnd());
        pr.setAdditionalShippingVnd(dto.getAdditionalShippingVnd());
        pr.setTotalAmountVnd(dto.getTotalAmountVnd());
        pr.setPaymentConfirmedAt(dto.getPaymentConfirmedAt());
        pr.setPaymentConfirmedBy(dto.getPaymentConfirmedBy());
        pr.setCreatedBy(dto.getCreatedBy());
        pr.setCreatedAt(dto.getCreatedAt());
        pr.setUpdatedAt(dto.getUpdatedAt());
        pr.setRejectedBy(dto.getRejectedBy());
        pr.setRejectedAt(dto.getRejectedAt());
        pr.setRejectReason(dto.getRejectReason());
        pr.setRejectedLevel(dto.getRejectedLevel());
        pr.setReferencePaymentRequestId(dto.getReferencePaymentRequestId());
        pr.setBankAccountId(dto.getBankAccountId());
        pr.setAccountingCheckedBy(dto.getAccountingCheckedBy());
        pr.setAccountingCheckedAt(dto.getAccountingCheckedAt());
        pr.setSourceDnttIds(dto.getSourceDnttIds());
        pr.setShipmentItems(dto.getShipmentItems());
        pr.setDepartment(dto.getDepartment());
        return pr;
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
            throw new IllegalStateException("Khong doc duoc danh sach file dinh kem", e);
        }
    }

    private String serializeAttachmentUrls(List<String> urls) {
        try {
            return objectMapper.writeValueAsString(urls);
        } catch (IOException e) {
            throw new IllegalStateException("Khong luu duoc danh sach file dinh kem", e);
        }
    }

    private String extractFirstNumber(String value) {
        if (value == null || value.isBlank()) return null;
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d+(?:[\\.,]\\d+)?");
        java.util.regex.Matcher matcher = pattern.matcher(value);
        if (!matcher.find()) {
            return null;
        }
        return matcher.group().replace(",", ".");
    }

}

package com.sgiprocurement.service;

import com.sgiprocurement.model.Waybill;
import com.sgiprocurement.model.PaymentRequestWaybill;
import com.sgiprocurement.dto.WaybillDTO;
import com.sgiprocurement.repository.WaybillRepository;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.repository.PaymentRequestRepository;
import com.sgiprocurement.repository.PaymentRequestWaybillRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WaybillService {

    @Autowired
    private WaybillRepository waybillRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private PaymentRequestRepository paymentRequestRepository;

    @Autowired
    private PaymentRequestWaybillRepository paymentRequestWaybillRepository;

    @Autowired
    private WarehouseReceiptService warehouseReceiptService;

    public List<WaybillDTO> getAllWaybills() {
        return waybillRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public WaybillDTO getWaybillById(Long id) {
        Waybill waybill = waybillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waybill not found with id: " + id));
        return convertToDTO(waybill);
    }

    public List<WaybillDTO> getWaybillsByPaymentRequestId(Long paymentRequestId) {
        return waybillRepository.findByPaymentRequestId(paymentRequestId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public WaybillDTO createWaybill(WaybillDTO dto) {
        Waybill waybill = convertToEntity(dto);
        if (waybill.getWaybillCode() == null || waybill.getWaybillCode().isBlank()) {
            long next = waybillRepository.count() + 1;
            waybill.setWaybillCode("WB-" + String.format("%04d", next));
        }
        Waybill saved = waybillRepository.save(waybill);

        if (saved.getPaymentRequestId() != null) {
            PaymentRequestWaybill link = new PaymentRequestWaybill();
            link.setPaymentRequestId(saved.getPaymentRequestId());
            link.setWaybillId(saved.getId());
            paymentRequestWaybillRepository.save(link);
        }

        updatePoStatusIfLinked(saved);

        return convertToDTO(saved);
    }

    public WaybillDTO updateWaybill(Long id, WaybillDTO dto) {
        Waybill waybill = waybillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waybill not found with id: " + id));
        waybill.setWaybillCode(dto.getWaybillCode());
        waybill.setCarrier(dto.getCarrier());
        waybill.setOrigin(dto.getOrigin());
        waybill.setDestination(dto.getDestination());
        waybill.setExpectedQty(dto.getExpectedQty());
        waybill.setActualQty(dto.getActualQty());
        waybill.setStatus(dto.getStatus());
        waybill.setNote(dto.getNote());
        Long oldPaymentRequestId = waybill.getPaymentRequestId();
        waybill.setPaymentRequestId(dto.getPaymentRequestId());
        waybill.setProducts(dto.getProducts());
        Waybill saved = waybillRepository.save(waybill);
        
        if (oldPaymentRequestId != null && !oldPaymentRequestId.equals(dto.getPaymentRequestId())) {
            List<PaymentRequestWaybill> oldLinks = paymentRequestWaybillRepository.findByPaymentRequestId(oldPaymentRequestId);
            oldLinks.stream()
                    .filter(l -> l.getWaybillId().equals(saved.getId()))
                    .findFirst()
                    .ifPresent(l -> paymentRequestWaybillRepository.delete(l));
        }
        
        if (dto.getPaymentRequestId() != null && (oldPaymentRequestId == null || !oldPaymentRequestId.equals(dto.getPaymentRequestId()))) {
            PaymentRequestWaybill link = new PaymentRequestWaybill();
            link.setPaymentRequestId(dto.getPaymentRequestId());
            link.setWaybillId(saved.getId());
            paymentRequestWaybillRepository.save(link);
        }
        
        // Update PO status if linked
        updatePoStatusIfLinked(saved);
        
        return convertToDTO(saved);
    }

    public void deleteWaybill(Long id) {
        Waybill waybill = waybillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waybill not found with id: " + id));

        if (waybill.getPaymentRequestId() != null) {
            List<PaymentRequestWaybill> links = paymentRequestWaybillRepository.findByPaymentRequestId(waybill.getPaymentRequestId());
            links.stream()
                    .filter(l -> l.getWaybillId().equals(id))
                    .findFirst()
                    .ifPresent(l -> paymentRequestWaybillRepository.delete(l));
        }

        waybillRepository.delete(waybill);
    }

    public List<WaybillDTO> searchByCode(String keyword) {
        return waybillRepository.findAll().stream()
                .filter(wb -> 
                    (wb.getWaybillCode() != null && wb.getWaybillCode().contains(keyword))
                    || (wb.getProducts() != null && wb.getProducts().toLowerCase().contains(keyword.toLowerCase()))
                )
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WaybillDTO confirmDelivery(Long id) {
        Waybill waybill = waybillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waybill not found with id: " + id));
        
        waybill.setStatus("DELIVERED");
        Waybill savedWaybill = waybillRepository.save(waybill);
        
        // Khi xác nhận giao hàng, cập nhật trạng thái PO sang SHIPPING nếu đang ở trạng thái trước đó
        updatePoStatusIfLinked(savedWaybill);
        
        // Tự động tạo phiếu nhập kho trạng thái PENDING để thủ kho xác nhận thủ công
        try {
            warehouseReceiptService.createFromWaybill(savedWaybill);
        } catch (Exception e) {
            System.err.println("Khong the tao phieu nhap kho pending cho waybill " + savedWaybill.getWaybillCode() + ": " + e.getMessage());
        }
        
        return convertToDTO(savedWaybill);
    }

    private void updatePoStatusIfLinked(Waybill waybill) {
        if (waybill.getPaymentRequestId() != null) {
            paymentRequestRepository.findById(waybill.getPaymentRequestId()).ifPresent(pr -> {
                purchaseOrderRepository.findById(pr.getPoId()).ifPresent(po -> {
                    // Nếu PO đang ở trạng thái APPROVED hoặc PENDING_SHIPPING, chuyển sang SHIPPING
                    if ("APPROVED".equals(po.getStatus()) || "PENDING_SHIPPING".equals(po.getStatus()) || "PAID".equals(po.getStatus()) || "IN_TRANSIT".equals(po.getStatus())) {
                        if (!"COMPLETED".equals(po.getStatus()) && !"SHIPPING".equals(po.getStatus())) {
                            po.setStatus("SHIPPING");
                            purchaseOrderRepository.save(po);
                        }
                    }
                });
            });
        }
    }

    private WaybillDTO convertToDTO(Waybill waybill) {
        List<PaymentRequestWaybill> links = paymentRequestWaybillRepository.findByWaybillId(waybill.getId());
        List<Long> prIds = links.stream().map(PaymentRequestWaybill::getPaymentRequestId).collect(Collectors.toList());
        if (waybill.getPaymentRequestId() != null && !prIds.contains(waybill.getPaymentRequestId())) {
            prIds.add(0, waybill.getPaymentRequestId());
        }
        return new WaybillDTO(
                waybill.getId(),
                waybill.getWaybillCode(),
                waybill.getCarrier(),
                waybill.getOrigin(),
                waybill.getDestination(),
                waybill.getExpectedQty(),
                waybill.getActualQty(),
                waybill.getStatus(),
                waybill.getNote(),
                waybill.getCreatedAt(),
                waybill.getUpdatedAt(),
                waybill.getPaymentRequestId(),
                waybill.getProducts(),
                prIds
        );
    }

    private Waybill convertToEntity(WaybillDTO dto) {
        Waybill waybill = new Waybill();
        waybill.setWaybillCode(dto.getWaybillCode());
        waybill.setCarrier(dto.getCarrier());
        waybill.setOrigin(dto.getOrigin());
        waybill.setDestination(dto.getDestination());
        waybill.setExpectedQty(dto.getExpectedQty());
        waybill.setActualQty(dto.getActualQty());
        waybill.setStatus(dto.getStatus());
        waybill.setNote(dto.getNote());
        waybill.setPaymentRequestId(dto.getPaymentRequestId());
        waybill.setProducts(dto.getProducts());
        return waybill;
    }
}

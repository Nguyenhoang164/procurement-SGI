package com.sgiprocurement.service;

import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.dto.PurchaseOrderDTO;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PurchaseOrderService {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private CostCalculatorService costCalculatorService;

    public List<PurchaseOrderDTO> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PurchaseOrderDTO getPurchaseOrderById(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        return convertToDTO(po);
    }

    public List<PurchaseOrderDTO> getPurchaseOrdersByStatus(String status) {
        return purchaseOrderRepository.findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PurchaseOrderDTO createPurchaseOrder(PurchaseOrderDTO dto) {
        PurchaseOrder po = convertToEntity(dto);
        po.setStatus("DRAFT");
        
        // Tính chi phí trước khi lưu
        costCalculatorService.calculateCosts(po);
        
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return convertToDTO(saved);
    }

    public PurchaseOrderDTO updatePurchaseOrder(Long id, PurchaseOrderDTO dto) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));

        po.setPosCode(dto.getPosCode());
        po.setOrderedQty(dto.getOrderedQty());
        po.setUnitPrice(dto.getUnitPrice());
        po.setCurrency(dto.getCurrency());
        po.setExchangeRate(dto.getExchangeRate());
        po.setDomesticShippingVnd(dto.getDomesticShippingVnd());
        po.setIntlShippingVnd(dto.getIntlShippingVnd());
        po.setOrderFeeVnd(dto.getOrderFeeVnd());
        po.setLocalDeliveryFeeVnd(dto.getLocalDeliveryFeeVnd());
        po.setDepositVnd(dto.getDepositVnd());

        // Tính lại chi phí
        costCalculatorService.calculateCosts(po);

        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    public void deletePurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        purchaseOrderRepository.delete(po);
    }

    private PurchaseOrderDTO convertToDTO(PurchaseOrder po) {
        return new PurchaseOrderDTO(
                po.getId(),
                po.getPosCode(),
                po.getOrderedQty(),
                po.getUnitPrice(),
                po.getCurrency(),
                po.getExchangeRate(),
                po.getDomesticShippingVnd(),
                po.getIntlShippingVnd(),
                po.getOrderFeeVnd(),
                po.getLocalDeliveryFeeVnd(),
                po.getTotalLotCostVnd(),
                po.getUnitCostFullVnd(),
                po.getRecentUnitPrice(),
                po.getSpec(),
                po.getCountry(),
                po.getShippingMethod(),
                po.getNote(),
                po.getDepositVnd(),
                po.getRemainingPaymentVnd(),
                po.getStatus(),
                po.getCreatedBy(),
                po.getCreatedAt(),
                po.getUpdatedAt()
        );
    }

    private PurchaseOrder convertToEntity(PurchaseOrderDTO dto) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(dto.getId());
        po.setPosCode(dto.getPosCode());
        po.setOrderedQty(dto.getOrderedQty());
        po.setUnitPrice(dto.getUnitPrice());
        po.setCurrency(dto.getCurrency());
        po.setExchangeRate(dto.getExchangeRate());
        po.setDomesticShippingVnd(dto.getDomesticShippingVnd());
        po.setIntlShippingVnd(dto.getIntlShippingVnd());
        po.setOrderFeeVnd(dto.getOrderFeeVnd());
        po.setLocalDeliveryFeeVnd(dto.getLocalDeliveryFeeVnd());
        po.setTotalLotCostVnd(dto.getTotalLotCostVnd());
        po.setUnitCostFullVnd(dto.getUnitCostFullVnd());
        po.setDepositVnd(dto.getDepositVnd());
        po.setRemainingPaymentVnd(dto.getRemainingPaymentVnd());
        po.setStatus(dto.getStatus());
        po.setCreatedBy(dto.getCreatedBy());
        po.setCreatedAt(dto.getCreatedAt());
        po.setUpdatedAt(dto.getUpdatedAt());
        po.setRecentUnitPrice(dto.getRecentUnitPrice());
        po.setSpec(dto.getSpec());
        po.setCountry(dto.getCountry());
        po.setShippingMethod(dto.getShippingMethod());
        po.setNote(dto.getNote());
        return po;
    }

}

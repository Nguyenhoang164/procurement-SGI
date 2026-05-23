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
        po.setStatus("PENDING");
        po.setPaymentStatus(null);
        
        // TĂ­nh chi phĂ­ trÆ°á»›c khi lÆ°u
        costCalculatorService.calculateCosts(po);
        
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return convertToDTO(saved);
    }

    public PurchaseOrderDTO approveL1(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        
        if (!"PENDING".equals(po.getStatus())) {
            throw new IllegalStateException("Chi duoc phe duyet don hang o trang thai PENDING");
        }

        po.setStatus("APPROVED");
        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    public PurchaseOrderDTO approveL2(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        
        if (!"PENDING".equals(po.getStatus()) && !"APPROVED".equals(po.getStatus())) {
            throw new IllegalStateException("Chi duoc phe duyet don hang o trang thai PENDING");
        }
        
        po.setStatus("APPROVED");
        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    public PurchaseOrderDTO reject(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        
        if (!"PENDING".equals(po.getStatus())) {
            throw new IllegalStateException("Chi duoc tu choi don hang o trang thai PENDING");
        }
        
        po.setStatus("REJECTED");
        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    public PurchaseOrderDTO updateStatus(Long id, String status) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        
        po.setStatus(status);
        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    public PurchaseOrderDTO updatePurchaseOrder(Long id, PurchaseOrderDTO dto) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));

        po.setPosCode(dto.getPosCode());
        po.setProductName(dto.getProductName());
        po.setProductShortCode(dto.getProductShortCode());
        po.setSupplierName(dto.getSupplierName());
        po.setOrderedQty(dto.getOrderedQty());
        po.setUnitPrice(dto.getUnitPrice());
        po.setCurrency(dto.getCurrency());
        po.setExchangeRate(dto.getExchangeRate());
        po.setDomesticShippingVnd(dto.getDomesticShippingVnd());
        po.setIntlShippingVnd(dto.getIntlShippingVnd());
        po.setInternationalShippingUnitPriceVnd(dto.getInternationalShippingUnitPriceVnd());
        po.setPackageMeasurement(dto.getPackageMeasurement());
        po.setOrderFeeVnd(dto.getOrderFeeVnd());
        po.setLocalDeliveryFeeVnd(dto.getLocalDeliveryFeeVnd());
        po.setSpec(dto.getSpec());
        po.setCountry(dto.getCountry());
        po.setShippingMethod(dto.getShippingMethod());
        po.setOrderDate(dto.getOrderDate());
        po.setExpectedWarehouseArrivalDate(dto.getExpectedWarehouseArrivalDate());
        po.setGoodsPaymentDate(dto.getGoodsPaymentDate());
        po.setFreightPaymentDate(dto.getFreightPaymentDate());
        po.setPaymentMethod(dto.getPaymentMethod());
        po.setNote(dto.getNote());
        po.setDepositVnd(dto.getDepositVnd());

        // TĂ­nh láº¡i chi phĂ­
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
        PurchaseOrderDTO dto = new PurchaseOrderDTO();
        dto.setId(po.getId());
        dto.setPosCode(po.getPosCode());
        dto.setProductName(po.getProductName());
        dto.setProductShortCode(po.getProductShortCode());
        dto.setSupplierName(po.getSupplierName());
        dto.setOrderedQty(po.getOrderedQty());
        dto.setUnitPrice(po.getUnitPrice());
        dto.setCurrency(po.getCurrency());
        dto.setExchangeRate(po.getExchangeRate());
        dto.setDomesticShippingVnd(po.getDomesticShippingVnd());
        dto.setIntlShippingVnd(po.getIntlShippingVnd());
        dto.setInternationalShippingUnitPriceVnd(po.getInternationalShippingUnitPriceVnd());
        dto.setPackageMeasurement(po.getPackageMeasurement());
        dto.setOrderFeeVnd(po.getOrderFeeVnd());
        dto.setLocalDeliveryFeeVnd(po.getLocalDeliveryFeeVnd());
        dto.setTotalLotCostVnd(po.getTotalLotCostVnd());
        dto.setTotalGoodsCostVnd(po.getTotalGoodsCostVnd());
        dto.setTotalGoodsAmount(po.getTotalGoodsAmount());
        dto.setUnitCostFullVnd(po.getUnitCostFullVnd());
        dto.setRecentUnitPrice(po.getRecentUnitPrice());
        dto.setSpec(po.getSpec());
        dto.setCountry(po.getCountry());
        dto.setShippingMethod(po.getShippingMethod());
        dto.setOrderDate(po.getOrderDate());
        dto.setExpectedWarehouseArrivalDate(po.getExpectedWarehouseArrivalDate());
        dto.setGoodsPaymentDate(po.getGoodsPaymentDate());
        dto.setFreightPaymentDate(po.getFreightPaymentDate());
        dto.setPaymentMethod(po.getPaymentMethod());
        dto.setNote(po.getNote());
        dto.setDepositVnd(po.getDepositVnd());
        dto.setRemainingPaymentVnd(po.getRemainingPaymentVnd());
        dto.setStatus(po.getStatus());
        dto.setPaymentStatus(po.getPaymentStatus());
        dto.setCreatedBy(po.getCreatedBy());
        dto.setCreatedAt(po.getCreatedAt());
        dto.setUpdatedAt(po.getUpdatedAt());
        return dto;
    }

    private PurchaseOrder convertToEntity(PurchaseOrderDTO dto) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(dto.getId());
        po.setPosCode(dto.getPosCode());
        po.setProductName(dto.getProductName());
        po.setProductShortCode(dto.getProductShortCode());
        po.setSupplierName(dto.getSupplierName());
        po.setOrderedQty(dto.getOrderedQty());
        po.setUnitPrice(dto.getUnitPrice());
        po.setCurrency(dto.getCurrency());
        po.setExchangeRate(dto.getExchangeRate());
        po.setDomesticShippingVnd(dto.getDomesticShippingVnd());
        po.setIntlShippingVnd(dto.getIntlShippingVnd());
        po.setInternationalShippingUnitPriceVnd(dto.getInternationalShippingUnitPriceVnd());
        po.setPackageMeasurement(dto.getPackageMeasurement());
        po.setOrderFeeVnd(dto.getOrderFeeVnd());
        po.setLocalDeliveryFeeVnd(dto.getLocalDeliveryFeeVnd());
        po.setTotalLotCostVnd(dto.getTotalLotCostVnd());
        po.setTotalGoodsCostVnd(dto.getTotalGoodsCostVnd());
        po.setTotalGoodsAmount(dto.getTotalGoodsAmount());
        po.setRecentUnitPrice(dto.getRecentUnitPrice());
        po.setSpec(dto.getSpec());
        po.setCountry(dto.getCountry());
        po.setShippingMethod(dto.getShippingMethod());
        po.setOrderDate(dto.getOrderDate());
        po.setExpectedWarehouseArrivalDate(dto.getExpectedWarehouseArrivalDate());
        po.setGoodsPaymentDate(dto.getGoodsPaymentDate());
        po.setFreightPaymentDate(dto.getFreightPaymentDate());
        po.setPaymentMethod(dto.getPaymentMethod());
        po.setNote(dto.getNote());
        po.setUnitCostFullVnd(dto.getUnitCostFullVnd());
        po.setDepositVnd(dto.getDepositVnd());
        po.setRemainingPaymentVnd(dto.getRemainingPaymentVnd());
        po.setPaymentStatus(dto.getPaymentStatus());
        po.setStatus(dto.getStatus());
        po.setCreatedBy(dto.getCreatedBy());
        po.setCreatedAt(dto.getCreatedAt());
        po.setUpdatedAt(dto.getUpdatedAt());
        return po;
    }

}


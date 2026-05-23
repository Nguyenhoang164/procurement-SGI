package com.sgiprocurement.service;

import com.sgiprocurement.model.WarehouseReceipt;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.dto.WarehouseReceiptDTO;
import com.sgiprocurement.dto.PendingReceiveDTO;
import com.sgiprocurement.dto.WarehouseReceiveRequest;
import com.sgiprocurement.repository.WarehouseReceiptRepository;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WarehouseReceiptService {

    @Autowired
    private WarehouseReceiptRepository warehouseReceiptRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductCostService productCostService;

    /**
     * Đơn đã thanh toán (payment_status = PAID) và chưa có phiếu nhận hàng.
     */
    public List<PendingReceiveDTO> getPendingReceives() {
        return purchaseOrderRepository.findByPaymentStatus("PAID").stream()
                .filter(po -> "IN_TRANSIT".equals(po.getStatus()))
                .filter(po -> !warehouseReceiptRepository.existsByPoId(po.getId()))
                .map(this::toPendingReceive)
                .collect(Collectors.toList());
    }

    public WarehouseReceiptDTO receiveGoods(WarehouseReceiveRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findById(request.getPoId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + request.getPoId()));

        if (!"PAID".equals(po.getPaymentStatus())) {
            throw new IllegalStateException("Đơn hàng chưa được kế toán xác nhận thanh toán (PAID)");
        }

        if (warehouseReceiptRepository.existsByPoId(po.getId())) {
            throw new IllegalStateException("Đơn hàng đã được nhận kho trước đó");
        }

        if (request.getReceivedQty() > po.getOrderedQty()) {
            throw new IllegalArgumentException("Số lượng nhận không được vượt quá số lượng đặt");
        }

        WarehouseReceipt receipt = new WarehouseReceipt();
        receipt.setPoId(po.getId());
        receipt.setReceivedQty(request.getReceivedQty());
        receipt.setReceivedDate(LocalDateTime.now());
        receipt.setInspector(request.getInspector());
        receipt.setCondition(request.getConditionDescription());
        receipt.setStatus("RECEIVED");

        WarehouseReceipt saved = warehouseReceiptRepository.save(receipt);

        po.setStatus("COMPLETED");
        purchaseOrderRepository.save(po);

        productCostService.applyReceiptFromPurchaseOrder(po, request.getReceivedQty());

        return convertToDTO(saved);
    }

    public List<WarehouseReceiptDTO> getAllWarehouseReceipts() {
        return warehouseReceiptRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public WarehouseReceiptDTO getWarehouseReceiptById(Long id) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found with id: " + id));
        return convertToDTO(receipt);
    }

    public WarehouseReceiptDTO getWarehouseReceiptByPoId(Long poId) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findByPoId(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found for po_id: " + poId));
        return convertToDTO(receipt);
    }

    public WarehouseReceiptDTO createWarehouseReceipt(WarehouseReceiptDTO dto) {
        WarehouseReceiveRequest request = new WarehouseReceiveRequest();
        request.setPoId(dto.getPoId());
        request.setReceivedQty(dto.getReceivedQty());
        request.setInspector(dto.getInspector());
        request.setConditionDescription(dto.getCondition());
        return receiveGoods(request);
    }

    public WarehouseReceiptDTO updateWarehouseReceipt(Long id, WarehouseReceiptDTO dto) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found with id: " + id));

        receipt.setReceivedQty(dto.getReceivedQty());
        receipt.setInspector(dto.getInspector());
        receipt.setCondition(dto.getCondition());
        receipt.setAttachments(dto.getAttachments());

        WarehouseReceipt updated = warehouseReceiptRepository.save(receipt);
        return convertToDTO(updated);
    }

    public void deleteWarehouseReceipt(Long id) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found with id: " + id));
        warehouseReceiptRepository.delete(receipt);
    }

    private PendingReceiveDTO toPendingReceive(PurchaseOrder po) {
        String productName = productRepository.findByPosCode(po.getPosCode())
                .map(Product::getProductName)
                .orElse(po.getPosCode());

        return new PendingReceiveDTO(
                po.getId(),
                "PO-" + po.getId(),
                po.getPosCode(),
                productName,
                po.getOrderedQty(),
                po.getShippingMethod(),
                po.getPaymentStatus()
        );
    }

    private WarehouseReceiptDTO convertToDTO(WarehouseReceipt receipt) {
        return new WarehouseReceiptDTO(
                receipt.getId(),
                receipt.getPoId(),
                receipt.getReceivedQty(),
                receipt.getReceivedDate(),
                receipt.getInspector(),
                receipt.getCondition(),
                receipt.getAttachments(),
                receipt.getStatus(),
                receipt.getCreatedAt(),
                receipt.getUpdatedAt()
        );
    }
}

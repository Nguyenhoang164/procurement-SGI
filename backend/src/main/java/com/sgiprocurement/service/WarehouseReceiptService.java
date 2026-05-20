package com.sgiprocurement.service;

import com.sgiprocurement.model.WarehouseReceipt;
import com.sgiprocurement.dto.WarehouseReceiptDTO;
import com.sgiprocurement.repository.WarehouseReceiptRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarehouseReceiptService {

    @Autowired
    private WarehouseReceiptRepository warehouseReceiptRepository;

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
        WarehouseReceipt receipt = convertToEntity(dto);
        receipt.setReceivedDate(LocalDateTime.now());
        receipt.setStatus("RECEIVED");
        WarehouseReceipt saved = warehouseReceiptRepository.save(receipt);
        return convertToDTO(saved);
    }

    public WarehouseReceiptDTO updateWarehouseReceipt(Long id, WarehouseReceiptDTO dto) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found with id: " + id));

        receipt.setPoId(dto.getPoId());
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

    private WarehouseReceipt convertToEntity(WarehouseReceiptDTO dto) {
        return new WarehouseReceipt(
                dto.getId(),
                dto.getPoId(),
                dto.getReceivedQty(),
                dto.getReceivedDate(),
                dto.getInspector(),
                dto.getCondition(),
                dto.getAttachments(),
                dto.getStatus(),
                dto.getCreatedAt(),
                dto.getUpdatedAt()
        );
    }

}

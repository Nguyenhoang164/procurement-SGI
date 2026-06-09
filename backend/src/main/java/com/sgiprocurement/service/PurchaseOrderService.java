package com.sgiprocurement.service;

import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.PurchaseOrderItem;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.dto.PurchaseOrderDTO;
import com.sgiprocurement.dto.PurchaseOrderItemDTO;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.repository.ExchangeRateConfigRepository;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.dto.PurchaseOrderImportResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PurchaseOrderService {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private CostCalculatorService costCalculatorService;

    @Autowired
    private ExchangeRateConfigRepository exchangeRateConfigRepository;

    @Autowired
    private ProductRepository productRepository;

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
        po.setStatus("PENDING_L1");
        po.setPaymentStatus(null);

        if (po.getExchangeRate() == null || po.getExchangeRate().compareTo(java.math.BigDecimal.ZERO) == 0) {
            fetchExchangeRate(po);
        }

        if (po.getItems() != null) {
            for (PurchaseOrderItem item : po.getItems()) {
                item.setPurchaseOrder(po);
                calculateItemAmounts(item);
            }
        }

        costCalculatorService.calculateCosts(po);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return convertToDTO(saved);
    }

    public PurchaseOrderDTO submitForApproval(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        if (!"DRAFT".equals(po.getStatus())) {
            throw new IllegalStateException("Chi co the gui duyet don hang o trang thai DRAFT");
        }
        po.setStatus("PENDING_L1");
        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    public PurchaseOrderDTO approveL1(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        if (!"PENDING_L1".equals(po.getStatus())) {
            throw new IllegalStateException("Chi duoc phe duyet don hang o trang thai PENDING_L1");
        }
        po.setStatus("APPROVED");
        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    public PurchaseOrderDTO sendToAccounting(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        if (!"APPROVED".equals(po.getStatus())) {
            throw new IllegalStateException("Chi co the gui ke toan don hang da duoc phe duyet");
        }
        po.setStatus("SENT_TO_ACCOUNTING");
        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    public PurchaseOrderDTO reject(Long id, String reason, String rejectedBy) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        if ("COMPLETED".equals(po.getStatus()) || "REJECTED".equals(po.getStatus())) {
            throw new IllegalStateException("Don hang da ket thuc, khong the tu choi");
        }
        po.setStatus("REJECTED");
        po.setRejectedBy(rejectedBy);
        po.setRejectedAt(LocalDateTime.now());
        po.setRejectReason(reason);
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
        String currentStatus = po.getStatus();

        po.setPoCode(dto.getPoCode());
        if (dto.getSourcePlanId() != null) {
            po.setSourcePlanId(dto.getSourcePlanId());
        }
        po.setPosCode(dto.getPosCode());
        po.setProductName(dto.getProductName());
        po.setProductShortCode(dto.getProductShortCode());
        po.setProductType(dto.getProductType());
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
        po.setInitiatorDepartment(dto.getInitiatorDepartment());
        po.setSourceType(dto.getSourceType());
        po.setCompletedAt(dto.getCompletedAt());
        po.setDepositVnd(dto.getDepositVnd());

        if (dto.getItems() != null) {
            po.getItems().clear();
            for (PurchaseOrderItemDTO itemDTO : dto.getItems()) {
                PurchaseOrderItem item = convertItemToEntity(itemDTO);
                item.setPurchaseOrder(po);
                calculateItemAmounts(item);
                po.getItems().add(item);
            }
        }

        costCalculatorService.calculateCosts(po);
        po.setStatus("REJECTED".equals(currentStatus) ? "PENDING_L1" : currentStatus);

        PurchaseOrder updated = purchaseOrderRepository.save(po);
        return convertToDTO(updated);
    }

    @Transactional
    public int importPurchaseOrders(List<PurchaseOrderDTO> orders) {
        int count = 0;
        for (PurchaseOrderDTO dto : orders) {
            PurchaseOrder po = convertToEntity(dto);
            if (po.getStatus() == null) po.setStatus("COMPLETED");
            if (po.getCreatedAt() == null) po.setCreatedAt(java.time.LocalDateTime.now());
            po.setUpdatedAt(java.time.LocalDateTime.now());

            if (po.getItems() != null) {
                for (PurchaseOrderItem item : po.getItems()) {
                    item.setPurchaseOrder(po);
                    calculateItemAmounts(item);
                }
            }

            costCalculatorService.calculateCosts(po);
            purchaseOrderRepository.save(po);
            count++;
        }
        return count;
    }

    @Transactional
    public PurchaseOrderImportResult importFromExcel(MultipartFile file) {
        PurchaseOrderImportResult result = new PurchaseOrderImportResult();

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, PurchaseOrderDTO> orderMap = new LinkedHashMap<>();
            int rowCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                rowCount++;

                String poCode = getCellStringValue(row.getCell(0));
                if (poCode.isEmpty()) {
                    result.addError("Dòng " + (i + 1) + ": Thiếu Mã Phiếu DXNH");
                    continue;
                }

                try {
                    PurchaseOrderDTO order = orderMap.computeIfAbsent(poCode, k -> {
                        PurchaseOrderDTO dto = new PurchaseOrderDTO();
                        dto.setPoCode(poCode);
                        dto.setStatus("COMPLETED");
                        dto.setPaymentStatus("CONFIRMED");
                        dto.setCreatedBy(getCellStringValue(row.getCell(4)));
                        dto.setItems(new ArrayList<>());
                        return dto;
                    });

                    if (order.getCreatedAt() == null) {
                        order.setCreatedAt(parseDateTime(getCellStringValue(row.getCell(2))));
                    }
                    if (order.getCompletedAt() == null) {
                        order.setCompletedAt(parseDateTime(getCellStringValue(row.getCell(3))));
                    }
                    if (order.getInitiatorDepartment() == null) {
                        order.setInitiatorDepartment(getCellStringValue(row.getCell(5)));
                    }
                    if (order.getSourceType() == null) {
                        order.setSourceType(getCellStringValue(row.getCell(6)));
                    }
                    if (order.getExchangeRate() == null) {
                        order.setExchangeRate(parseBigDecimal(getCellStringValue(row.getCell(7))));
                    }
                    if (order.getCurrency() == null) {
                        order.setCurrency(getCellStringValue(row.getCell(8)));
                    }

                    PurchaseOrderItemDTO item = new PurchaseOrderItemDTO();
                    item.setProductName(getCellStringValue(row.getCell(9)));
                    item.setSpec(getCellStringValue(row.getCell(10)));
                    item.setNote(getCellStringValue(row.getCell(11)));
                    item.setOrderedQty(parseInteger(getCellStringValue(row.getCell(12))));
                    item.setUnitPrice(parseBigDecimal(getCellStringValue(row.getCell(13))));
                    item.setTotalAmountVnd(parseBigDecimal(getCellStringValue(row.getCell(14))));
                    item.setCurrency(order.getCurrency());
                    item.setExchangeRate(order.getExchangeRate());

                    order.getItems().add(item);

                } catch (Exception e) {
                    result.addError("Dòng " + (i + 1) + ": Lỗi xử lý - " + e.getMessage());
                }
            }

            result.setTotalRows(rowCount);
            result.setTotalOrders(orderMap.size());

            int success = 0;
            for (PurchaseOrderDTO dto : orderMap.values()) {
                try {
                    if (dto.getItems() == null || dto.getItems().isEmpty()) {
                        result.addError("Đơn hàng " + dto.getPoCode() + ": Không có sản phẩm nào");
                        continue;
                    }
                    importPurchaseOrders(List.of(dto));
                    success++;
                } catch (Exception e) {
                    result.addError("Đơn hàng " + dto.getPoCode() + ": " + e.getMessage());
                }
            }

            result.setSuccessCount(success);
            result.setErrorCount(rowCount - success);

        } catch (Exception e) {
            result.addError("Lỗi đọc file Excel: " + e.getMessage());
        }

        return result;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Integer.parseInt(value.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        value = value.trim();
        String[] patterns = {"yyyy-MM-dd HH:mm:ss", "dd/MM/yyyy HH:mm:ss", "yyyy-MM-dd", "dd/MM/yyyy"};
        for (String pattern : patterns) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
                if (pattern.length() <= 10) {
                    return LocalDate.parse(value, formatter).atStartOfDay();
                }
                return LocalDateTime.parse(value, formatter);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    public void deletePurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        purchaseOrderRepository.delete(po);
    }

    private void calculateItemAmounts(PurchaseOrderItem item) {
        if (item.getUnitPrice() != null && item.getOrderedQty() != null) {
            java.math.BigDecimal qty = new java.math.BigDecimal(item.getOrderedQty());
            item.setTotalAmountForeign(item.getUnitPrice().multiply(qty));
            java.math.BigDecimal rate = item.getExchangeRate() != null ? item.getExchangeRate() : java.math.BigDecimal.ONE;
            item.setTotalAmountVnd(item.getTotalAmountForeign().multiply(rate).setScale(0, java.math.RoundingMode.HALF_UP));
        }
    }

    private void fetchExchangeRate(PurchaseOrder po) {
        if (po.getCurrency() != null) {
            exchangeRateConfigRepository.findByCurrency(po.getCurrency())
                    .ifPresent(config -> po.setExchangeRate(config.getRate()));
        }
    }

    public List<PurchaseOrderDTO> searchByKeyword(String keyword) {
        return purchaseOrderRepository.findAll().stream()
                .filter(po -> (po.getPoCode() != null && po.getPoCode().contains(keyword))
                        || (po.getPosCode() != null && po.getPosCode().contains(keyword)))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private PurchaseOrderDTO convertToDTO(PurchaseOrder po) {
        PurchaseOrderDTO dto = new PurchaseOrderDTO();
        dto.setId(po.getId());
        dto.setPoCode(po.getPoCode());
        dto.setSourcePlanId(po.getSourcePlanId());
        dto.setPosCode(po.getPosCode());
        dto.setProductName(po.getProductName());
        dto.setProductShortCode(po.getProductShortCode());
        dto.setProductType(po.getProductType());
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
        dto.setLanding(po.getLanding());
        dto.setSpec(po.getSpec());
        dto.setCountry(po.getCountry());
        dto.setShippingMethod(po.getShippingMethod());
        dto.setOrderDate(po.getOrderDate());
        dto.setExpectedWarehouseArrivalDate(po.getExpectedWarehouseArrivalDate());
        dto.setGoodsPaymentDate(po.getGoodsPaymentDate());
        dto.setFreightPaymentDate(po.getFreightPaymentDate());
        dto.setPaymentMethod(po.getPaymentMethod());
        dto.setNote(po.getNote());
        dto.setInitiatorDepartment(po.getInitiatorDepartment());
        dto.setSourceType(po.getSourceType());
        dto.setCompletedAt(po.getCompletedAt());
        dto.setDepositVnd(po.getDepositVnd());
        dto.setRemainingPaymentVnd(po.getRemainingPaymentVnd());
        dto.setStatus(po.getStatus());
        dto.setRejectedBy(po.getRejectedBy());
        dto.setRejectedAt(po.getRejectedAt());
        dto.setRejectReason(po.getRejectReason());
        dto.setPaymentStatus(po.getPaymentStatus());
        dto.setCreatedBy(po.getCreatedBy());
        dto.setCreatedAt(po.getCreatedAt());
        dto.setUpdatedAt(po.getUpdatedAt());
        if (po.getItems() != null) {
            dto.setItems(po.getItems().stream().map(this::convertItemToDTO).collect(Collectors.toList()));
        } else {
            dto.setItems(Collections.emptyList());
        }
        return dto;
    }

    private PurchaseOrder convertToEntity(PurchaseOrderDTO dto) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(dto.getId());
        po.setPoCode(dto.getPoCode());
        po.setSourcePlanId(dto.getSourcePlanId());
        po.setPosCode(dto.getPosCode());
        po.setProductName(dto.getProductName());
        po.setProductShortCode(dto.getProductShortCode());
        po.setProductType(dto.getProductType());
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
        po.setLanding(dto.getLanding());
        po.setSpec(dto.getSpec());
        po.setCountry(dto.getCountry());
        po.setShippingMethod(dto.getShippingMethod());
        po.setOrderDate(dto.getOrderDate());
        po.setExpectedWarehouseArrivalDate(dto.getExpectedWarehouseArrivalDate());
        po.setGoodsPaymentDate(dto.getGoodsPaymentDate());
        po.setFreightPaymentDate(dto.getFreightPaymentDate());
        po.setPaymentMethod(dto.getPaymentMethod());
        po.setNote(dto.getNote());
        po.setInitiatorDepartment(dto.getInitiatorDepartment());
        po.setSourceType(dto.getSourceType());
        po.setCompletedAt(dto.getCompletedAt());
        po.setUnitCostFullVnd(dto.getUnitCostFullVnd());
        po.setDepositVnd(dto.getDepositVnd());
        po.setRemainingPaymentVnd(dto.getRemainingPaymentVnd());
        po.setPaymentStatus(dto.getPaymentStatus());
        po.setStatus(dto.getStatus());
        po.setCreatedBy(dto.getCreatedBy());
        po.setCreatedAt(dto.getCreatedAt());
        po.setUpdatedAt(dto.getUpdatedAt());
        if (dto.getItems() != null) {
            po.setItems(dto.getItems().stream().map(itemDTO -> {
                PurchaseOrderItem item = convertItemToEntity(itemDTO);
                item.setPurchaseOrder(po);
                return item;
            }).collect(Collectors.toList()));
        }
        return po;
    }

    private PurchaseOrderItemDTO convertItemToDTO(PurchaseOrderItem item) {
        PurchaseOrderItemDTO dto = new PurchaseOrderItemDTO();
        dto.setId(item.getId());
        dto.setPosCode(item.getPosCode());
        dto.setProductName(item.getProductName());
        dto.setProductShortCode(item.getProductShortCode());
        dto.setProductType(item.getProductType());
        dto.setOrderedQty(item.getOrderedQty());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setCurrency(item.getCurrency());
        dto.setExchangeRate(item.getExchangeRate());
        dto.setTotalAmountForeign(item.getTotalAmountForeign());
        dto.setTotalAmountVnd(item.getTotalAmountVnd());
        dto.setSpec(item.getSpec());
        dto.setNote(item.getNote());
        dto.setSourceLink(item.getSourceLink());
        populateCostFromProduct(dto, item.getPosCode());
        return dto;
    }

    private PurchaseOrderItem convertItemToEntity(PurchaseOrderItemDTO dto) {
        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setId(dto.getId());
        item.setPosCode(dto.getPosCode());
        item.setProductName(dto.getProductName());
        item.setProductShortCode(dto.getProductShortCode());
        item.setProductType(dto.getProductType());
        item.setOrderedQty(dto.getOrderedQty());
        item.setUnitPrice(dto.getUnitPrice());
        item.setCurrency(dto.getCurrency());
        item.setExchangeRate(dto.getExchangeRate());
        item.setTotalAmountForeign(dto.getTotalAmountForeign());
        item.setTotalAmountVnd(dto.getTotalAmountVnd());
        item.setSpec(dto.getSpec());
        item.setNote(dto.getNote());
        item.setSourceLink(dto.getSourceLink());
        item.setWeightedAvgCostVnd(dto.getWeightedAvgCostVnd());
        item.setLatestUnitCostVnd(dto.getLatestUnitCostVnd());
        item.setLatestOrderCode(dto.getLatestOrderCode());
        item.setLatestCostDate(dto.getLatestCostDate());
        return item;
    }

    private void populateCostFromProduct(PurchaseOrderItemDTO dto, String posCode) {
        if (posCode == null) return;
        try {
            Product product = productRepository.findByPosCode(posCode).orElse(null);
            if (product != null) {
                if (dto.getWeightedAvgCostVnd() == null) dto.setWeightedAvgCostVnd(product.getWeightedAvgCostVnd());
                if (dto.getLatestUnitCostVnd() == null) dto.setLatestUnitCostVnd(product.getLatestUnitCostVnd());
                if (dto.getLatestOrderCode() == null) dto.setLatestOrderCode(product.getLatestOrderCode());
                if (dto.getLatestCostDate() == null) dto.setLatestCostDate(product.getLatestCostDate());
            }
        } catch (Exception e) {
            // silently ignore â€” cost fields are optional reference data
        }
    }

}






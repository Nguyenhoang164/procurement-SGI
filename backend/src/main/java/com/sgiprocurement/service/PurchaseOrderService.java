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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
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

        if (po.getExchangeRate() != null && po.getExchangeRate().compareTo(java.math.BigDecimal.ONE) == 0 && po.getCurrency() != null) {
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

        if (po.getExchangeRate() != null && po.getExchangeRate().compareTo(java.math.BigDecimal.ONE) == 0 && po.getCurrency() != null) {
            fetchExchangeRate(po);
        }

        if (dto.getItems() != null) {
            po.getItems().clear();
            for (PurchaseOrderItemDTO itemDTO : dto.getItems()) {
                PurchaseOrderItem item = convertItemToEntity(itemDTO);
                item.setExchangeRate(po.getExchangeRate());
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
            PurchaseOrder existing = null;
            if (dto.getPoCode() != null && !dto.getPoCode().isEmpty()) {
                existing = purchaseOrderRepository.findByPoCode(dto.getPoCode()).orElse(null);
            }
            PurchaseOrder po = convertToEntity(dto);
            if (existing != null) {
                po.setId(existing.getId());
                if (po.getCreatedAt() == null) po.setCreatedAt(existing.getCreatedAt());
            }
            if (po.getCreatedAt() == null) po.setCreatedAt(java.time.LocalDateTime.now());
            po.setUpdatedAt(java.time.LocalDateTime.now());
            if (po.getStatus() == null) po.setStatus("COMPLETED");

            if (po.getExchangeRate() != null && po.getExchangeRate().compareTo(java.math.BigDecimal.ONE) == 0 && po.getCurrency() != null) {
                fetchExchangeRate(po);
            }

            if (po.getItems() != null) {
                for (PurchaseOrderItem item : po.getItems()) {
                    item.setExchangeRate(po.getExchangeRate());
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

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public PurchaseOrderImportResult importFromExcel(MultipartFile file) {
        PurchaseOrderImportResult result = new PurchaseOrderImportResult();

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                result.addError("File Excel không có dòng tiêu đề");
                return result;
            }

            Map<String, Integer> colMap = new HashMap<>();
            for (int c = 0; c <= headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                if (cell == null) continue;
                String header = getCellStringValue(cell)
                        .toLowerCase()
                        .replace(" ", "")
                        .replace("（", "(")
                        .replace("）", ")")
                        .replace("：", ":");
                colMap.put(header, c);
            }

            int colOrderDate = findCol(colMap, "submittedat", "ngày đặt hàng", "ngaydathang", "order_date", "orderdate", "ngày đặt", "submitted_at");
            int colCompletedAt = findCol(colMap, "completedat", "ngày thanh toán", "thờigianhoànthành", "completed_at");
            int colRequester = findCol(colMap, "requester", "ngườitạo", "người tạo", "created_by", "createdby");
            int colDepartment = findCol(colMap, "initiatordepartment", "phòngban", "phòng ban thực hiện", "department", "initiator_department");
            int colSourceType = findCol(colMap, "nguồnnhập", "nguồn nhập", "sourcetype", "source_type", "nguonnhap");
            int colExchangeRate = findCol(colMap, "tỷgiá", "tỉ giá ngày tt", "tỷ giá", "tygia", "exchange_rate", "exchangeRate", "tỉgiá", "tỉ giá");
            int colCurrency = findCol(colMap, "tỷgiá-currency", "loạiđơnvịtiềntệ", "loại tiền tệ", "currency", "loạiđơnvịtiềntệ", "loại tiền", "tiente", "tỷ giá - currency");
            int colProductName = findCol(colMap, "chitiết_hànghóa_tênsảnphẩm_chuẩnhóa", "tênsảnphẩm", "tên sản phẩm", "product_name", "productname", "dev_product_name", "devproductname");
            int colSpec = findCol(colMap, "chitiết_hànghóa_đơnvịđo", "đơnvịđo", "đơn vị đo", "quy cách", "quycách", "spec", "đvt");
            int colNote = findCol(colMap, "chitiết_hànghoá_diễngiảithêmlýdo", "diễngiảithêmlýdo", "ghichú", "ghi chú", "note", "dienthaikthem");
            int colQty = findCol(colMap, "chitiết_hànghoá_sốlượng", "sốlượng", "số lượng", "sl đặt(pcs)", "sldặt", "quantity", "ordered_qty", "orderedqty", "soluong");
            int colUnitPrice = findCol(colMap, "chitiết_giánhập1sp", "đơngiánhập(theocộtf)", "đơngiá", "đơn giá nhập", "giánhập1sp", "đơngiá", "đơn giá", "unit_price", "unitprice", "gianhap");
            int colTotalVnd = findCol(colMap, "tiềnhànghoá(vnd)", "tổng tiền hàng (vnd)", "tiềnhànhhoávnd", "quyđổivnd", "quy đổi vnd", "total_vnd", "totalamountvnd", "tienhangvnd");
            int colDomesticShipping = findCol(colMap, "vc nội địatq/vn (vnđ)", "vc nội địa", "vcnộiđịa", "domestic_shipping_vnd", "domesticshippingvnd");
            int colShippingMethod = findCol(colMap, "hìnhthức vận chuyển", "hình thức vc", "hìnhthứcvc", "hìnhthức vận tải", "shipping_method", "shippingmethod");

            List<PurchaseOrderDTO> orders = new ArrayList<>();
            int rowCount = 0;
            int seq = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                rowCount++;

                try {
                    String poCode = "IMP-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + String.format("%03d", ++seq);
                    PurchaseOrderDTO order = new PurchaseOrderDTO();
                    order.setPoCode(poCode);
                    order.setStatus("COMPLETED");
                    order.setPaymentStatus("PAID");
                    order.setItems(new ArrayList<>());

                    String requester = colRequester >= 0 ? getCellStringValue(row.getCell(colRequester)) : "";
                    order.setCreatedBy(requester.isEmpty() ? "unkown" : requester);

                    String dept = colDepartment >= 0 ? getCellStringValue(row.getCell(colDepartment)) : "";
                    order.setInitiatorDepartment(dept.isEmpty() ? "unkown" : dept);

                    if (colOrderDate >= 0) {
                        Cell cell = row.getCell(colOrderDate);
                        LocalDate date = getCellDate(cell);
                        if (date != null) {
                            order.setOrderDate(date);
                            order.setCreatedAt(date.atStartOfDay());
                        } else {
                            LocalDateTime dt = parseDateTime(getCellStringValue(cell));
                            if (dt != null) {
                                order.setOrderDate(dt.toLocalDate());
                                order.setCreatedAt(dt);
                            }
                        }
                    }
                    if (colCompletedAt >= 0) {
                        order.setCompletedAt(parseDateTime(getCellStringValue(row.getCell(colCompletedAt))));
                    }
                    if (colSourceType >= 0) {
                        order.setSourceType(getCellStringValue(row.getCell(colSourceType)));
                    }
                    if (colExchangeRate >= 0) {
                        BigDecimal rate = parseBigDecimal(getCellStringValue(row.getCell(colExchangeRate)));
                        if (rate != null) order.setExchangeRate(rate);
                    }
                    if (colCurrency >= 0) {
                        String val = getCellStringValue(row.getCell(colCurrency));
                        if (!val.isEmpty()) order.setCurrency(val);
                    }

                    if (colDomesticShipping >= 0) {
                        BigDecimal ds = parseBigDecimal(getCellStringValue(row.getCell(colDomesticShipping)));
                        if (ds != null) order.setDomesticShippingVnd(ds);
                    }
                    if (colShippingMethod >= 0) {
                        order.setShippingMethod(getCellStringValue(row.getCell(colShippingMethod)));
                    }

                    PurchaseOrderItemDTO item = new PurchaseOrderItemDTO();
                    String productName = colProductName >= 0 ? getCellStringValue(row.getCell(colProductName)) : "";
                    item.setProductName(productName.isEmpty() ? "N/A" : productName);
                    String searchName = productName.contains(" - ") ? productName.substring(0, productName.indexOf(" - ")).trim() : productName;
                    String itemPosCode = lookupProductPosCode(searchName);
                    item.setPosCode(itemPosCode != null ? itemPosCode : "N/A");

                    String specVal = colSpec >= 0 ? getCellStringValue(row.getCell(colSpec)) : "";
                    item.setSpec(specVal.isEmpty() ? "pcs" : specVal);
                    if (colNote >= 0) item.setNote(getCellStringValue(row.getCell(colNote)));
                    Integer qty = colQty >= 0 ? parseInteger(getCellStringValue(row.getCell(colQty))) : null;
                    item.setOrderedQty(qty != null ? qty : 0);
                    if (colUnitPrice >= 0) item.setUnitPrice(parseBigDecimal(getCellStringValue(row.getCell(colUnitPrice))));
                    if (colTotalVnd >= 0) item.setTotalAmountVnd(parseBigDecimal(getCellStringValue(row.getCell(colTotalVnd))));
                    item.setCurrency(order.getCurrency());
                    item.setExchangeRate(order.getExchangeRate());

                    order.getItems().add(item);
                    orders.add(order);

                } catch (Exception e) {
                    result.addError("Dòng " + (i + 1) + ": Lỗi xử lý - " + e.getMessage());
                }
            }

            result.setTotalRows(rowCount);
            result.setTotalOrders(orders.size());

            int success = 0;
            for (PurchaseOrderDTO dto : orders) {
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

    private String lookupProductPosCode(String name) {
        if (name == null || name.isEmpty()) return null;
        try {
            Optional<Product> exact = productRepository.findByProductName(name);
            if (exact.isPresent()) return exact.get().getPosCode();
            List<Product> matches = productRepository.findByProductNameContainingIgnoreCase(name);
            if (!matches.isEmpty()) return matches.get(0).getPosCode();
        } catch (Exception ignored) {}
        return null;
    }

    private LocalDate getCellDate(Cell cell) {
        if (cell == null) return null;
        try {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant()
                    .atZone(java.time.ZoneId.systemDefault())
                    .toLocalDate();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private int findCol(Map<String, Integer> colMap, String... names) {
        for (String name : names) {
            Integer idx = colMap.get(name);
            if (idx != null) return idx;
        }
        return -1;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(cell.getDateCellValue());
        }
        if (cell.getCellType() == CellType.FORMULA) {
            try {
                return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(cell.getDateCellValue());
            } catch (Exception e) {
                try {
                    double val = cell.getNumericCellValue();
                    if (val == Math.floor(val) && !Double.isInfinite(val)) {
                        return String.valueOf((long) val);
                    }
                    return String.valueOf(val);
                } catch (Exception e2) {
                    try {
                        return cell.getStringCellValue().trim();
                    } catch (Exception e3) {
                        return "";
                    }
                }
            }
        }
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
        String[] patterns = {
            "yyyy-MM-dd HH:mm:ss", "dd/MM/yyyy HH:mm:ss",
            "yyyy/M/d h:mm:ss a", "yyyy/M/d H:mm:ss",
            "d/M/yyyy h:mm:ss a", "d/M/yyyy H:mm:ss",
            "M/d/yyyy h:mm:ss a", "M/d/yyyy H:mm:ss",
            "yyyy-MM-dd", "dd/MM/yyyy", "yyyy/M/d", "d/M/yyyy", "M/d/yyyy"
        };
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
            java.math.BigDecimal amountForeign = item.getUnitPrice().multiply(qty);
            if (item.getTotalAmountForeign() == null || item.getTotalAmountForeign().compareTo(java.math.BigDecimal.ZERO) == 0) {
                item.setTotalAmountForeign(amountForeign);
            }
            java.math.BigDecimal rate = item.getExchangeRate() != null ? item.getExchangeRate() : java.math.BigDecimal.ONE;
            if (item.getTotalAmountVnd() == null || item.getTotalAmountVnd().compareTo(java.math.BigDecimal.ZERO) == 0) {
                item.setTotalAmountVnd(amountForeign.multiply(rate).setScale(0, java.math.RoundingMode.HALF_UP));
            }
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
        item.setPosCode(dto.getPosCode() != null ? dto.getPosCode() : "N/A");
        item.setProductName(dto.getProductName());
        item.setProductShortCode(dto.getProductShortCode());
        item.setProductType(dto.getProductType());
        item.setOrderedQty(dto.getOrderedQty() != null ? dto.getOrderedQty() : 0);
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






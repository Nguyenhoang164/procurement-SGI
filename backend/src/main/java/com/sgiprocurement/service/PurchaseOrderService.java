package com.sgiprocurement.service;

import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.PurchaseOrderItem;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.model.User;
import com.sgiprocurement.dto.PurchaseOrderDTO;
import com.sgiprocurement.dto.PurchaseOrderItemDTO;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.repository.ExchangeRateConfigRepository;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.repository.UserRepository;
import com.sgiprocurement.repository.PaymentRequestPurchaseOrderRepository;
import com.sgiprocurement.repository.PaymentRequestRepository;
import com.sgiprocurement.repository.WarehouseReceiptRepository;
import com.sgiprocurement.repository.WarehouseReceiptItemRepository;
import com.sgiprocurement.repository.CostCommentRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.dto.PurchaseOrderImportResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    private ProductCostService productCostService;

    @Autowired
    private UserRepository userRepository;

    public List<PurchaseOrderDTO> getAllPurchaseOrders(String department) {
        String role = getCurrentUserRole();
        String userDept = getCurrentUserDepartment();
        List<PurchaseOrder> list;
        if (isDepartmentRestricted(role) && userDept != null && !userDept.isEmpty()) {
            list = purchaseOrderRepository.findByInitiatorDepartmentWithItems(userDept);
        } else if (department != null && !department.isEmpty()) {
            list = purchaseOrderRepository.findByInitiatorDepartmentWithItems(department);
        } else {
            list = purchaseOrderRepository.findAllWithItems();
        }

        Map<String, Product> productCache = buildProductCache(list);
        return list.stream()
                .map(po -> convertToDTO(po, productCache))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getAllPurchaseOrdersPaged(String department, int page, int size,
            LocalDateTime startDate, LocalDateTime endDate) {
        String role = getCurrentUserRole();
        String userDept = getCurrentUserDepartment();
        Pageable pageable = PageRequest.of(page, size);
        Page<PurchaseOrder> poPage;

        boolean hasDateRange = startDate != null && endDate != null;
        String effectiveDept = null;
        if (isDepartmentRestricted(role) && userDept != null && !userDept.isEmpty()) {
            effectiveDept = userDept;
        } else if (department != null && !department.isEmpty()) {
            effectiveDept = department;
        }

        if (hasDateRange && effectiveDept != null) {
            poPage = purchaseOrderRepository.findByInitiatorDepartmentAndCreatedAtBetweenPaged(effectiveDept, startDate, endDate, pageable);
        } else if (hasDateRange) {
            poPage = purchaseOrderRepository.findAllByCreatedAtBetweenPaged(startDate, endDate, pageable);
        } else if (effectiveDept != null) {
            poPage = purchaseOrderRepository.findByInitiatorDepartmentWithItemsPaged(effectiveDept, pageable);
        } else {
            poPage = purchaseOrderRepository.findAllWithItemsPaged(pageable);
        }

        Map<String, Product> productCache = buildProductCache(poPage.getContent());
        List<PurchaseOrderDTO> orders = poPage.getContent().stream()
                .map(po -> convertToDTO(po, productCache))
                .collect(Collectors.toList());

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("orders", orders);
        result.put("total", poPage.getTotalElements());
        result.put("page", page);
        result.put("size", size);
        return result;
    }

    private Map<String, Product> buildProductCache(List<PurchaseOrder> pos) {
        Set<String> posCodes = pos.stream()
                .filter(po -> po.getItems() != null)
                .flatMap(po -> po.getItems().stream())
                .map(item -> item.getPosCode())
                .filter(code -> code != null && !code.isEmpty())
                .collect(Collectors.toSet());
        if (posCodes.isEmpty()) return Collections.emptyMap();
        return productRepository.findByPosCodeIn(new ArrayList<>(posCodes)).stream()
                .filter(p -> p.getPosCode() != null)
                .collect(Collectors.toMap(Product::getPosCode, p -> p, (a, b) -> a));
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
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);

        PurchaseOrder po = convertToEntity(dto);
        po.setStatus("PENDING_L1");
        po.setPaymentStatus(null);
        po.setCreatedBy(username);
        if (po.getInitiatorDepartment() == null || po.getInitiatorDepartment().isEmpty()) {
            po.setInitiatorDepartment(currentUser != null ? currentUser.getDepartment() : null);
        }

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
            PurchaseOrder savedPo = purchaseOrderRepository.save(po);
            productCostService.applyCostsFromImport(savedPo);
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
            if (headerRow == null || isRowNumeric(headerRow)) {
                Row fallback = sheet.getRow(1);
                if (fallback != null && !isRowNumeric(fallback)) {
                    headerRow = fallback;
                }
            }
            if (headerRow == null) {
                result.addError("File Excel không có dòng tiêu đề");
                return result;
            }

            Map<String, Integer> colMap = new HashMap<>();
            for (int c = 0; c <= headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                if (cell == null) continue;
                String raw = getCellStringValue(cell);
                String header = raw
                        .toLowerCase()
                        .replace(" ", "")
                        .replace("\n", "").replace("\r", "")
                        .replace("（", "(")
                        .replace("）", ")")
                        .replace("：", ":")
                        .replaceAll("[（(][^）)]*[）)]", "");
                colMap.put(header, c);
            }

            int colOrderDate = findCol(colMap, "ngàyđặthàng", "ngày đặt hàng", "ngaydathang", "order_date", "orderdate", "submittedat", "submitted_at");
            int colCompletedAt = findCol(colMap, "ngàythanhtoán", "ngàythanhtoántiềnhàng", "completedat", "thờigianhoànthành", "completed_at");
            int colRequester = findCol(colMap, "requester", "ngườicheck", "ngườitạo", "created_by", "createdby");
            int colDepartment = findCol(colMap, "initiatordepartment", "phòngban", "phòng ban thực hiện", "department", "initiator_department");
            int colSourceType = findCol(colMap, "nguồnnhập", "nguồn nhập", "sourcetype", "source_type", "nguonnhap");
            int colExchangeRate = findCol(colMap, "tỉgiángàytt", "tỷgiá", "tỉ giá ngày tt", "tỷ giá", "tygia", "exchange_rate", "exchangeRate");
            int colCurrency = findCol(colMap, "loạitiềntệ", "tỷgiá-currency", "loạiđơnvịtiềntệ", "loại tiền tệ", "currency", "loại tiền", "tiente");
            int colProductName = findCol(colMap, "mãsptrênpos", "mã sp trên pos");
            int colSpec = findCol(colMap, "chitiết_hànghóa_đơnvịđo", "đơnvịđo", "đơn vị đo", "quy cách", "quycách", "spec", "đvt");
            int colNote = findCol(colMap, "ghichú", "chitiết_hànghoá_diễngiảithêmlýdo", "diễngiảithêmlýdo", "ghi chú", "note", "dienthaikthem");
            int colQty = findCol(colMap, "slđặt", "chitiết_hànghoá_sốlượng", "sốlượng", "số lượng", "sldặt", "quantity", "ordered_qty", "orderedqty", "soluong");
            int colUnitPrice = findCol(colMap, "đơngiánhập", "chitiết_giánhập1sp", "đơngiánhập(theocộtf)", "đơngiá", "đơn giá nhập", "giánhập1sp", "đơn giá", "unit_price", "unitprice", "gianhap");
            int colTotalVnd = findCol(colMap, "tổngtiềnhàng", "tiềnhànghoá(vnd)", "tổng tiền hàng (vnd)", "tiềnhànhhoávnd", "quyđổivnd", "quy đổi vnd", "total_vnd", "totalamountvnd", "tienhangvnd");
            int colDomesticShipping = findCol(colMap, "vcnộiđịatq/vn", "vc nội địatq/vn (vnđ)", "vc nội địa", "vcnộiđịa", "domestic_shipping_vnd", "domesticshippingvnd");
            int colShippingMethod = findCol(colMap, "hìnhthứcvậnchuyển", "hìnhthức vận chuyển", "hình thức vc", "hìnhthứcvc", "hìnhthức vận tải", "shipping_method", "shippingmethod");

            int colExpectedWarehouseArrivalDate = findCol(colMap, "ngàyđếnkhotq/vn", "ngày đến kho tq/vn", "ngaydenkhotqvn", "expected_warehouse_arrival_date", "expectedwarehousearrivaldate");
            int colGoodsPaymentDate = findCol(colMap, "ngàythanhtoántiềnhàng", "ngày thanh toán tiền hàng", "ngaythanhtoantienhang", "goods_payment_date", "goodspaymentdate");
            int colFreightPaymentDate = findCol(colMap, "ngàythanhtoáncướcvc", "ngày thanh toán cước vc", "ngaythanhtoancuocvc", "freight_payment_date", "freightpaymentdate");
            int colTotalAmountForeign = findCol(colMap, "tiềnhàng", "tiền hàng(theo cột f)", "tienhangtheocotf", "total_amount_foreign", "totalamountforeign");
            int colProductShortCode = findCol(colMap, "mãviếttắtsp", "mã viết tắt sp", "maviettatsp", "product_short_code", "productshortcode");
            int colSupplierName = findCol(colMap, "ncc", "nhà cung cấp", "nhacungcap", "supplier_name", "suppliername");
            int colOrderFeeVnd = findCol(colMap, "phíorder", "phí order(vnđ)", "phiordervnd", "order_fee_vnd", "orderfeevnd");
            int colIntlShippingUnitPrice = findCol(colMap, "đơngiávcquốctế", "đơn giá vc quốc tế(kg/m3)", "dongiavacquoctekgm3", "international_shipping_unit_price_vnd", "internationalshippingunitpricevnd");
            int colIntlShippingVnd = findCol(colMap, "cướcvcquốctế", "cước vc quốc tế(vnđ)", "cuocvacquoctevnd", "intl_shipping_vnd", "intlshippingvnd");
            int colLocalDeliveryFeeVnd = findCol(colMap, "phíshipphil/malaynộiđịa", "phí ship phil/malay nội địa(vnđ)", "phishipperuoidiavnd", "local_delivery_fee_vnd", "localdeliveryfeevnd");
            int colTotalLotCostVnd = findCol(colMap, "tổngtiềnlô", "tổng tiền lô(vnđ)", "tongtienlovnd", "total_lot_cost_vnd", "totallotcostvnd");
            int colUnitCostFullVnd = findCol(colMap, "gvđầyđủ1sp", "gv đầy đủ 1 sp(vnđ)", "gvdaydu1spvnd", "unit_cost_full_vnd", "unitcostfullvnd");
            int colPaymentMethod = findCol(colMap, "phươngthứcthanhtoán", "phương thức thanh toán", "phuongthucthanhtoan", "payment_method", "paymentmethod");
            int colDepositVnd = findCol(colMap, "đãcọc", "đã cọc(vnđ)", "dacocvnd", "deposit_vnd", "depositvnd");
            int colRemainingPaymentVnd = findCol(colMap, "cònphảitt", "còn phải tt(vnđ)", "conphaitivnd", "remaining_payment_vnd", "remainingpaymentvnd");
            int colPackageMeasurement = findCol(colMap, "khốilượng/thểtích", "khối lượng / thể tích", "khoiluongthetich", "package_measurement", "packagemeasurement");

            List<PurchaseOrderDTO> orders = new ArrayList<>();
            int rowCount = 0;
            String todayPrefix = "IMP-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
            int seq = purchaseOrderRepository.findMaxPoCodeByPrefix(todayPrefix + "%")
                .map(maxCode -> {
                    try {
                        return Integer.parseInt(maxCode.substring(todayPrefix.length()));
                    } catch (Exception e) {
                        return 0;
                    }
                })
                .orElse(0);
            int emptyRowCounter = 0;

            int dataStartRow = headerRow.getRowNum() + 1;
            for (int i = dataStartRow; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    emptyRowCounter++;
                    if (emptyRowCounter >= 3) break;
                    continue;
                }
                emptyRowCounter = 0;
                rowCount++;

                try {
                    String poCode = "IMP-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + String.format("%03d", ++seq);
                    PurchaseOrderDTO order = new PurchaseOrderDTO();
                    order.setPoCode(poCode);
                    order.setStatus("COMPLETED");
                    order.setPaymentStatus("PAID");
                    order.setItems(new ArrayList<>());

                    String requester = colRequester >= 0 ? getCellStringValue(row.getCell(colRequester)) : "";
                    order.setCreatedBy(requester.isEmpty() ? null : requester);

                    String dept = colDepartment >= 0 ? getCellStringValue(row.getCell(colDepartment)) : "";
                    order.setInitiatorDepartment(dept.isEmpty() ? null : dept);

                    if (colOrderDate >= 0) {
                        Cell cell = row.getCell(colOrderDate);
                        LocalDate date = getCellDate(cell);
                        if (date != null) {
                            order.setOrderDate(date);
                            order.setCreatedAt(date.atStartOfDay());
                        } else {
                            String raw = getCellStringValue(cell);
                            LocalDateTime dt = parseDateTime(raw);
                            if (dt != null) {
                                order.setOrderDate(dt.toLocalDate());
                                order.setCreatedAt(dt);
                            } else {
                                LocalDate serialDate = parseExcelSerialDate(raw);
                                if (serialDate != null) {
                                    order.setOrderDate(serialDate);
                                    order.setCreatedAt(serialDate.atStartOfDay());
                                }
                            }
                        }
                    }
                    if (colCompletedAt >= 0) {
                        String raw = getCellStringValue(row.getCell(colCompletedAt));
                        LocalDateTime dt = parseDateTime(raw);
                        if (dt != null) {
                            order.setCompletedAt(dt);
                        } else {
                            LocalDate serialDate = parseExcelSerialDate(raw);
                            if (serialDate != null) order.setCompletedAt(serialDate.atStartOfDay());
                        }
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

                    if (colExpectedWarehouseArrivalDate >= 0) {
                        Cell cell = row.getCell(colExpectedWarehouseArrivalDate);
                        LocalDate date = getCellDate(cell);
                        if (date != null) {
                            order.setExpectedWarehouseArrivalDate(date);
                        } else {
                            String raw = getCellStringValue(cell);
                            LocalDateTime dt = parseDateTime(raw);
                            if (dt != null) {
                                order.setExpectedWarehouseArrivalDate(dt.toLocalDate());
                            } else {
                                LocalDate serialDate = parseExcelSerialDate(raw);
                                if (serialDate != null) order.setExpectedWarehouseArrivalDate(serialDate);
                            }
                        }
                    }
                    if (colGoodsPaymentDate >= 0) {
                        Cell cell = row.getCell(colGoodsPaymentDate);
                        LocalDate date = getCellDate(cell);
                        if (date != null) {
                            order.setGoodsPaymentDate(date);
                        } else {
                            String raw = getCellStringValue(cell);
                            LocalDateTime dt = parseDateTime(raw);
                            if (dt != null) {
                                order.setGoodsPaymentDate(dt.toLocalDate());
                            } else {
                                LocalDate serialDate = parseExcelSerialDate(raw);
                                if (serialDate != null) order.setGoodsPaymentDate(serialDate);
                            }
                        }
                    }
                    if (colFreightPaymentDate >= 0) {
                        Cell cell = row.getCell(colFreightPaymentDate);
                        LocalDate date = getCellDate(cell);
                        if (date != null) {
                            order.setFreightPaymentDate(date);
                        } else {
                            String raw = getCellStringValue(cell);
                            LocalDateTime dt = parseDateTime(raw);
                            if (dt != null) {
                                order.setFreightPaymentDate(dt.toLocalDate());
                            } else {
                                LocalDate serialDate = parseExcelSerialDate(raw);
                                if (serialDate != null) order.setFreightPaymentDate(serialDate);
                            }
                        }
                    }
                    if (colSupplierName >= 0) {
                        order.setSupplierName(getCellStringValue(row.getCell(colSupplierName)));
                    }
                    if (colOrderFeeVnd >= 0) {
                        BigDecimal val = parseBigDecimal(getCellStringValue(row.getCell(colOrderFeeVnd)));
                        if (val != null) order.setOrderFeeVnd(val);
                    }
                    if (colIntlShippingUnitPrice >= 0) {
                        BigDecimal val = parseBigDecimal(getCellStringValue(row.getCell(colIntlShippingUnitPrice)));
                        if (val != null) order.setInternationalShippingUnitPriceVnd(val);
                    }
                    if (colIntlShippingVnd >= 0) {
                        BigDecimal val = parseBigDecimal(getCellStringValue(row.getCell(colIntlShippingVnd)));
                        if (val != null) order.setIntlShippingVnd(val);
                    }
                    if (colLocalDeliveryFeeVnd >= 0) {
                        BigDecimal val = parseBigDecimal(getCellStringValue(row.getCell(colLocalDeliveryFeeVnd)));
                        if (val != null) order.setLocalDeliveryFeeVnd(val);
                    }
                    if (colTotalLotCostVnd >= 0) {
                        BigDecimal val = parseBigDecimal(getCellStringValue(row.getCell(colTotalLotCostVnd)));
                        if (val != null) order.setTotalLotCostVnd(val);
                    }
                    if (colUnitCostFullVnd >= 0) {
                        BigDecimal val = parseBigDecimal(getCellStringValue(row.getCell(colUnitCostFullVnd)));
                        if (val != null) order.setUnitCostFullVnd(val);
                    }
                    if (colPaymentMethod >= 0) {
                        order.setPaymentMethod(getCellStringValue(row.getCell(colPaymentMethod)));
                    }
                    if (colDepositVnd >= 0) {
                        BigDecimal val = parseBigDecimal(getCellStringValue(row.getCell(colDepositVnd)));
                        if (val != null) order.setDepositVnd(val);
                    }
                    if (colRemainingPaymentVnd >= 0) {
                        BigDecimal val = parseBigDecimal(getCellStringValue(row.getCell(colRemainingPaymentVnd)));
                        if (val != null) order.setRemainingPaymentVnd(val);
                    }
                    if (colPackageMeasurement >= 0) {
                        order.setPackageMeasurement(getCellStringValue(row.getCell(colPackageMeasurement)));
                    }

                    PurchaseOrderItemDTO item = new PurchaseOrderItemDTO();
                    String productName = colProductName >= 0 ? getCellStringValue(row.getCell(colProductName)) : "";
                    if (productName.isEmpty()) {
                        item.setProductName("N/A");
                        item.setPosCode("N/A");
                    } else {
                        item.setProductName(productName);
                        String searchName = productName.contains(" - ") ? productName.substring(0, productName.indexOf(" - ")).trim() : productName;
                        item.setPosCode(resolveProductPosCode(searchName, colProductShortCode >= 0 ? getCellStringValue(row.getCell(colProductShortCode)) : null));
                    }

                    String specVal = colSpec >= 0 ? getCellStringValue(row.getCell(colSpec)) : "";
                    item.setSpec(specVal.isEmpty() ? "pcs" : specVal);
                    if (colNote >= 0) item.setNote(getCellStringValue(row.getCell(colNote)));
                    Integer qty = colQty >= 0 ? parseInteger(getCellStringValue(row.getCell(colQty))) : null;
                    item.setOrderedQty(qty != null ? qty : 0);
                    if (colUnitPrice >= 0) item.setUnitPrice(parseBigDecimal(getCellStringValue(row.getCell(colUnitPrice))));
                    if (colTotalVnd >= 0) item.setTotalAmountVnd(parseBigDecimal(getCellStringValue(row.getCell(colTotalVnd))));
                    if (colTotalAmountForeign >= 0) item.setTotalAmountForeign(parseBigDecimal(getCellStringValue(row.getCell(colTotalAmountForeign))));
                    if (colProductShortCode >= 0) item.setProductShortCode(getCellStringValue(row.getCell(colProductShortCode)));
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

    private String resolveProductPosCode(String name, String shortCode) {
        if (name == null || name.isEmpty()) return null;
        try {
            Optional<Product> exact = productRepository.findByProductName(name);
            if (exact.isPresent()) return exact.get().getPosCode();
            List<Product> matches = productRepository.findByProductNameContainingIgnoreCase(name);
            if (!matches.isEmpty()) return matches.get(0).getPosCode();
            return createImportProduct(name, shortCode);
        } catch (Exception ignored) {}
        return null;
    }

    private String createImportProduct(String productName, String shortCode) {
        Product product = new Product();
        product.setProductName(productName);
        product.setPosCode(generateImportPosCode(productName));
        product.setVietnameseName(productName);
        product.setStatus("ACTIVE");
        product.setLotCount(0);
        product.setTotalQty(0);
        product.setLatestUnitCostVnd(BigDecimal.ZERO);
        product.setWeightedAvgCostVnd(BigDecimal.ZERO);
        productRepository.save(product);
        return product.getPosCode();
    }

    private String generateImportPosCode(String productName) {
        String prefix = "IMP-" + getNamePrefix(productName) + "-";
        long count = productRepository.countByPosCodeStartingWith(prefix);
        return prefix + String.format("%04d", count + 1);
    }

    private String getNamePrefix(String productName) {
        if (productName == null || productName.trim().isEmpty()) return "XXXX";
        String[] parts = productName.trim().split("[^\\p{L}\\p{N}]+");
        StringBuilder prefix = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) continue;
            prefix.append(Character.toUpperCase(part.charAt(0)));
            if (prefix.length() >= 4) break;
        }
        while (prefix.length() < 4) prefix.append('X');
        return prefix.toString();
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

    private boolean isRowNumeric(Row row) {
        if (row == null) return true;
        for (int i = 0; i <= row.getLastCellNum() && i < 3; i++) {
            Cell cell = row.getCell(i);
            if (cell == null) continue;
            String val = getCellStringValue(cell);
            if (!val.isEmpty() && !val.matches("\\d+[\\.]?\\d*")) return false;
        }
        return true;
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        int lastCell = row.getLastCellNum();
        if (lastCell < 0) return true;
        for (int i = 0; i < lastCell; i++) {
            Cell cell = row.getCell(i);
            if (cell != null) {
                String val = getCellStringValue(cell);
                if (!val.isEmpty()) return false;
            }
        }
        return true;
    }

    private int findCol(Map<String, Integer> colMap, String... names) {
        for (String name : names) {
            String key = name.toLowerCase()
                .replace(" ", "")
                .replace("\n", "").replace("\r", "")
                .replace("（", "(")
                .replace("）", ")")
                .replace("：", ":")
                .replaceAll("[（(][^）)]*[）)]", "");
            Integer idx = colMap.get(key);
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
            "yyyy-MM-dd", "dd/MM/yyyy", "yyyy/M/d", "d/M/yyyy", "M/d/yyyy",
            "M/d/yy", "d/M/yy", "yy-M-d"
        };
        for (String pattern : patterns) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern, java.util.Locale.US);
                if (pattern.length() <= 10) {
                    return LocalDate.parse(value, formatter).atStartOfDay();
                }
                return LocalDateTime.parse(value, formatter);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private LocalDate parseExcelSerialDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            long serial = Long.parseLong(value.replace(",", "").trim());
            if (serial < 1 || serial > 200000) return null;
            // Excel epoch: Jan 1, 1900 = serial 1 (with leap year bug for 1900)
            if (serial > 60) {
                return LocalDate.of(1900, 1, 1).plusDays(serial - 2);
            } else {
                return LocalDate.of(1900, 1, 1).plusDays(serial - 1);
            }
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Autowired
    private PaymentRequestPurchaseOrderRepository paymentRequestPurchaseOrderRepository;
    @Autowired
    private PaymentRequestRepository paymentRequestRepository;
    @Autowired
    private WarehouseReceiptRepository warehouseReceiptRepository;
    @Autowired
    private WarehouseReceiptItemRepository warehouseReceiptItemRepository;
    @Autowired
    private CostCommentRepository costCommentRepository;

    public void deletePurchaseOrder(Long id) {
        paymentRequestPurchaseOrderRepository.findByPoId(id)
                .forEach(prpo -> paymentRequestPurchaseOrderRepository.delete(prpo));
        warehouseReceiptRepository.findAllByPoId(id)
                .forEach(wr -> {
                    warehouseReceiptItemRepository.findByReceiptId(wr.getId())
                            .forEach(item -> warehouseReceiptItemRepository.delete(item));
                    warehouseReceiptRepository.delete(wr);
                });
        paymentRequestRepository.findByPoId(id)
                .forEach(pr -> paymentRequestRepository.delete(pr));
        costCommentRepository.findByPoIdOrderByCreatedAtDesc(id)
                .forEach(cc -> costCommentRepository.delete(cc));
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        purchaseOrderRepository.delete(po);
    }

    public void deleteAllPurchaseOrders() {
        paymentRequestPurchaseOrderRepository.deleteAll();
        warehouseReceiptRepository.findAll().forEach(wr -> {
            warehouseReceiptItemRepository.findByReceiptId(wr.getId())
                    .forEach(item -> warehouseReceiptItemRepository.delete(item));
            warehouseReceiptRepository.delete(wr);
        });
        paymentRequestRepository.deleteAll();
        costCommentRepository.findAll().forEach(cc -> costCommentRepository.delete(cc));
        purchaseOrderRepository.deleteAll();
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

    public List<PurchaseOrderDTO> searchByKeyword(String keyword, String department) {
        String role = getCurrentUserRole();
        String userDept = getCurrentUserDepartment();
        String effectiveDept = (isDepartmentRestricted(role) && userDept != null && !userDept.isEmpty())
                ? userDept : department;
        List<PurchaseOrder> results;
        if (effectiveDept != null && !effectiveDept.isEmpty()) {
            results = purchaseOrderRepository.searchByKeywordAndDepartment(keyword, effectiveDept);
        } else {
            results = purchaseOrderRepository.searchByKeyword(keyword);
        }

        Map<String, Product> productCache = buildProductCache(results);
        return results.stream()
                .map(po -> convertToDTO(po, productCache))
                .collect(Collectors.toList());
    }

    public List<String> getAllDepartments() {
        return purchaseOrderRepository.findDistinctDepartments();
    }

    private String getCurrentUserRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getAuthorities().stream()
                    .map(g -> g.getAuthority().replace("ROLE_", ""))
                    .findFirst().orElse(null);
        }
        return null;
    }

    private String getCurrentUserDepartment() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String username = auth.getName();
            return userRepository.findByUsername(username)
                    .map(User::getDepartment)
                    .orElse(null);
        }
        return null;
    }

    private boolean isDepartmentRestricted(String role) {
        return "SALES".equals(role) || "SALES_MANAGER".equals(role);
    }

    private PurchaseOrderDTO convertToDTO(PurchaseOrder po, Map<String, Product> productCache) {
        PurchaseOrderDTO dto = convertToDTO(po);
        if (po.getItems() != null) {
            dto.setItems(po.getItems().stream()
                    .map(item -> convertItemToDTO(item, productCache))
                    .collect(Collectors.toList()));
        }
        return dto;
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

    private PurchaseOrderItemDTO convertItemToDTO(PurchaseOrderItem item, Map<String, Product> productCache) {
        PurchaseOrderItemDTO dto = convertItemToDTO(item);
        String posCode = item.getPosCode();
        if (posCode != null) {
            Product product = productCache.get(posCode);
            if (product != null) {
                if (dto.getWeightedAvgCostVnd() == null) dto.setWeightedAvgCostVnd(product.getWeightedAvgCostVnd());
                if (dto.getLatestUnitCostVnd() == null) dto.setLatestUnitCostVnd(product.getLatestUnitCostVnd());
                if (dto.getLatestOrderCode() == null) dto.setLatestOrderCode(product.getLatestOrderCode());
                if (dto.getLatestCostDate() == null) dto.setLatestCostDate(product.getLatestCostDate());
                if (dto.getLatestCurrency() == null) dto.setLatestCurrency(product.getLatestCurrency());
            }
        }
        return dto;
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
        dto.setDepartment(item.getDepartment());
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
        item.setDepartment(dto.getDepartment());
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
                if (dto.getLatestCurrency() == null) dto.setLatestCurrency(product.getLatestCurrency());
            }
        } catch (Exception e) {
            // silently ignore â€” cost fields are optional reference data
        }
    }

}






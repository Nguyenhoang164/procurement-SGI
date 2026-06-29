package com.sgiprocurement.service;

import com.sgiprocurement.model.Waybill;
import com.sgiprocurement.model.PaymentRequest;
import com.sgiprocurement.model.PaymentRequestWaybill;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.PaymentRequestPurchaseOrder;
import com.sgiprocurement.dto.WaybillDTO;
import com.sgiprocurement.repository.WaybillRepository;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.repository.PaymentRequestRepository;
import com.sgiprocurement.repository.PaymentRequestWaybillRepository;
import com.sgiprocurement.repository.PaymentRequestPurchaseOrderRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.math.BigDecimal;

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
    private PaymentRequestPurchaseOrderRepository paymentRequestPurchaseOrderRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public List<WaybillDTO> getAllWaybills() {
        List<WaybillDTO> dtos = waybillRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        enrichShippingMethods(dtos);
        return dtos;
    }

    private void enrichShippingMethods(List<WaybillDTO> dtos) {
        Set<Long> allPoIds = new HashSet<>();
        for (WaybillDTO dto : dtos) {
            if (dto.getShippingMethod() == null && dto.getPurchaseOrderIds() != null && !dto.getPurchaseOrderIds().isBlank()) {
                for (String id : dto.getPurchaseOrderIds().split(",")) {
                    try { allPoIds.add(Long.valueOf(id.trim())); }
                    catch (NumberFormatException e) { /* ignore */ }
                }
            }
        }
        if (allPoIds.isEmpty()) return;

        Map<Long, String> poShippingMap = purchaseOrderRepository.findAllById(allPoIds).stream()
                .filter(po -> po.getShippingMethod() != null && !po.getShippingMethod().isBlank())
                .collect(Collectors.toMap(PurchaseOrder::getId, PurchaseOrder::getShippingMethod, (a, b) -> a));

        for (WaybillDTO dto : dtos) {
            if (dto.getShippingMethod() == null && dto.getPurchaseOrderIds() != null && !dto.getPurchaseOrderIds().isBlank()) {
                Set<String> methods = new LinkedHashSet<>();
                for (String id : dto.getPurchaseOrderIds().split(",")) {
                    try {
                        Long poId = Long.valueOf(id.trim());
                        if (poShippingMap.containsKey(poId)) {
                            methods.add(poShippingMap.get(poId));
                        }
                    } catch (NumberFormatException e) { /* ignore */ }
                }
                if (!methods.isEmpty()) {
                    dto.setShippingMethod(String.join(", ", methods));
                }
            }
        }
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
        
        String productsJson = dto.getProducts();
        if (productsJson != null && !productsJson.isBlank()) {
            try {
                List<Map<String, Object>> productList = objectMapper.readValue(productsJson, List.class);
                
                BigDecimal poIntlShippingUnitPrice = dto.getPaymentRequestId() != null ?
                    getPoIntlShippingUnitPrice(dto.getPaymentRequestId()) : BigDecimal.ZERO;
                
                String packageMeasurement = null;
                if (dto.getPaymentRequestId() != null) {
                    packageMeasurement = getPoPackageMeasurement(dto.getPaymentRequestId());
                }
                
                BigDecimal totalFreight = BigDecimal.ZERO;
                for (Map<String, Object> item : productList) {
                    BigDecimal measurement = BigDecimal.ZERO;
                    BigDecimal unitPriceVC = BigDecimal.ZERO;

                    String weightVolume = (String) item.get("weightVolume");
                    String volume = (String) item.get("volume");

                    if (volume != null && !volume.isBlank()) {
                        measurement = extractFirstNumber(volume);
                    } else if (weightVolume != null && !weightVolume.isBlank()) {
                        measurement = extractFirstNumber(weightVolume);
                    } else if (packageMeasurement != null && !packageMeasurement.isBlank()) {
                        measurement = extractFirstNumber(packageMeasurement);
                    }

                    String unitPriceVCStr = (String) item.get("unitPriceVC");
                    if (unitPriceVCStr != null && !unitPriceVCStr.isBlank()) {
                        unitPriceVC = new BigDecimal(unitPriceVCStr);
                    } else {
                        unitPriceVC = poIntlShippingUnitPrice;
                    }

                    if (measurement != null && measurement.compareTo(BigDecimal.ZERO) > 0 &&
                        unitPriceVC.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal productFreight = unitPriceVC.multiply(measurement);
                        item.put("freightVnd", productFreight.longValue());
                        totalFreight = totalFreight.add(productFreight);
                    } else {
                        item.put("freightVnd", 0L);
                    }
                }
                productsJson = objectMapper.writeValueAsString(productList);
                waybill.setFreightVnd(totalFreight != null ? totalFreight.longValue() : 0L);
                waybill.setProducts(productsJson);
                System.out.println("[WaybillService] createWaybill - shippingMethod in products: " + dto.getShippingMethod());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        
        Waybill saved = waybillRepository.save(waybill);

        if (saved.getPaymentRequestId() != null) {
            PaymentRequestWaybill link = new PaymentRequestWaybill();
            link.setPaymentRequestId(saved.getPaymentRequestId());
            link.setWaybillId(saved.getId());
            paymentRequestWaybillRepository.save(link);
        }

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

        BigDecimal poIntlShippingUnitPrice = waybill.getPaymentRequestId() != null ?
            getPoIntlShippingUnitPrice(waybill.getPaymentRequestId()) : BigDecimal.ZERO;

        String productsJson = dto.getProducts();
        if (productsJson != null && !productsJson.isBlank()) {
            try {
                List<Map<String, Object>> productList = objectMapper.readValue(productsJson, List.class);
                
                String packageMeasurement = null;
                if (waybill.getPaymentRequestId() != null) {
                    packageMeasurement = getPoPackageMeasurement(waybill.getPaymentRequestId());
                }
                
                BigDecimal totalFreight = BigDecimal.ZERO;
                for (Map<String, Object> item : productList) {
                    BigDecimal measurement = BigDecimal.ZERO;
                    String weightVolume = (String) item.get("weightVolume");
                    
                    if (weightVolume != null && !weightVolume.isBlank()) {
                        measurement = extractFirstNumber(weightVolume);
                    } else if (packageMeasurement != null && !packageMeasurement.isBlank()) {
                        measurement = extractFirstNumber(packageMeasurement);
                    }
                    
                    if (measurement != null && measurement.compareTo(BigDecimal.ZERO) > 0 && 
                        poIntlShippingUnitPrice != null && poIntlShippingUnitPrice.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal productFreight = poIntlShippingUnitPrice.multiply(measurement);
                        item.put("freightVnd", productFreight.longValue());
                        totalFreight = totalFreight.add(productFreight);
                    } else {
                        item.put("freightVnd", 0L);
                    }
                }
                productsJson = objectMapper.writeValueAsString(productList);
                waybill.setFreightVnd(totalFreight != null ? totalFreight.longValue() : 0L);
                waybill.setProducts(productsJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
waybill.setProducts(productsJson);
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
        List<WaybillDTO> dtos = waybillRepository.searchByKeyword(keyword).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        enrichShippingMethods(dtos);
        return dtos;
    }

    @Transactional
    public WaybillDTO confirmDelivery(Long id) {
        Waybill waybill = waybillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waybill not found with id: " + id));

        waybill.setStatus("DELIVERED");
        Waybill savedWaybill = waybillRepository.save(waybill);

        if (savedWaybill.getPaymentRequestId() != null) {
            updatePoStatusIfLinked(savedWaybill);
        }

        try {
            warehouseReceiptService.createFromWaybill(savedWaybill);
        } catch (Exception e) {
            System.err.println("Khong the tao phieu nhap kho pending cho waybill " + savedWaybill.getWaybillCode() + ": " + e.getMessage());
        }

        return convertToDTO(savedWaybill);
    }

    public WaybillDTO updateWaybillStatus(Long id, String newStatus) {
        Waybill waybill = waybillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waybill not found with id: " + id));
        waybill.setStatus(newStatus);
        recalculateFreight(waybill);
        return convertToDTO(waybillRepository.save(waybill));
    }

    private void updatePoStatusIfLinked(Waybill waybill) {
        if (waybill.getPaymentRequestId() == null) return;
        PaymentRequest pr = paymentRequestRepository.findById(waybill.getPaymentRequestId()).orElse(null);
        if (pr == null) return;

        Set<Long> poIds = new HashSet<>();
        poIds.add(pr.getPoId());
        List<PaymentRequestPurchaseOrder> links = paymentRequestPurchaseOrderRepository
                .findByPaymentRequestId(pr.getId());
        for (PaymentRequestPurchaseOrder link : links) {
            poIds.add(link.getPoId());
        }

        for (Long poId : poIds) {
            if (poId == null) continue;
            PurchaseOrder po = purchaseOrderRepository.findById(poId).orElse(null);
            if (po != null && "IN_TRANSIT".equals(po.getStatus())) {
                po.setStatus("SHIPPING");
                purchaseOrderRepository.save(po);
            }
        }
    }

    private WaybillDTO convertToDTO(Waybill waybill) {
        List<PaymentRequestWaybill> links = paymentRequestWaybillRepository.findByWaybillId(waybill.getId());
        List<Long> prIds = links.stream().map(PaymentRequestWaybill::getPaymentRequestId).collect(Collectors.toList());
        if (waybill.getPaymentRequestId() != null && !prIds.contains(waybill.getPaymentRequestId())) {
            prIds.add(0, waybill.getPaymentRequestId());
        }

String poIds = null;
            String shippingMethod = null;
            String waybillDetails = null;
            BigDecimal internationalShippingUnitPriceVnd = BigDecimal.ZERO;
            if (waybill.getProducts() != null && !waybill.getProducts().isBlank()) {
                try {
                    List<Map<String, Object>> productList = objectMapper.readValue(waybill.getProducts(), List.class);
                    Set<String> poIdSet = new java.util.LinkedHashSet<>();
                    Set<String> shippingMethods = new java.util.LinkedHashSet<>();
                    for (Map<String, Object> p : productList) {
                        if (p.containsKey("poId")) {
                            poIdSet.add(String.valueOf(p.get("poId")));
                        }
                        if (p.containsKey("shippingMethod") && p.get("shippingMethod") != null
                                && !((String) p.get("shippingMethod")).isBlank()) {
                            shippingMethods.add((String) p.get("shippingMethod"));
                        }
                        if (p.containsKey("unitPriceVC")) {
                            Object unitPriceObj = p.get("unitPriceVC");
                            if (unitPriceObj != null) {
                                BigDecimal unitPrice = BigDecimal.ZERO;
                                if (unitPriceObj instanceof BigDecimal) {
                                    unitPrice = (BigDecimal) unitPriceObj;
                                } else if (unitPriceObj instanceof Long) {
                                    unitPrice = BigDecimal.valueOf((Long) unitPriceObj);
                                } else if (unitPriceObj instanceof Integer) {
                                    unitPrice = BigDecimal.valueOf((Integer) unitPriceObj);
                                } else if (unitPriceObj instanceof String) {
                                    try {
                                        unitPrice = new BigDecimal((String) unitPriceObj);
                                    } catch (NumberFormatException e) {
                                        // ignore
                                    }
                                }
                                if (unitPrice.compareTo(BigDecimal.ZERO) > 0 && unitPrice.compareTo(internationalShippingUnitPriceVnd) > 0) {
                                    internationalShippingUnitPriceVnd = unitPrice;
                                }
                            }
                        }
                    }
                    if (!poIdSet.isEmpty()) {
                        poIds = String.join(",", poIdSet);
                    }
                    if (!shippingMethods.isEmpty()) {
                        shippingMethod = String.join(", ", shippingMethods);
                    } else if (waybill.getCarrier() != null && !waybill.getCarrier().isBlank()) {
                        shippingMethod = waybill.getCarrier();
                    }
                    System.out.println("[WaybillService] convertToDTO - Final shippingMethod: " + shippingMethod);

                BigDecimal totalFreight = BigDecimal.ZERO;
                for (Map<String, Object> p : productList) {
                    if (p.containsKey("freightVnd")) {
                        Object freightObj = p.get("freightVnd");
                        if (freightObj != null) {
                            if (freightObj instanceof Long) {
                                totalFreight = totalFreight.add(new BigDecimal((Long) freightObj));
                            } else if (freightObj instanceof BigDecimal) {
                                totalFreight = totalFreight.add((BigDecimal) freightObj);
                            }
                        }
                    }
                }

                StringBuilder details = new StringBuilder();
                for (Map<String, Object> p : productList) {
                    if (p.containsKey("productName")) {
                        if (details.length() > 0) details.append("\n");
                        details.append("Tên sản phẩm: ").append(p.get("productName"));
                    }
                    if (p.containsKey("orderedQty")) {
                        if (details.length() > 0) details.append("\n");
                        details.append("Số lượng: ").append(p.get("orderedQty"));
                    }
                    if (p.containsKey("freightVnd")) {
                        if (details.length() > 0) details.append("\n");
                        Object freightObj = p.get("freightVnd");
                        if (freightObj != null) {
                            if (freightObj instanceof Long) {
                                details.append("Cước vận chuyển hàng: ").append(String.format("%,d", (Long) freightObj).replace(",", "."));
                            } else if (freightObj instanceof BigDecimal) {
                                details.append("Cước vận chuyển hàng: ").append(((BigDecimal) freightObj).toString());
                            } else {
                                details.append("Cước vận chuyển hàng: ").append(freightObj);
                            }
                        }
                    }
                }
                waybillDetails = details.toString();
            } catch (Exception e) {
                // ignore parse errors
            }
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
                shippingMethod,
                prIds,
                poIds,
                waybill.getFreightVnd()
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
        waybill.setFreightVnd(dto.getFreightVnd());
        return waybill;
    }

    private BigDecimal getPoIntlShippingUnitPrice(Long paymentRequestId) {
        if (paymentRequestId == null) return BigDecimal.ZERO;
        PaymentRequest pr = paymentRequestRepository.findById(paymentRequestId).orElse(null);
        if (pr == null || pr.getPoId() == null) return BigDecimal.ZERO;
        PurchaseOrder po = purchaseOrderRepository.findById(pr.getPoId()).orElse(null);
        if (po == null) return BigDecimal.ZERO;
        return po.getInternationalShippingUnitPriceVnd() != null ? po.getInternationalShippingUnitPriceVnd() : BigDecimal.ZERO;
    }

    private String getPoPackageMeasurement(Long paymentRequestId) {
        if (paymentRequestId == null) return null;
        PaymentRequest pr = paymentRequestRepository.findById(paymentRequestId).orElse(null);
        if (pr == null || pr.getPoId() == null) return null;
        PurchaseOrder po = purchaseOrderRepository.findById(pr.getPoId()).orElse(null);
        if (po == null) return null;
        return po.getPackageMeasurement();
    }
private void recalculateFreight(Waybill waybill) {
        String productsJson = waybill.getProducts();
        if (productsJson == null || productsJson.isBlank()) {
            waybill.setFreightVnd(0L);
            return;
        }
        try {
            List<Map<String, Object>> productList = objectMapper.readValue(productsJson, List.class);
            BigDecimal poIntlShippingUnitPrice = getPoIntlShippingUnitPrice(waybill.getPaymentRequestId());
            
            String packageMeasurement = null;
            if (waybill.getPaymentRequestId() != null) {
                packageMeasurement = getPoPackageMeasurement(waybill.getPaymentRequestId());
            }
            
            BigDecimal totalFreight = BigDecimal.ZERO;
            for (Map<String, Object> item : productList) {
                BigDecimal measurement = BigDecimal.ZERO;
                BigDecimal unitPriceVC = BigDecimal.ZERO;
                
                String weightVolume = (String) item.get("volume");
                
                if (weightVolume != null && !weightVolume.isBlank()) {
                    measurement = extractFirstNumber(weightVolume);
                    System.out.println("[WaybillService] Product has volume: " + weightVolume + " -> measurement: " + measurement);
                } else if (packageMeasurement != null && !packageMeasurement.isBlank()) {
                    measurement = extractFirstNumber(packageMeasurement);
                    System.out.println("[WaybillService] Product has no volume, using packageMeasurement from PO: " + packageMeasurement + " -> measurement: " + measurement);
                }
                
                String unitPriceVCStr = (String) item.get("unitPriceVC");
                if (unitPriceVCStr != null && !unitPriceVCStr.isBlank()) {
                    unitPriceVC = new BigDecimal(unitPriceVCStr);
                    System.out.println("[WaybillService] Product has unitPriceVC from product JSON: " + unitPriceVCStr);
                } else {
                    unitPriceVC = poIntlShippingUnitPrice;
                    System.out.println("[WaybillService] Product has no unitPriceVC in JSON, using PO unitPriceVC: " + poIntlShippingUnitPrice);
                }
                
                System.out.println("[WaybillService] Product measurement: " + measurement + ", UnitPriceVC: " + unitPriceVC + ", Product key: " + (item.containsKey("productName") ? item.get("productName") : "NO_PRODUCT_NAME"));
                
                if (measurement != null && measurement.compareTo(BigDecimal.ZERO) > 0 && 
                    unitPriceVC.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal productFreight = unitPriceVC.multiply(measurement);
                    item.put("freightVnd", productFreight.longValue());
                    totalFreight = totalFreight.add(productFreight);
                    System.out.println("[WaybillService] Calculated freight for product: " + productFreight);
                } else {
                    item.put("freightVnd", 0L);
                }
            }
        
waybill.setProducts(objectMapper.writeValueAsString(productList));
waybill.setFreightVnd(totalFreight != null ? totalFreight.longValue() : 0L);
System.out.println("[WaybillService] Total freight calculated: " + waybill.getFreightVnd());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private BigDecimal extractFirstNumber(String value) {
        if (value == null || value.isBlank()) return BigDecimal.ZERO;
        Matcher matcher = Pattern.compile("\\d+(?:[\\.,]\\d+)?").matcher(value);
        if (!matcher.find()) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(matcher.group().replace(",", "."));
    }

    @Autowired
    private WarehouseReceiptService warehouseReceiptService;

}
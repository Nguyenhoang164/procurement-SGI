package com.sgiprocurement.service;

import com.sgiprocurement.dto.ProductCostDTO;
import com.sgiprocurement.dto.CostAlertDTO;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.PurchaseOrderItem;
import com.sgiprocurement.model.CostAlert;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.repository.CostAlertRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductCostService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CostAlertRepository costAlertRepository;

    @Value("${cost.variance.alert.threshold.percentage:20}")
    private BigDecimal varianceThresholdPercentage;

    @Value("${cost.variance.alert.min.old.cost:50000}")
    private BigDecimal minOldCostForPercentage;

    @Value("${cost.variance.alert.min.variance.amount:500000}")
    private BigDecimal minVarianceAmount;

    public List<ProductCostDTO> getAllProductCosts() {
        return productRepository.findAll().stream()
                .filter(p -> p.getLotCount() != null && p.getLotCount() > 0)
                .map(this::toDTO)
                .sorted(Comparator.comparing(ProductCostDTO::getPosCode))
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật giá vốn bình quân gia quyền sau khi nhận hàng.
     * Hỗ trợ đơn hàng có nhiều sản phẩm (PurchaseOrderItem).
     */
    public void applyReceiptFromPurchaseOrder(PurchaseOrder po, int totalReceivedQty) {
        if (po == null || totalReceivedQty <= 0) return;

        if (po.getItems() != null && !po.getItems().isEmpty()) {
            BigDecimal totalQty = BigDecimal.ZERO;
            for (PurchaseOrderItem item : po.getItems()) {
                if (item.getOrderedQty() != null) {
                    totalQty = totalQty.add(BigDecimal.valueOf(item.getOrderedQty()));
                }
            }
            if (totalQty.compareTo(BigDecimal.ZERO) <= 0) return;

            for (PurchaseOrderItem item : po.getItems()) {
                if (item.getPosCode() == null) continue;
                BigDecimal itemRatio = item.getOrderedQty() != null
                        ? BigDecimal.valueOf(item.getOrderedQty()).divide(totalQty, 4, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
                int itemReceivedQty = itemRatio.multiply(BigDecimal.valueOf(totalReceivedQty))
                        .setScale(0, RoundingMode.HALF_UP).intValue();
                if (itemReceivedQty <= 0) continue;
                applySingleItem(item, itemReceivedQty, po.getPoCode(), po.getUpdatedAt());
            }
        } else {
            if (po.getPosCode() == null) return;
            PurchaseOrderItem fakeItem = new PurchaseOrderItem();
            fakeItem.setPosCode(po.getPosCode());
            fakeItem.setUnitPrice(po.getUnitPrice());
            fakeItem.setExchangeRate(po.getExchangeRate());
            fakeItem.setOrderedQty(po.getOrderedQty());
            applySingleItem(fakeItem, totalReceivedQty, po.getPoCode(), po.getUpdatedAt());
        }
    }

    /**
     * Cập nhật giá vốn với số lượng nhận thực tế theo từng sản phẩm (từ receipt items).
     */
    public void applyReceiptFromPurchaseOrder(PurchaseOrder po, java.util.Map<Long, Integer> itemReceivedMap) {
        if (po == null || itemReceivedMap == null || itemReceivedMap.isEmpty()) return;

        if (po.getItems() != null && !po.getItems().isEmpty()) {
            for (PurchaseOrderItem item : po.getItems()) {
                if (item.getPosCode() == null) continue;
                Integer itemReceivedQty = itemReceivedMap.get(item.getId());
                if (itemReceivedQty == null || itemReceivedQty <= 0) continue;
                applySingleItem(item, itemReceivedQty, po.getPoCode(), po.getUpdatedAt());
            }
        }
    }

    private void applySingleItem(PurchaseOrderItem item, int receivedQty, String poCode, java.time.LocalDateTime updatedAt) {
        if (item.getPosCode() == null || receivedQty <= 0) return;

        Product product = productRepository.findByPosCode(item.getPosCode())
                .orElse(null);
        if (product == null) return;

        BigDecimal lotUnitCost;
        if (item.getTotalAmountVnd() != null && item.getOrderedQty() != null && item.getOrderedQty() > 0) {
            lotUnitCost = item.getTotalAmountVnd()
                    .divide(BigDecimal.valueOf(item.getOrderedQty()), 0, RoundingMode.HALF_UP);
        } else if (item.getUnitPrice() != null && item.getExchangeRate() != null) {
            lotUnitCost = item.getUnitPrice()
                    .multiply(item.getExchangeRate())
                    .setScale(0, RoundingMode.HALF_UP);
        } else {
            lotUnitCost = BigDecimal.ZERO;
        }

        int oldQty = product.getTotalQty() != null ? product.getTotalQty() : 0;
        BigDecimal oldAvg = product.getWeightedAvgCostVnd() != null
                ? product.getWeightedAvgCostVnd()
                : BigDecimal.ZERO;

        int newTotalQty = oldQty + receivedQty;
        BigDecimal newAvg;
        if (newTotalQty <= 0) {
            newAvg = lotUnitCost;
        } else {
            BigDecimal oldValue = oldAvg.multiply(BigDecimal.valueOf(oldQty));
            BigDecimal newValue = lotUnitCost.multiply(BigDecimal.valueOf(receivedQty));
            newAvg = oldValue.add(newValue)
                    .divide(BigDecimal.valueOf(newTotalQty), 0, RoundingMode.HALF_UP);
        }

        product.setLotCount((product.getLotCount() != null ? product.getLotCount() : 0) + 1);
        product.setTotalQty(newTotalQty);
        product.setLatestUnitCostVnd(lotUnitCost);
        product.setWeightedAvgCostVnd(newAvg);
        product.setLatestOrderCode(poCode);
        product.setLatestCostDate(updatedAt != null ? updatedAt : java.time.LocalDateTime.now());
        product.setLatestCurrency(item.getCurrency());
        productRepository.save(product);

        checkAndCreateCostAlert(product, oldAvg, lotUnitCost);
    }

    /**
     * Kiểm tra biến động giá và tạo cảnh báo nếu vượt ngưỡng cho phép
     * @param product Sản phẩm cần kiểm tra
     * @param oldAvgCost Giá vốn trung bình trước khi cập nhật
     * @param newCost Giá vốn mới (lot unit cost)
     */
    private void checkAndCreateCostAlert(Product product, BigDecimal oldAvgCost, BigDecimal newCost) {
        if (oldAvgCost == null || newCost == null ||
            oldAvgCost.compareTo(BigDecimal.ZERO) == 0 ||
            newCost.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        // Skip if old cost is too small for meaningful percentage calculation
        if (oldAvgCost.compareTo(minOldCostForPercentage) < 0) {
            return;
        }

        BigDecimal variance = newCost.subtract(oldAvgCost);
        BigDecimal absVariance = variance.abs();

        // Skip if absolute variance is too small to be meaningful
        if (absVariance.compareTo(minVarianceAmount) < 0) {
            return;
        }

        BigDecimal variancePercentage = variance.divide(oldAvgCost, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));

        BigDecimal absVariancePercentage = variancePercentage.abs();
        if (absVariancePercentage.compareTo(varianceThresholdPercentage) >= 0) {
            String alertType = variancePercentage.compareTo(BigDecimal.ZERO) >= 0
                    ? "HIGH_VARIANCE" : "LOW_VARIANCE";

            CostAlert alert = new CostAlert();
            alert.setPosCode(product.getPosCode());
            alert.setProductName(product.getProductName());
            alert.setExpectedCostVnd(oldAvgCost);
            alert.setActualCostVnd(newCost);
            alert.setVarianceAmountVnd(variance);
            alert.setVariancePercentage(variancePercentage.setScale(2, RoundingMode.HALF_UP));
            alert.setAlertType(alertType);

            costAlertRepository.save(alert);
        }
    }

    private ProductCostDTO toDTO(Product product) {
        BigDecimal latest = product.getLatestUnitCostVnd() != null
                ? product.getLatestUnitCostVnd() : BigDecimal.ZERO;
        BigDecimal avg = product.getWeightedAvgCostVnd() != null
                ? product.getWeightedAvgCostVnd() : BigDecimal.ZERO;
        BigDecimal diff = latest.subtract(avg);

        ProductCostDTO dto = new ProductCostDTO();
        dto.setPosCode(product.getPosCode());
        dto.setProductName(product.getProductName());
        dto.setLotCount(product.getLotCount());
        dto.setTotalQty(product.getTotalQty());
        dto.setLatestUnitCostVnd(latest);
        dto.setWeightedAvgCostVnd(avg);
        dto.setCostDifferenceVnd(diff);
        dto.setLatestOrderCode(product.getLatestOrderCode());
        dto.setLatestCostDate(product.getLatestCostDate());
        dto.setLatestCurrency(product.getLatestCurrency());
        return dto;
    }

    /**
     * Cập nhật giá vốn sản phẩm ngay khi import đơn hàng (không cần chờ nhập kho).
     * Chỉ xử lý các item có posCode khác "N/A".
     */
    public void applyCostsFromImport(PurchaseOrder po) {
        if (po == null || po.getItems() == null || po.getItems().isEmpty()) return;

        for (PurchaseOrderItem item : po.getItems()) {
            if (item.getPosCode() == null || "N/A".equals(item.getPosCode())) continue;
            if (item.getOrderedQty() == null || item.getOrderedQty() <= 0) continue;
            applySingleItem(item, item.getOrderedQty(), po.getPoCode(), po.getUpdatedAt());
        }
    }

    /**
     * Lấy danh sách cảnh báo về biến động giá
     * @return Danh sách các cảnh báo về biến động giá
     */
    public void resetAllProductCosts() {
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            product.setLotCount(0);
            product.setTotalQty(0);
            product.setLatestUnitCostVnd(BigDecimal.ZERO);
            product.setWeightedAvgCostVnd(BigDecimal.ZERO);
            product.setLatestOrderCode(null);
            product.setLatestCostDate(null);
            product.setLatestCurrency(null);
            product.setUpdatedAt(LocalDateTime.now());
        }
        productRepository.saveAll(products);
    }

    public void resetProductCost(String posCode) {
        Product product = productRepository.findByPosCode(posCode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with posCode: " + posCode));
        product.setLotCount(0);
        product.setTotalQty(0);
        product.setLatestUnitCostVnd(BigDecimal.ZERO);
        product.setWeightedAvgCostVnd(BigDecimal.ZERO);
        product.setLatestOrderCode(null);
        product.setLatestCostDate(null);
        product.setLatestCurrency(null);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);
    }

    public List<CostAlertDTO> getAllCostAlerts() {
        return costAlertRepository.findAll().stream()
                .map(this::convertToDTO)
                .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt())) // Newest first
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách cảnh báo về biến động giá cho một sản phẩm cụ thể
     * @param posCode Mã POS của sản phẩm
     * @return Danh sách các cảnh báo về biến động giá của sản phẩm
     */
    public List<CostAlertDTO> getCostAlertsByPosCode(String posCode) {
        return costAlertRepository.findByPosCode(posCode).stream()
                .map(this::convertToDTO)
                .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt())) // Newest first
                .collect(Collectors.toList());
    }

    private CostAlertDTO convertToDTO(CostAlert alert) {
        CostAlertDTO dto = new CostAlertDTO();
        dto.setId(alert.getId());
        dto.setPosCode(alert.getPosCode());
        dto.setProductName(alert.getProductName());
        dto.setExpectedCostVnd(alert.getExpectedCostVnd());
        dto.setActualCostVnd(alert.getActualCostVnd());
        dto.setVarianceAmountVnd(alert.getVarianceAmountVnd());
        dto.setVariancePercentage(alert.getVariancePercentage());
        dto.setAlertType(alert.getAlertType());
        dto.setCreatedAt(alert.getCreatedAt());
        return dto;
    }
}

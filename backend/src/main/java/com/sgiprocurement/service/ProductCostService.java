package com.sgiprocurement.service;

import com.sgiprocurement.dto.ProductCostDTO;
import com.sgiprocurement.dto.CostAlertDTO;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.CostAlert;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.repository.CostAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    public List<ProductCostDTO> getAllProductCosts() {
        return productRepository.findAll().stream()
                .filter(p -> p.getLotCount() != null && p.getLotCount() > 0)
                .map(this::toDTO)
                .sorted(Comparator.comparing(ProductCostDTO::getPosCode))
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật giá vốn bình quân gia quyền sau khi nhận hàng (sau khi kế toán đã xác nhận thanh toán).
     * Kiểm tra và tạo cảnh báo nếu có biến động giá vượt ngưỡng cho phép.
     */
    public void applyReceiptFromPurchaseOrder(PurchaseOrder po, int receivedQty) {
        if (po == null || po.getPosCode() == null || receivedQty <= 0) {
            return;
        }

        Product product = productRepository.findByPosCode(po.getPosCode())
                .orElseThrow(() -> new IllegalStateException(
                        "Không tìm thấy sản phẩm với mã POS: " + po.getPosCode()));

        BigDecimal lotUnitCost = po.getUnitCostFullVnd() != null
                ? po.getUnitCostFullVnd().setScale(0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

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

        // Update product with new costs
        product.setLotCount((product.getLotCount() != null ? product.getLotCount() : 0) + 1);
        product.setTotalQty(newTotalQty);
        product.setLatestUnitCostVnd(lotUnitCost);
        product.setWeightedAvgCostVnd(newAvg);
        productRepository.save(product);

        // Check for cost variance and create alert if needed
        checkAndCreateCostAlert(product, oldAvg, lotUnitCost);
    }

    /**
     * Kiểm tra biến động giá và tạo cảnh báo nếu vượt ngưỡng cho phép
     * @param product Sản phẩm cần kiểm tra
     * @param oldAvgCost Giá vốn trung bình trước khi cập nhật
     * @param newCost Giá vốn mới (lot unit cost)
     */
    private void checkAndCreateCostAlert(Product product, BigDecimal oldAvgCost, BigDecimal newCost) {
        // Skip if either value is zero or null to avoid division by zero
        if (oldAvgCost == null || oldAvgCost.compareTo(BigDecimal.ZERO) == 0 || 
            newCost == null || newCost.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        // Calculate variance percentage
        BigDecimal variance = newCost.subtract(oldAvgCost);
        BigDecimal variancePercentage = variance.divide(oldAvgCost, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));

        // Check if variance exceeds threshold (both positive and negative)
        BigDecimal absVariancePercentage = variancePercentage.abs();
        if (absVariancePercentage.compareTo(varianceThresholdPercentage) >= 0) {
            // Determine alert type
            String alertType = variancePercentage.compareTo(BigDecimal.ZERO) >= 0 
                    ? "HIGH_VARIANCE" : "LOW_VARIANCE";

            // Create and save the alert
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
        return dto;
    }

    /**
     * Lấy danh sách cảnh báo về biến động giá
     * @return Danh sách các cảnh báo về biến động giá
     */
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

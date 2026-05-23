package com.sgiprocurement.service;

import com.sgiprocurement.dto.ProductCostDTO;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

    public List<ProductCostDTO> getAllProductCosts() {
        return productRepository.findAll().stream()
                .filter(p -> p.getLotCount() != null && p.getLotCount() > 0)
                .map(this::toDTO)
                .sorted(Comparator.comparing(ProductCostDTO::getPosCode))
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật giá vốn bình quân gia quyền sau khi nhận hàng (sau khi kế toán đã xác nhận thanh toán).
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

        product.setLotCount((product.getLotCount() != null ? product.getLotCount() : 0) + 1);
        product.setTotalQty(newTotalQty);
        product.setLatestUnitCostVnd(lotUnitCost);
        product.setWeightedAvgCostVnd(newAvg);
        productRepository.save(product);
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
}

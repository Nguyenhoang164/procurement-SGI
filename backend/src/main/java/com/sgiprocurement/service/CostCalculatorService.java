package com.sgiprocurement.service;

import com.sgiprocurement.model.PurchaseOrder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class CostCalculatorService {

    /**
     * Tính toán chi phí lô hàng và giá vốn
     * Công thức:
     * - Giá hàng VND = unitPrice (USD) * exchangeRate * orderedQty
     * - Tổng chi phí = Giá hàng VND + Tất cả các loại cước
     * - GV 1 SP = Tổng chi phí / orderedQty
     */
    public void calculateCosts(PurchaseOrder po) {
        if (po.getUnitPrice() == null || po.getOrderedQty() == null) {
            return;
        }

        // Giá hàng nhập tính bằng VND
        BigDecimal unitPriceVnd = po.getUnitPrice().multiply(po.getExchangeRate());
        BigDecimal totalGoodsCostVnd = unitPriceVnd.multiply(new BigDecimal(po.getOrderedQty()));

        // Tổng chi phí = giá hàng + tất cả cước
        BigDecimal totalCost = totalGoodsCostVnd
                .add(po.getDomesticShippingVnd() != null ? po.getDomesticShippingVnd() : BigDecimal.ZERO)
                .add(po.getIntlShippingVnd() != null ? po.getIntlShippingVnd() : BigDecimal.ZERO)
                .add(po.getOrderFeeVnd() != null ? po.getOrderFeeVnd() : BigDecimal.ZERO)
                .add(po.getLocalDeliveryFeeVnd() != null ? po.getLocalDeliveryFeeVnd() : BigDecimal.ZERO);

        // Giá vốn 1 sản phẩm
        BigDecimal unitCostFull = totalCost.divide(new BigDecimal(po.getOrderedQty()), 2, java.math.RoundingMode.HALF_UP);

        // Set values
        po.setTotalLotCostVnd(totalCost.setScale(0, java.math.RoundingMode.HALF_UP));
        po.setUnitCostFullVnd(unitCostFull);

        // Tính tiền còn phải thanh toán (sau deposit)
        if (po.getDepositVnd() != null && po.getDepositVnd().compareTo(BigDecimal.ZERO) > 0) {
            po.setRemainingPaymentVnd(totalCost.subtract(po.getDepositVnd()).setScale(0, java.math.RoundingMode.HALF_UP));
        } else {
            po.setRemainingPaymentVnd(totalCost.setScale(0, java.math.RoundingMode.HALF_UP));
        }
    }

}

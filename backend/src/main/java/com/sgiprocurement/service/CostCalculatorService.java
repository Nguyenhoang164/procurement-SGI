package com.sgiprocurement.service;

import com.sgiprocurement.model.PurchaseOrder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
        BigDecimal exchangeRate = po.getExchangeRate() != null ? po.getExchangeRate() : BigDecimal.ONE;
        BigDecimal unitPriceVnd = po.getUnitPrice().multiply(exchangeRate);
        BigDecimal totalGoodsAmount = po.getUnitPrice().multiply(new BigDecimal(po.getOrderedQty()));
        BigDecimal totalGoodsCostVnd = unitPriceVnd.multiply(new BigDecimal(po.getOrderedQty()));
        BigDecimal intlShippingVnd = calculateInternationalShipping(po);

        // Tổng chi phí = giá hàng + tất cả cước
        BigDecimal totalCost = totalGoodsCostVnd
                .add(po.getDomesticShippingVnd() != null ? po.getDomesticShippingVnd() : BigDecimal.ZERO)
                .add(intlShippingVnd)
                .add(po.getOrderFeeVnd() != null ? po.getOrderFeeVnd() : BigDecimal.ZERO)
                .add(po.getLocalDeliveryFeeVnd() != null ? po.getLocalDeliveryFeeVnd() : BigDecimal.ZERO);

        // Giá vốn 1 sản phẩm
        BigDecimal unitCostFull = totalCost.divide(new BigDecimal(po.getOrderedQty()), 2, RoundingMode.HALF_UP);

        // Set values
        po.setTotalGoodsAmount(totalGoodsAmount);
        po.setTotalGoodsCostVnd(totalGoodsCostVnd.setScale(0, RoundingMode.HALF_UP));
        po.setIntlShippingVnd(intlShippingVnd.setScale(0, RoundingMode.HALF_UP));
        po.setTotalLotCostVnd(totalCost.setScale(0, RoundingMode.HALF_UP));
        po.setUnitCostFullVnd(unitCostFull);

        // Tính tiền còn phải thanh toán (sau deposit)
        if (po.getDepositVnd() != null && po.getDepositVnd().compareTo(BigDecimal.ZERO) > 0) {
            po.setRemainingPaymentVnd(totalCost.subtract(po.getDepositVnd()).setScale(0, RoundingMode.HALF_UP));
        } else {
            po.setRemainingPaymentVnd(totalCost.setScale(0, RoundingMode.HALF_UP));
        }
    }

    private BigDecimal calculateInternationalShipping(PurchaseOrder po) {
        if (po.getIntlShippingVnd() != null && po.getIntlShippingVnd().compareTo(BigDecimal.ZERO) > 0) {
            return po.getIntlShippingVnd();
        }

        if (po.getInternationalShippingUnitPriceVnd() == null || po.getPackageMeasurement() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal measurement = extractFirstNumber(po.getPackageMeasurement());
        if (measurement == null) {
            return BigDecimal.ZERO;
        }

        return po.getInternationalShippingUnitPriceVnd().multiply(measurement);
    }

    private BigDecimal extractFirstNumber(String value) {
        Matcher matcher = Pattern.compile("\\d+(?:[\\.,]\\d+)?").matcher(value);
        if (!matcher.find()) {
            return null;
        }

        return new BigDecimal(matcher.group().replace(",", "."));
    }

}

package com.sgiprocurement.service;

import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.PurchaseOrderItem;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CostCalculatorService {

    public void calculateCosts(PurchaseOrder po) {
        BigDecimal totalGoodsAmount = BigDecimal.ZERO;
        BigDecimal totalGoodsCostVnd = BigDecimal.ZERO;

        if (po.getItems() != null && !po.getItems().isEmpty()) {
            for (PurchaseOrderItem item : po.getItems()) {
                if (item.getUnitPrice() != null && item.getOrderedQty() != null) {
                    BigDecimal qty = new BigDecimal(item.getOrderedQty());
                    BigDecimal itemAmountForeign = item.getUnitPrice().multiply(qty);
                    totalGoodsAmount = totalGoodsAmount.add(itemAmountForeign);

                    BigDecimal rate = item.getExchangeRate() != null ? item.getExchangeRate() : BigDecimal.ONE;
                    BigDecimal itemAmountVnd = itemAmountForeign.multiply(rate);
                    totalGoodsCostVnd = totalGoodsCostVnd.add(itemAmountVnd);
                }
            }
        } else if (po.getUnitPrice() != null && po.getOrderedQty() != null) {
            BigDecimal exchangeRate = po.getExchangeRate() != null ? po.getExchangeRate() : BigDecimal.ONE;
            BigDecimal unitPriceVnd = po.getUnitPrice().multiply(exchangeRate);
            totalGoodsAmount = po.getUnitPrice().multiply(new BigDecimal(po.getOrderedQty()));
            totalGoodsCostVnd = unitPriceVnd.multiply(new BigDecimal(po.getOrderedQty()));
        } else {
            return;
        }

        BigDecimal intlShippingVnd = calculateInternationalShipping(po);

        BigDecimal totalCost = totalGoodsCostVnd
                .add(po.getDomesticShippingVnd() != null ? po.getDomesticShippingVnd() : BigDecimal.ZERO)
                .add(intlShippingVnd)
                .add(po.getOrderFeeVnd() != null ? po.getOrderFeeVnd() : BigDecimal.ZERO)
                .add(po.getLocalDeliveryFeeVnd() != null ? po.getLocalDeliveryFeeVnd() : BigDecimal.ZERO);

        int totalQty = po.getOrderedQty() != null ? po.getOrderedQty() : 0;
        if (po.getItems() != null && !po.getItems().isEmpty()) {
            totalQty = po.getItems().stream().mapToInt(i -> i.getOrderedQty() != null ? i.getOrderedQty() : 0).sum();
        }

        BigDecimal unitCostFull = totalQty > 0
                ? totalCost.divide(new BigDecimal(totalQty), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        po.setTotalGoodsAmount(totalGoodsAmount);
        po.setTotalGoodsCostVnd(totalGoodsCostVnd.setScale(0, RoundingMode.HALF_UP));
        po.setIntlShippingVnd(intlShippingVnd.setScale(0, RoundingMode.HALF_UP));
        po.setTotalLotCostVnd(totalCost.setScale(0, RoundingMode.HALF_UP));
        po.setUnitCostFullVnd(unitCostFull);

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

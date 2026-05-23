package com.sgiprocurement.service;

import com.sgiprocurement.model.PurchaseOrder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class CostCalculatorServiceTest {

    private final CostCalculatorService costCalculatorService = new CostCalculatorService();

    private PurchaseOrder po;

    @BeforeEach
    void setUp() {
        po = new PurchaseOrder();
        po.setUnitPrice(new BigDecimal("10.00"));
        po.setOrderedQty(100);
        po.setExchangeRate(new BigDecimal("25000"));
        po.setDomesticShippingVnd(new BigDecimal("500000"));
        po.setIntlShippingVnd(new BigDecimal("2000000"));
        po.setOrderFeeVnd(new BigDecimal("100000"));
        po.setLocalDeliveryFeeVnd(new BigDecimal("300000"));
    }

    @Test
    void calculateCosts_shouldComputeCorrectly() {
        costCalculatorService.calculateCosts(po);

        // totalGoodsAmount = 10.00 * 100 = 1000.00
        assertEquals(0, new BigDecimal("1000.00").compareTo(po.getTotalGoodsAmount()));

        // totalGoodsCostVnd = 10 * 25000 * 100 = 25,000,000
        assertEquals(0, new BigDecimal("25000000").compareTo(po.getTotalGoodsCostVnd()));

        // totalCost = 25,000,000 + 500,000 + 2,000,000 + 100,000 + 300,000 = 27,900,000
        assertEquals(0, new BigDecimal("27900000").compareTo(po.getTotalLotCostVnd()));

        // unitCostFull = 27,900,000 / 100 = 279,000.00
        assertEquals(0, new BigDecimal("279000.00").compareTo(po.getUnitCostFullVnd()));

        // remainingPaymentVnd = 27,900,000 (no deposit)
        assertEquals(0, new BigDecimal("27900000").compareTo(po.getRemainingPaymentVnd()));
    }

    @Test
    void calculateCosts_shouldHandleNullExchangeRate() {
        po.setExchangeRate(null);

        costCalculatorService.calculateCosts(po);

        // exchangeRate should default to 1
        // totalGoodsCostVnd = 10 * 1 * 100 = 1000
        assertEquals(0, new BigDecimal("1000").compareTo(po.getTotalGoodsCostVnd()));
    }

    @Test
    void calculateCosts_shouldReturn_whenUnitPriceIsNull() {
        po.setUnitPrice(null);

        costCalculatorService.calculateCosts(po);

        // totalGoodsAmount defaults to BigDecimal.ZERO and is not changed
        assertEquals(BigDecimal.ZERO, po.getTotalGoodsAmount());
    }

    @Test
    void calculateCosts_shouldReturn_whenOrderedQtyIsNull() {
        po.setOrderedQty(null);

        costCalculatorService.calculateCosts(po);

        // totalGoodsAmount defaults to BigDecimal.ZERO and is not changed
        assertEquals(BigDecimal.ZERO, po.getTotalGoodsAmount());
    }

    @Test
    void calculateCosts_shouldHandleDeposit() {
        po.setDepositVnd(new BigDecimal("5000000"));

        costCalculatorService.calculateCosts(po);

        // remaining = 27,900,000 - 5,000,000 = 22,900,000
        assertEquals(0, new BigDecimal("22900000").compareTo(po.getRemainingPaymentVnd()));
    }

    @Test
    void calculateCosts_shouldHandleZeroShipping() {
        po.setDomesticShippingVnd(BigDecimal.ZERO);
        po.setIntlShippingVnd(BigDecimal.ZERO);
        po.setOrderFeeVnd(BigDecimal.ZERO);
        po.setLocalDeliveryFeeVnd(BigDecimal.ZERO);

        costCalculatorService.calculateCosts(po);

        // totalCost = 25,000,000 (just goods cost)
        assertEquals(0, new BigDecimal("25000000").compareTo(po.getTotalLotCostVnd()));
    }

    @Test
    void calculateInternationalShipping_shouldUseIntlShippingVnd_whenProvided() {
        po.setIntlShippingVnd(new BigDecimal("1500000"));

        costCalculatorService.calculateCosts(po);

        assertEquals(0, new BigDecimal("1500000").compareTo(po.getIntlShippingVnd()));
    }

    @Test
    void calculateInternationalShipping_shouldCalculateFromUnitPriceAndMeasurement() {
        po.setIntlShippingVnd(BigDecimal.ZERO);
        po.setInternationalShippingUnitPriceVnd(new BigDecimal("100000"));
        po.setPackageMeasurement("2.5 CBM");

        costCalculatorService.calculateCosts(po);

        // intlShipping = 100,000 * 2.5 = 250,000
        assertEquals(0, new BigDecimal("250000").compareTo(po.getIntlShippingVnd()));
    }
}

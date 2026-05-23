package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderDTO {

    private Long id;

    @NotBlank(message = "POS Code is required")
    private String posCode;

    private String productName;

    private String productShortCode;

    private String supplierName;

    @Positive(message = "Ordered quantity must be greater than 0")
    private Integer orderedQty;

    @Positive(message = "Unit price must be greater than 0")
    private BigDecimal unitPrice;

    private String currency = "USD";

    @Positive(message = "Exchange rate must be greater than 0")
    private BigDecimal exchangeRate = BigDecimal.ONE;

    private BigDecimal domesticShippingVnd = BigDecimal.ZERO;

    private BigDecimal intlShippingVnd = BigDecimal.ZERO;

    private BigDecimal internationalShippingUnitPriceVnd = BigDecimal.ZERO;

    private String packageMeasurement;

    private BigDecimal orderFeeVnd = BigDecimal.ZERO;

    private BigDecimal localDeliveryFeeVnd = BigDecimal.ZERO;

    // Auto calculated
    private BigDecimal totalLotCostVnd = BigDecimal.ZERO;

    private BigDecimal totalGoodsCostVnd = BigDecimal.ZERO;

    private BigDecimal totalGoodsAmount = BigDecimal.ZERO;

    private BigDecimal unitCostFullVnd = BigDecimal.ZERO;

    private BigDecimal recentUnitPrice = BigDecimal.ZERO;

    private String spec;

    private String country;

    private String shippingMethod;

    private LocalDate orderDate;

    private LocalDate expectedWarehouseArrivalDate;

    private LocalDate goodsPaymentDate;

    private LocalDate freightPaymentDate;

    private String paymentMethod;

    private String note;

    private BigDecimal depositVnd = BigDecimal.ZERO;

    private BigDecimal remainingPaymentVnd = BigDecimal.ZERO;

    private String status;

    private String paymentStatus;

    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}

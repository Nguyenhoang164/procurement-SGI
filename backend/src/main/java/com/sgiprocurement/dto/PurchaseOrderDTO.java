package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderDTO {

    private Long id;

    private String poCode;

    private Long sourcePlanId;

    private String posCode;

    private String productName;

    private String productShortCode;

    private String supplierName;

    private Integer orderedQty;

    private BigDecimal unitPrice;

    private String currency = "USD";

    private BigDecimal exchangeRate = BigDecimal.ONE;

    private BigDecimal domesticShippingVnd = BigDecimal.ZERO;

    private BigDecimal intlShippingVnd = BigDecimal.ZERO;

    private BigDecimal internationalShippingUnitPriceVnd = BigDecimal.ZERO;

    private String packageMeasurement;

    private BigDecimal orderFeeVnd = BigDecimal.ZERO;

    private BigDecimal localDeliveryFeeVnd = BigDecimal.ZERO;

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

    private List<PurchaseOrderItemDTO> items;

}

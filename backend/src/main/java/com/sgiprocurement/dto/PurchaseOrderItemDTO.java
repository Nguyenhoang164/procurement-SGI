package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderItemDTO {

    private Long id;
    private String posCode;
    private String productName;
    private String productShortCode;
    private Integer orderedQty;
    private BigDecimal unitPrice;
    private String currency = "USD";
    private BigDecimal exchangeRate = BigDecimal.ONE;
    private BigDecimal totalAmountForeign = BigDecimal.ZERO;
    private BigDecimal totalAmountVnd = BigDecimal.ZERO;
    private String spec;
    private String sourceLink;

}

package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyPlanItemDTO {

    private Long id;
    private String posCode;
    private String productName;
    private String productType;
    private Integer suggestedQty;
    private String country;
    private String shippingMethod;
    private BigDecimal referencePrice;
    private String currency;
    private String spec;
    private String sourceLink;
    private String priorityLevel;

}

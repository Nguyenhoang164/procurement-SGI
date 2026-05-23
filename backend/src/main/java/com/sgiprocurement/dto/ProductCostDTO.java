package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCostDTO {

    private String posCode;
    private String productName;
    private Integer lotCount;
    private Integer totalQty;
    private BigDecimal latestUnitCostVnd;
    private BigDecimal weightedAvgCostVnd;
    private BigDecimal costDifferenceVnd;

}

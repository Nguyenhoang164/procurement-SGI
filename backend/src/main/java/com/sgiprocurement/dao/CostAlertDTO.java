package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CostAlertDTO {

    private Long id;
    private String posCode;
    private String productName;
    private BigDecimal expectedCostVnd;
    private BigDecimal actualCostVnd;
    private BigDecimal varianceAmountVnd;
    private BigDecimal variancePercentage;
    private String alertType;
    private LocalDateTime createdAt;
}
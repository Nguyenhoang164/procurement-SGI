package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CostCommentDTO {

    private Long id;
    private Long poId;
    private BigDecimal expectedCostVnd;
    private BigDecimal actualCostVnd;
    private BigDecimal varianceAmountVnd;
    private String content;
    private String type;
    private String createdBy;
    private LocalDateTime createdAt;

}

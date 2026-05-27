package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductComboDTO {

    private Long id;

    private Long productId;

    private String comboCode;

    private String comboName;

    private BigDecimal baseQty;

    private String saleUnit;

    private BigDecimal salePriceVnd;

    private String note;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

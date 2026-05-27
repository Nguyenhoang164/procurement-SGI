package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyPlanDTO {

    private Long id;

    private String posCode;

    private LocalDateTime proposedDate;

    private Integer suggestedQty;

    private String spec;

    private String country;

    private String shippingMethod;

    private java.math.BigDecimal recentUnitPrice;

    private String note;

    private String status;

    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<WeeklyPlanItemDTO> items;

}

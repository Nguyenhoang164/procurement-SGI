package com.sgiprocurement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class WarehouseReceiveItemRequest {
    @NotNull
    private Long poItemId;

    @NotNull
    @Positive
    private Integer receivedQty;

    private String goodsCondition;

    private String conditionDescription;
}

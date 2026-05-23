package com.sgiprocurement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class WarehouseReceiveRequest {

    @NotNull
    private Long poId;

    @NotNull
    @Positive
    private Integer receivedQty;

    private String inspector;

    private String conditionDescription;

}

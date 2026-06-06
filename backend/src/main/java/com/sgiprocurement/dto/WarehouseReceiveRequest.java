package com.sgiprocurement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class WarehouseReceiveRequest {

    @NotNull
    private Long poId;

    private Integer receivedQty;

    private String inspector;

    private String conditionDescription;

    private Long waybillId;

    private String waybillCode;

    private Integer expectedQty;

    private String goodsCondition;

    private List<WarehouseReceiveItemRequest> items;

}

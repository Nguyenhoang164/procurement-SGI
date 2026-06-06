package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseReceiptItemDTO {
    private Long id;
    private Long receiptId;
    private Long poItemId;
    private String posCode;
    private String productName;
    private String productShortCode;
    private Integer orderedQty;
    private Integer receivedQty;
    private String goodsCondition;
    private String conditionDescription;
    private String spec;
    private String images;
}

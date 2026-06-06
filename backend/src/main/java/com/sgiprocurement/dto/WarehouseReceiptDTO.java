package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseReceiptDTO {

    private Long id;
    private Long poId;
    private Integer receivedQty;
    private LocalDateTime receivedDate;
    private String inspector;
    private String condition;
    private String attachments;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long waybillId;
    private String waybillCode;
    private Integer expectedQty;
    private String goodsCondition;

    private String poCode;
    private String posCode;
    private String paymentRequestCode;
    private Long paymentRequestId;
    private List<PurchaseOrderItemDTO> products;
    private List<WarehouseReceiptItemDTO> items;

}

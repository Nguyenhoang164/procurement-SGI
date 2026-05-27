package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingReceiveDTO {

    private Long poId;
    private String poCode;
    private String posCode;
    private String productName;
    private Integer orderedQty;
    private Integer receivedQty;
    private Integer remainingQty;
    private String shippingMethod;
    private String paymentStatus;
    private List<WaybillBriefDTO> waybills;
    private List<PurchaseOrderItemDTO> products;

}

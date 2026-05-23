package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingReceiveDTO {

    private Long poId;
    private String poCode;
    private String posCode;
    private String productName;
    private Integer orderedQty;
    private String shippingMethod;
    private String paymentStatus;

}

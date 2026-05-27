package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaybillBriefDTO {

    private Long waybillId;
    private String waybillCode;
    private String carrier;
    private Integer expectedQty;
    private Integer actualQty;
    private String status;
    private Long paymentRequestId;
    private String paymentRequestCode;

}

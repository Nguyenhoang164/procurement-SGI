package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaybillDTO {

    private Long id;
    private String waybillCode;
    private String carrier;
    private String origin;
    private String destination;
    private Integer expectedQty;
    private Integer actualQty;
    private String status;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long paymentRequestId;
    private String products;
    private List<Long> paymentRequestIds;
    private String purchaseOrderIds;

}

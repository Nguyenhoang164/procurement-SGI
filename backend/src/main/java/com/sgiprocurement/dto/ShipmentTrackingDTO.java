package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentTrackingDTO {

    private Long id;
    private Long waybillId;
    private String location;
    private String eventDescription;
    private LocalDateTime eventDate;
    private String status;
    private String updatedBy;
    private LocalDateTime createdAt;

}

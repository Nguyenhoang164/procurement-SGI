package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseReceiptDTO {

    private Long id;

    private Long poId;

    @Positive(message = "Received quantity must be greater than 0")
    private Integer receivedQty;

    private LocalDateTime receivedDate;

    private String inspector;

    private String condition;

    private String attachments;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}

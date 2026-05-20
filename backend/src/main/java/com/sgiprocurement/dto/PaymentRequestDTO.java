package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {

    private Long id;

    private Long poId;

    private String type;

    @Positive(message = "Amount must be greater than 0")
    private BigDecimal amountVnd;

    private String currency = "VND";

    private String status;

    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}

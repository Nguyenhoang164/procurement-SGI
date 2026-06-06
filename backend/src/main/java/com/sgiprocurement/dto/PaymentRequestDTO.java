package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {

    private Long id;

    private Long poId;

    private String type;

    private BigDecimal amountVnd;

    private String currency = "VND";

    private String status;

    private String attachments;

    private String note;

    private String reason;

    private BigDecimal exchangeRateDiffVnd = BigDecimal.ZERO;

    private BigDecimal additionalShippingVnd = BigDecimal.ZERO;

    private BigDecimal totalAmountVnd = BigDecimal.ZERO;

    private LocalDateTime paymentConfirmedAt;

    private String paymentConfirmedBy;

    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String rejectedBy;

    private LocalDateTime rejectedAt;

    private String rejectReason;

    private String rejectedLevel;

    private Long referencePaymentRequestId;

    private Long bankAccountId;

    private String accountingCheckedBy;

    private LocalDateTime accountingCheckedAt;

    private List<Long> poIds;

    private List<Long> waybillIds;

    private List<CustomFeeDTO> customFees;

    private List<WarehouseReceiptDTO> warehouseReceipts;

    private String sourceDnttIds;

    private String shipmentItems;

}

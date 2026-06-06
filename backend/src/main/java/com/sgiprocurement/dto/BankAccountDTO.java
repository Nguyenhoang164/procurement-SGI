package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountDTO {

    private Long id;

    private String accountNumber;

    private String accountHolder;

    private String bankName;

    private String qrCode;

    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

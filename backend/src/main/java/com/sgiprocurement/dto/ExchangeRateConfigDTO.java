package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRateConfigDTO {

    private Long id;

    @NotBlank(message = "Currency is required")
    private String currency;

    @Positive(message = "Rate must be greater than 0")
    private BigDecimal rate;
}

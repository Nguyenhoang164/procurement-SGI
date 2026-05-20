package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {

    private Long id;

    @NotBlank(message = "Product name is required")
        private String productName;

    private String description;

    private Long categoryId;

    private String marketCode;

    private String spec;

    private String unit;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}

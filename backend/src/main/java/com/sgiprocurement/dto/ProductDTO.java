package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {

    private Long id;

    private String posCode;

    @NotBlank(message = "Product name is required")
    private String productName;

    private Long categoryId;

    private String marketCode;

    private String spec;

    private String unit;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}

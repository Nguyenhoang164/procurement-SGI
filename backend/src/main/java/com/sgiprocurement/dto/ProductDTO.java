package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {

    private Long id;

    private String posCode;

    private String oldPosCode;

    private String productName;

    private String vietnameseName;

    private Long categoryId;

    private String marketCode;

    private String spec;

    private String unit;

    private String status;

    private String sourceLink;

    private String productType;

    private List<ProductImageDTO> images;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}

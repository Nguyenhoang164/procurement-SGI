package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TradeRouteDTO {
    private Long id;
    private String routeName;
    private String origin;
    private String destination;
    private String description;
    private Boolean active;
}

package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String role;
    private String market;
    private Boolean active;
    private String department;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

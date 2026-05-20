package com.sgiprocurement.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@AllArgsConstructor
public class ValidationErrorDetails {
    private LocalDateTime timestamp;
    private String message;
    private String details;
    private String error;
    private Map<String, String> fieldErrors;
}

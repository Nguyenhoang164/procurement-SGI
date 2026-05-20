package com.sgiprocurement.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor // Tạo constructor có 4 tham số
@NoArgsConstructor  // Tạo constructor không tham số
public class ErrorDetails {
    private LocalDateTime timestamp;
    private String message;
    private String details;
    private String error;
}

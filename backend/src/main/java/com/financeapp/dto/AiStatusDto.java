package com.financeapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiStatusDto {
    private boolean configured;
    private String source; // "USER", "SYSTEM", "NONE"
    private String model;
    private String maskedKey;
    private String message;
}


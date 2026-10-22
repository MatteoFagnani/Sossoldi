package com.financeapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorizeMerchantResponse {
    private List<TransactionCategoryMappingDto> mapped;
    private int totalProcessed;
    private int newlyMapped;
    private String message;
}


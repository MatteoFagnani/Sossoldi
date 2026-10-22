package com.financeapp.dto;

import com.financeapp.model.TransactionType;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorizeMerchantRequest {

    @NotEmpty
    private List<MerchantItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MerchantItem {
        private String description;
        private TransactionType type;
    }
}


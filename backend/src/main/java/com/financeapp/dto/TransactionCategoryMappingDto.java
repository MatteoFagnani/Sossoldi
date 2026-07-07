package com.financeapp.dto;

import com.financeapp.model.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransactionCategoryMappingDto {
    private Long id;

    @NotNull(message = "Type is required")
    private TransactionType type;

    @NotBlank(message = "Match key is required")
    private String matchKey;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;
}
package com.financeapp.dto;

import com.financeapp.model.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CategoryDto {
    private Long id;

    @NotBlank(message = "Category name is required")
    private String name;

    @NotNull(message = "Category type is required")
    private TransactionType type;

    @NotBlank(message = "Category color is required")
    private String color;

    private Long parentId;

    private String parentName;
}

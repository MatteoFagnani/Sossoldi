package com.financeapp.dto;

import com.financeapp.model.TransactionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TransactionDto {
    private Long id;

    @NotNull(message = "Amount is required")
    @Min(value = 0, message = "Amount must be positive")
    private Double amount;

    private TransactionType type;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private String description;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;
    private String categoryColor;

    private Long accountId;
    private String accountName;

    private boolean automatic;

    private Long automationId;
}

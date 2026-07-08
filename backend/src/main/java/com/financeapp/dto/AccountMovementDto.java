package com.financeapp.dto;

import com.financeapp.model.TransactionType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AccountMovementDto {
    private Long id;
    private String source;
    private TransactionType type;
    private Double amount;
    private Double signedAmount;
    private LocalDate date;
    private String description;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
    private Long accountId;
    private String accountName;
    private Long fromAccountId;
    private String fromAccountName;
    private Long toAccountId;
    private String toAccountName;
    private String transferDirection;
}

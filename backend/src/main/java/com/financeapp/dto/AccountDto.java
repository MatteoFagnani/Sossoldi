package com.financeapp.dto;

import com.financeapp.model.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountDto {
    private Long id;

    @NotBlank(message = "Account name is required")
    private String name;

    @NotNull(message = "Account type is required")
    private AccountType type;

    @NotNull(message = "Initial balance is required")
    private Double initialBalance;

    private Double currentBalance;
    private boolean archived;
    
    private String color;
    private String icon;
}

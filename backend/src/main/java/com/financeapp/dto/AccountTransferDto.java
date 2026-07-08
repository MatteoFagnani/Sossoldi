package com.financeapp.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AccountTransferDto {
    private Long id;

    @NotNull(message = "Importo obbligatorio")
    @Positive(message = "Importo deve essere positivo")
    private Double amount;

    @NotNull(message = "Data obbligatoria")
    private LocalDate date;

    private String description;

    @NotNull(message = "Conto di origine obbligatorio")
    private Long fromAccountId;
    private String fromAccountName;

    @NotNull(message = "Conto di destinazione obbligatorio")
    private Long toAccountId;
    private String toAccountName;
}

package com.financeapp.dto;

import com.financeapp.model.InvestmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.time.LocalDate;

@Data
public class InvestmentDto {
    private Long id;

    @NotBlank(message = "Nome obbligatorio")
    private String name;

    @NotNull(message = "Tipo obbligatorio")
    private InvestmentType type;

    private String ticker;

    @NotNull(message = "Valore attuale obbligatorio")
    @PositiveOrZero(message = "Valore attuale non valido")
    private Double currentValue;

    @NotNull(message = "Capitale versato obbligatorio")
    @PositiveOrZero(message = "Capitale versato non valido")
    private Double investedCapital;

    private Double recurringAmount;
    private Integer recurringDay;
    private boolean pacActive;
    private LocalDate lastUpdateDate;
    private Double gainLoss;
    private Double gainLossPercent;
    private Double allocationPercent;
}

package com.financeapp.dto;

import com.financeapp.model.InvestmentComponent;
import com.financeapp.model.InvestmentSnapshot;
import com.financeapp.model.InvestmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class InvestmentDto {
    private Long id;

    @NotBlank(message = "Nome obbligatorio")
    private String name;

    @NotNull(message = "Tipo obbligatorio")
    private InvestmentType type;

    private String ticker;

    @NotNull(message = "Controvalore obbligatorio")
    @PositiveOrZero(message = "Controvalore non valido")
    private Double currentValue;

    @NotNull(message = "Capitale investito obbligatorio")
    @PositiveOrZero(message = "Capitale investito non valido")
    private Double investedCapital;

    private Double recurringAmount;
    private Integer recurringDay;
    private boolean pacActive;
    private Double stocksPercent;
    private Double bondsPercent;
    private Double governmentBondsPercent;
    private Double cashPercent;
    private Double otherPercent;
    private List<InvestmentComponent> components;
    private List<InvestmentSnapshot> snapshots;
    private LocalDate lastUpdateDate;
    private Double gainLoss;
    private Double gainLossPercent;
    private Double allocationPercent;
}

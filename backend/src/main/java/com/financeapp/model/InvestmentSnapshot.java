package com.financeapp.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentSnapshot {
    private String month;
    private Double investedCapital;
    private Double value;
    private Double currentValue;
}

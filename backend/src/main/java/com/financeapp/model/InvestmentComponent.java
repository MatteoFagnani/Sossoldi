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
public class InvestmentComponent {
    private String assetClass;
    private String name;
    private String ticker;
    private Double percentage;
    private Double currentValue;
}

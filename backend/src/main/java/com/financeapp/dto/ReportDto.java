package com.financeapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDto {
    private String title;
    private Double totalIncome;
    private Double totalExpense;
    private Double netBalance;
    private Map<String, Double> dataPoints; // E.g. CategoryName -> Amount OR Month -> Amount
    private Map<String, Double> incomeDataPoints;
    private Map<String, Double> expenseDataPoints;
}

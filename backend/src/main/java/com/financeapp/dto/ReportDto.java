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
    private Double totalIncome;
    private Double totalExpense;
    private Map<String, Double> dataPoints;
    private Map<String, Double> incomeDataPoints;
    private Map<String, Double> expenseDataPoints;
}

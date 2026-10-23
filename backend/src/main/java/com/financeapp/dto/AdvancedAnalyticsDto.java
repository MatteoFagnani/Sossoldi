package com.financeapp.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class AdvancedAnalyticsDto extends CashFlowDto {

    private int year;
    private Integer month;
    private String periodLabel;

    // --- Comparison with previous period (MoM or YoY) ---
    private double prevTotalIncome;
    private double prevTotalExpense;
    private double prevNetFlow;
    private double prevSavingsRate;
    private Double incomeChangePct;
    private Double expenseChangePct;
    private Double netFlowChangePct;
    private List<CategoryMoMChange> categoryChanges;

    // --- Financial Profile & Strategy ---
    private String financialProfile;
    private String financialProfileName;
    private String financialProfileDescription;
    private double targetNeedsPercent;
    private double targetWantsPercent;
    private double targetSavingsPercent;
    private double idealRunwayMonthsMin;
    private double idealRunwayMonthsMax;

    // --- Budget Allocation Breakdown (based on active profile) ---
    private double needsAmount;
    private double needsPercent;         // target 50%
    private double wantsAmount;
    private double wantsPercent;         // target 30%
    private double savingsInvestAmount;
    private double savingsInvestPercent; // target 20%
    private String ruleHealthStatus;     // "BALANCED", "NEEDS_HIGH", "WANTS_HIGH", "SAVINGS_LOW"

    // --- Fixed vs Variable Expenses ---
    private double fixedExpensesAmount;
    private double fixedExpensesPercent;
    private double variableExpensesAmount;
    private double variableExpensesPercent;

    // --- Liquidity, Runway & Financial Safety ---
    private double liquidCapital;         // Checking + Savings + Cash
    private double averageMonthlyExpense; // monthly expense baseline
    private double emergencyRunwayMonths; // liquidCapital / averageMonthlyExpense
    private double dailyBurnRate;         // totalExpense / days in period

    // --- Investment & PAC metrics ---
    private double pacInvestedAmount;
    private double pacInvestedPercentOfIncome;
    private double totalInvestedPortfolioValue;

    @Data
    public static class CategoryMoMChange {
        private Long categoryId;
        private String categoryName;
        private String categoryColor;
        private double currentAmount;
        private double prevAmount;
        private double deltaAmount;
        private Double deltaPercent;
        private boolean increase;
    }
}


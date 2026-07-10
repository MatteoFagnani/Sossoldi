package com.financeapp.dto;

import lombok.Data;
import java.util.List;

@Data
public class CashFlowDto {

    private double totalIncome;
    private double totalExpense;
    private double netFlow;
    private double savingsRate;

    private List<CategoryFlowItem> incomeSources;
    private List<CategoryFlowItem> expenseDestinations;

    private List<MonthlyPoint> monthlyTrend;

    @Data
    public static class CategoryFlowItem {
        private Long categoryId;
        private String categoryName;
        private String categoryColor;
        private double amount;
        private double percentage;
    }

    @Data
    public static class MonthlyPoint {
        private String label;
        private double income;
        private double expense;
        private double net;
    }
}

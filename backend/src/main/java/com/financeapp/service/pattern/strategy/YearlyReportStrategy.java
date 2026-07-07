package com.financeapp.service.pattern.strategy;

import com.financeapp.dto.ReportDto;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class YearlyReportStrategy implements ReportStrategy {

    private final TransactionRepository transactionRepository;

    @Override
    public ReportDto generateReport(User user, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = transactionRepository
                .findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), startDate, endDate);

        double totalIncome = 0.0;
        double totalExpense = 0.0;

        // DataPoints: Map "Month" -> "Net Balance", "Cumulative Income", "Cumulative Expense"
        Map<String, Double> monthlyBalances = new LinkedHashMap<>();
        Map<String, Double> incomeDataPoints = new LinkedHashMap<>();
        Map<String, Double> expenseDataPoints = new LinkedHashMap<>();

        // Initialize map with all 12 months using the given year
        int year = startDate.getYear();
        for (int i = 1; i <= 12; i++) {
            String monthName = LocalDate.of(year, i, 1)
                    .getMonth()
                    .getDisplayName(TextStyle.SHORT, Locale.ITALIAN);
            monthlyBalances.put(monthName, 0.0);
            incomeDataPoints.put(monthName, 0.0);
            expenseDataPoints.put(monthName, 0.0);
        }

        for (Transaction t : transactions) {
            String monthName = t.getDate().getMonth().getDisplayName(TextStyle.SHORT, Locale.ITALIAN);
            double amount = t.getAmount();

            if (t.getType() == TransactionType.INCOME) {
                totalIncome += amount;
                monthlyBalances.put(monthName, monthlyBalances.getOrDefault(monthName, 0.0) + amount);
                incomeDataPoints.put(monthName, incomeDataPoints.getOrDefault(monthName, 0.0) + amount);
            } else {
                totalExpense += amount;
                monthlyBalances.put(monthName, monthlyBalances.getOrDefault(monthName, 0.0) - amount);
                expenseDataPoints.put(monthName, expenseDataPoints.getOrDefault(monthName, 0.0) + amount);
            }
        }

        // Apply cumulative logic
        double runningBalance = 0.0;
        double runningIncome = 0.0;
        double runningExpense = 0.0;
        for (String month : monthlyBalances.keySet()) {
            runningBalance += monthlyBalances.get(month);
            monthlyBalances.put(month, runningBalance);

            runningIncome += incomeDataPoints.get(month);
            incomeDataPoints.put(month, runningIncome);

            runningExpense += expenseDataPoints.get(month);
            expenseDataPoints.put(month, runningExpense);
        }

        return ReportDto.builder()
                .title("Annual Financial Report " + year)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netBalance(totalIncome - totalExpense)
                .dataPoints(monthlyBalances)
                .incomeDataPoints(incomeDataPoints)
                .expenseDataPoints(expenseDataPoints)
                .build();
    }
}

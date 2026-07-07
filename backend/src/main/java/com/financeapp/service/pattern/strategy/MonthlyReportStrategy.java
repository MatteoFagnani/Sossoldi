package com.financeapp.service.pattern.strategy;

import com.financeapp.dto.ReportDto;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class MonthlyReportStrategy implements ReportStrategy {

    private final TransactionRepository transactionRepository;

    @Override
    public ReportDto generateReport(User user, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = transactionRepository
                .findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), startDate, endDate);

        double totalIncome = 0.0;
        double totalExpense = 0.0;

        // DataPoints: Map "Day" -> "Net Balance", "Cumulative Income", "Cumulative Expense"
        Map<String, Double> dailyBalances = new LinkedHashMap<>();
        Map<String, Double> incomeDataPoints = new LinkedHashMap<>();
        Map<String, Double> expenseDataPoints = new LinkedHashMap<>();

        // Initialize maps
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            String day = currentDate.toString();
            dailyBalances.put(day, 0.0);
            incomeDataPoints.put(day, 0.0);
            expenseDataPoints.put(day, 0.0);
            currentDate = currentDate.plusDays(1);
        }

        for (Transaction t : transactions) {
            String day = t.getDate().toString();
            double amount = t.getAmount();

            if (dailyBalances.containsKey(day)) {
                if (t.getType() == TransactionType.INCOME) {
                    totalIncome += amount;
                    dailyBalances.put(day, dailyBalances.get(day) + amount);
                    incomeDataPoints.put(day, incomeDataPoints.get(day) + amount);
                } else {
                    totalExpense += amount;
                    dailyBalances.put(day, dailyBalances.get(day) - amount);
                    expenseDataPoints.put(day, expenseDataPoints.get(day) + amount); // absolute values
                }
            }
        }

        // Apply cumulative logic
        double runningBalance = 0.0;
        double runningIncome = 0.0;
        double runningExpense = 0.0;
        for (String day : dailyBalances.keySet()) {
            runningBalance += dailyBalances.get(day);
            dailyBalances.put(day, runningBalance);

            runningIncome += incomeDataPoints.get(day);
            incomeDataPoints.put(day, runningIncome);

            runningExpense += expenseDataPoints.get(day);
            expenseDataPoints.put(day, runningExpense);
        }

        return ReportDto.builder()
                .title("Monthly Financial Report")
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netBalance(totalIncome - totalExpense)
                .dataPoints(dailyBalances)
                .incomeDataPoints(incomeDataPoints)
                .expenseDataPoints(expenseDataPoints)
                .build();
    }
}

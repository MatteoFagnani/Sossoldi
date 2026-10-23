package com.financeapp.service.report;

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

        Map<String, Double> incomeDataPoints = new LinkedHashMap<>();
        Map<String, Double> expenseDataPoints = new LinkedHashMap<>();

        int year = startDate.getYear();
        for (int i = 1; i <= 12; i++) {
            String monthName = LocalDate.of(year, i, 1)
                    .getMonth()
                    .getDisplayName(TextStyle.SHORT, Locale.ITALIAN);
            incomeDataPoints.put(monthName, 0.0);
            expenseDataPoints.put(monthName, 0.0);
        }

        for (Transaction t : transactions) {
            String monthName = t.getDate().getMonth().getDisplayName(TextStyle.SHORT, Locale.ITALIAN);
            double amount = t.getAmount();

            if (t.getType() == TransactionType.INCOME) {
                totalIncome += amount;
                incomeDataPoints.put(monthName, incomeDataPoints.getOrDefault(monthName, 0.0) + amount);
            } else {
                totalExpense += amount;
                expenseDataPoints.put(monthName, expenseDataPoints.getOrDefault(monthName, 0.0) + amount);
            }
        }

        double runningIncome = 0.0;
        double runningExpense = 0.0;
        for (String month : incomeDataPoints.keySet()) {
            runningIncome += incomeDataPoints.get(month);
            incomeDataPoints.put(month, runningIncome);

            runningExpense += expenseDataPoints.get(month);
            expenseDataPoints.put(month, runningExpense);
        }

        return ReportDto.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .dataPoints(incomeDataPoints)
                .incomeDataPoints(incomeDataPoints)
                .expenseDataPoints(expenseDataPoints)
                .build();
    }
}

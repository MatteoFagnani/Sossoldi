package com.financeapp.service.report;

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

        Map<String, Double> incomeDataPoints = new LinkedHashMap<>();
        Map<String, Double> expenseDataPoints = new LinkedHashMap<>();

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            String day = currentDate.toString();
            incomeDataPoints.put(day, 0.0);
            expenseDataPoints.put(day, 0.0);
            currentDate = currentDate.plusDays(1);
        }

        for (Transaction t : transactions) {
            String day = t.getDate().toString();
            double amount = t.getAmount();

            if (incomeDataPoints.containsKey(day)) {
                if (t.getType() == TransactionType.INCOME) {
                    totalIncome += amount;
                    incomeDataPoints.put(day, incomeDataPoints.get(day) + amount);
                } else {
                    totalExpense += amount;
                    expenseDataPoints.put(day, expenseDataPoints.get(day) + amount);
                }
            }
        }

        double runningIncome = 0.0;
        double runningExpense = 0.0;
        for (String day : incomeDataPoints.keySet()) {
            runningIncome += incomeDataPoints.get(day);
            incomeDataPoints.put(day, runningIncome);

            runningExpense += expenseDataPoints.get(day);
            expenseDataPoints.put(day, runningExpense);
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

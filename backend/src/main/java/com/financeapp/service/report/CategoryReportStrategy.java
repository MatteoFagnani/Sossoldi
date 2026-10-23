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
public class CategoryReportStrategy implements ReportStrategy {

    private final TransactionRepository transactionRepository;

    @Override
    public ReportDto generateReport(User user, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = transactionRepository
                .findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), startDate, endDate);

        Map<String, Double> categoryTotals = new LinkedHashMap<>();

        for (Transaction t : transactions) {
            if (t.getType() == TransactionType.EXPENSE && t.getCategory() != null) {
                categoryTotals.merge(t.getCategory().getName(), t.getAmount(), Double::sum);
            }
        }

        return ReportDto.builder()
                .dataPoints(categoryTotals)
                .build();
    }
}

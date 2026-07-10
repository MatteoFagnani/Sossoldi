package com.financeapp.service;

import com.financeapp.dto.CashFlowDto;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TransactionRepository transactionRepository;

    /**
     * Returns monthly cash flow for a full year.
     */
    public CashFlowDto getYearlyCashFlow(User user, int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        List<Transaction> transactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), start, end);
        return buildCashFlowDto(transactions, year, null);
    }

    /**
     * Returns cash flow for a single month.
     */
    public CashFlowDto getMonthlyCashFlow(User user, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        List<Transaction> transactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), start, end);
        return buildCashFlowDto(transactions, year, month);
    }

    private CashFlowDto buildCashFlowDto(List<Transaction> transactions, int year, Integer month) {
        CashFlowDto dto = new CashFlowDto();

        // --- Totals ---
        double totalIncome = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .mapToDouble(Transaction::getAmount).sum();

        double totalExpense = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .mapToDouble(Transaction::getAmount).sum();

        dto.setTotalIncome(totalIncome);
        dto.setTotalExpense(totalExpense);
        dto.setNetFlow(totalIncome - totalExpense);
        dto.setSavingsRate(totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0);

        // --- Income by category ---
        dto.setIncomeSources(buildCategoryFlow(transactions, TransactionType.INCOME, totalIncome));

        // --- Expense by category ---
        dto.setExpenseDestinations(buildCategoryFlow(transactions, TransactionType.EXPENSE, totalExpense));

        // --- Monthly trend (only meaningful for yearly view) ---
        if (month == null) {
            dto.setMonthlyTrend(buildMonthlyTrend(transactions, year));
        } else {
            dto.setMonthlyTrend(Collections.emptyList());
        }

        return dto;
    }

    private List<CashFlowDto.CategoryFlowItem> buildCategoryFlow(
            List<Transaction> transactions, TransactionType type, double total) {

        // Group by top-level category (use parent if present, otherwise itself)
        Map<Long, CashFlowDto.CategoryFlowItem> map = new LinkedHashMap<>();

        transactions.stream()
                .filter(t -> t.getType() == type)
                .forEach(t -> {
                    var cat = t.getCategory();
                    // Resolve top-level category
                    var topCat = cat.getParent() != null ? cat.getParent() : cat;
                    Long key = topCat.getId();
                    CashFlowDto.CategoryFlowItem item = map.computeIfAbsent(key, k -> {
                        CashFlowDto.CategoryFlowItem i = new CashFlowDto.CategoryFlowItem();
                        i.setCategoryId(topCat.getId());
                        i.setCategoryName(topCat.getName());
                        i.setCategoryColor(topCat.getColor());
                        i.setAmount(0);
                        return i;
                    });
                    item.setAmount(item.getAmount() + t.getAmount());
                });

        // Calculate percentages and sort descending
        map.values().forEach(item ->
                item.setPercentage(total > 0 ? (item.getAmount() / total) * 100 : 0));

        return map.values().stream()
                .sorted(Comparator.comparingDouble(CashFlowDto.CategoryFlowItem::getAmount).reversed())
                .collect(Collectors.toList());
    }

    private List<CashFlowDto.MonthlyPoint> buildMonthlyTrend(List<Transaction> transactions, int year) {
        List<CashFlowDto.MonthlyPoint> trend = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            final int fm = m;
            double inc = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.INCOME && t.getDate().getMonthValue() == fm)
                    .mapToDouble(Transaction::getAmount).sum();
            double exp = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE && t.getDate().getMonthValue() == fm)
                    .mapToDouble(Transaction::getAmount).sum();

            CashFlowDto.MonthlyPoint point = new CashFlowDto.MonthlyPoint();
            point.setLabel(Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ITALIAN));
            point.setIncome(inc);
            point.setExpense(exp);
            point.setNet(inc - exp);
            trend.add(point);
        }
        return trend;
    }
}

package com.financeapp.service;

import com.financeapp.dto.BudgetStatusDto;
import com.financeapp.dto.DashboardOverviewDto;
import com.financeapp.dto.ReportDto;
import com.financeapp.dto.TransactionDto;
import com.financeapp.model.User;
import com.financeapp.service.pattern.strategy.ReportContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransactionService transactionService;
    private final BudgetService budgetService;
    private final ReportContext reportContext;

    public DashboardOverviewDto getDashboardOverview(User user, Integer month, Integer year) {
        LocalDate now = LocalDate.now();

        // Resolve effective year (default: current year)
        int effectiveYear = (year != null) ? year : now.getYear();
        // month == null means annual view
        boolean isAnnualView = (month == null);

        LocalDate startOfYear = LocalDate.of(effectiveYear, 1, 1);
        LocalDate endOfYear = LocalDate.of(effectiveYear, 12, 31);

        // 1. Get recent transactions (top 5, not filtered by period so the widget always shows latest)
        List<TransactionDto> allTransactions = transactionService.getAllTransactions(user);
        List<TransactionDto> recentTransactions = allTransactions.stream()
                .limit(5)
                .collect(Collectors.toList());

        // 2. Generate Yearly Report
        ReportDto yearlyReport = reportContext.getStrategy("YEARLY")
                .generateReport(user, startOfYear, endOfYear);

        ReportDto monthlyReport;
        ReportDto categoryReport;
        double totalIncome;
        double totalExpense;
        List<BudgetStatusDto> budgetStatuses;

        if (isAnnualView) {
            // Annual view: KPIs come from yearly totals
            totalIncome = yearlyReport.getTotalIncome();
            totalExpense = yearlyReport.getTotalExpense();

            // Category report for the full year
            categoryReport = reportContext.getStrategy("CATEGORY")
                    .generateReport(user, startOfYear, endOfYear);

            // Monthly report is null in annual view (no specific month selected)
            monthlyReport = null;

            // Budget: compute average across all months of the selected year
            budgetStatuses = computeAverageBudgetStatusesForYear(user, effectiveYear);

        } else {
            // Monthly view
            int effectiveMonth = month;
            LocalDate startOfMonth = LocalDate.of(effectiveYear, effectiveMonth, 1);
            LocalDate endOfMonth = YearMonth.of(effectiveYear, effectiveMonth).atEndOfMonth();

            monthlyReport = reportContext.getStrategy("MONTHLY")
                    .generateReport(user, startOfMonth, endOfMonth);

            categoryReport = reportContext.getStrategy("CATEGORY")
                    .generateReport(user, startOfMonth, endOfMonth);

            totalIncome = monthlyReport.getTotalIncome();
            totalExpense = monthlyReport.getTotalExpense();

            budgetStatuses = budgetService.getBudgetStatusesByMonthAndYear(user, effectiveMonth, effectiveYear);
        }

        return new DashboardOverviewDto.Builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .recentTransactions(recentTransactions)
                .budgetStatuses(budgetStatuses)
                .monthlyReport(monthlyReport)
                .yearlyReport(yearlyReport)
                .categoryReport(categoryReport)
                .build();
    }

    /**
     * Computes the average BudgetStatus across all 12 months of a given year.
     * Only months that have data contribute to the average.
     */
    private List<BudgetStatusDto> computeAverageBudgetStatusesForYear(User user, int year) {
        // Accumulate per-category totals across all months
        Map<Long, BudgetStatusDto> template = new HashMap<>();
        Map<Long, double[]> spendingAccumulator = new HashMap<>();  // [totalSpending, totalLimit, count]

        for (int m = 1; m <= 12; m++) {
            List<BudgetStatusDto> monthStatuses = budgetService.getBudgetStatusesByMonthAndYear(user, m, year);
            for (BudgetStatusDto status : monthStatuses) {
                Long catId = status.getCategoryId();
                template.putIfAbsent(catId, status);
                spendingAccumulator.computeIfAbsent(catId, k -> new double[]{0.0, 0.0, 0.0});
                double[] acc = spendingAccumulator.get(catId);
                acc[0] += (status.getCurrentSpending() != null ? status.getCurrentSpending() : 0.0);
                acc[1] += (status.getLimitAmount() != null ? status.getLimitAmount() : 0.0);
                acc[2] += 1.0;
            }
        }

        List<BudgetStatusDto> result = new ArrayList<>();
        for (Map.Entry<Long, BudgetStatusDto> entry : template.entrySet()) {
            Long catId = entry.getKey();
            BudgetStatusDto proto = entry.getValue();
            double[] acc = spendingAccumulator.get(catId);
            double count = acc[2] > 0 ? acc[2] : 1.0;
            double avgSpending = acc[0] / count;
            double avgLimit = acc[1] / count;
            double pctUsed = avgLimit > 0 ? (avgSpending / avgLimit) * 100.0 : 0.0;

            BudgetStatusDto avg = BudgetStatusDto.builder()
                    .id(proto.getId())
                    .categoryId(catId)
                    .categoryName(proto.getCategoryName())
                    .categoryColor(proto.getCategoryColor())
                    .month(null)
                    .year(year)
                    .limitAmount(avgLimit)
                    .percentageOfIncome(proto.getPercentageOfIncome())
                    .automatic(proto.isAutomatic())
                    .currentSpending(avgSpending)
                    .remainingAmount(avgLimit - avgSpending)
                    .percentageUsed(pctUsed)
                    .overridden(false)
                    .status(pctUsed >= 100 ? "EXCEEDED" : pctUsed >= 80 ? "WARNING" : "OK")
                    .build();
            result.add(avg);
        }
        return result;
    }
}

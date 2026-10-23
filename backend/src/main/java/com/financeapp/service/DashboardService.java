package com.financeapp.service;

import com.financeapp.dto.BudgetStatusDto;
import com.financeapp.dto.DashboardOverviewDto;
import com.financeapp.dto.ReportDto;
import com.financeapp.dto.TransactionDto;
import com.financeapp.model.Budget;
import com.financeapp.model.BudgetOverride;
import com.financeapp.model.Transaction;
import com.financeapp.model.User;
import com.financeapp.repository.BudgetOverrideRepository;
import com.financeapp.repository.BudgetRepository;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.service.report.ReportContext;
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
    private final BudgetRepository budgetRepository;
    private final BudgetOverrideRepository budgetOverrideRepository;
    private final TransactionRepository transactionRepository;
    private final ReportContext reportContext;

    public DashboardOverviewDto getDashboardOverview(User user, Integer month, Integer year) {
        LocalDate now = LocalDate.now();
        int effectiveYear = (year != null) ? year : now.getYear();
        boolean isAnnualView = (month == null);

        LocalDate startOfYear = LocalDate.of(effectiveYear, 1, 1);
        LocalDate endOfYear = LocalDate.of(effectiveYear, 12, 31);

        List<TransactionDto> recentTransactions = transactionService.getRecentTransactions(user);

        ReportDto yearlyReport = reportContext.getStrategy("YEARLY")
                .generateReport(user, startOfYear, endOfYear);

        ReportDto monthlyReport;
        ReportDto categoryReport;
        double totalIncome;
        double totalExpense;
        List<BudgetStatusDto> budgetStatuses;

        if (isAnnualView) {
            totalIncome = yearlyReport.getTotalIncome();
            totalExpense = yearlyReport.getTotalExpense();

            categoryReport = reportContext.getStrategy("CATEGORY")
                    .generateReport(user, startOfYear, endOfYear);

            monthlyReport = null;
            budgetStatuses = computeAverageBudgetStatusesForYear(user, effectiveYear, startOfYear, endOfYear);
        } else {
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
     * Computes the average BudgetStatus across all 12 months of a given year using pre-loaded year data (3 queries instead of 36).
     */
    private List<BudgetStatusDto> computeAverageBudgetStatusesForYear(
            User user, int year, LocalDate startOfYear, LocalDate endOfYear) {

        List<Budget> budgets = budgetRepository.findByUserId(user.getId());
        if (budgets.isEmpty()) {
            budgetService.seedDefaultBudgets(user);
            budgets = budgetRepository.findByUserId(user.getId());
        }
        budgets = budgets.stream().filter(b -> b.getCategory() != null).collect(Collectors.toList());

        List<Long> budgetIds = budgets.stream().map(Budget::getId).collect(Collectors.toList());
        List<BudgetOverride> yearOverrides = budgetOverrideRepository.findByBudgetIdInAndYear(budgetIds, year);
        List<Transaction> yearTransactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                user.getId(), startOfYear, endOfYear);

        Map<Integer, List<BudgetOverride>> overridesByMonth = yearOverrides.stream()
                .filter(o -> o.getMonth() != null)
                .collect(Collectors.groupingBy(BudgetOverride::getMonth));

        Map<Integer, List<Transaction>> txByMonth = yearTransactions.stream()
                .collect(Collectors.groupingBy(t -> t.getDate().getMonthValue()));

        Map<Long, BudgetStatusDto> template = new HashMap<>();
        Map<Long, double[]> spendingAccumulator = new HashMap<>();

        for (int m = 1; m <= 12; m++) {
            List<BudgetStatusDto> monthStatuses = budgetService.computeBudgetStatuses(
                    budgets,
                    overridesByMonth.getOrDefault(m, List.of()),
                    txByMonth.getOrDefault(m, List.of()),
                    m,
                    year
            );
            for (BudgetStatusDto status : monthStatuses) {
                Long catId = status.getCategoryId();
                template.putIfAbsent(catId, status);
                double[] acc = spendingAccumulator.computeIfAbsent(catId, k -> new double[]{0.0, 0.0, 0.0});
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
                    .status(BudgetService.resolveStatus(pctUsed))
                    .build();
            result.add(avg);
        }
        return result;
    }
}

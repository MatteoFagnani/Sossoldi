package com.financeapp.service;

import com.financeapp.dto.AccountDto;
import com.financeapp.dto.AdvancedAnalyticsDto;
import com.financeapp.dto.AiFinancialInsightsDto;
import com.financeapp.dto.CashFlowDto;
import com.financeapp.model.AccountType;
import com.financeapp.model.Investment;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.InvestmentRepository;
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
    private final AccountService accountService;
    private final InvestmentRepository investmentRepository;
    private final GeminiService geminiService;

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

    /**
     * Computes deep advanced financial analytics (KPIs, 50/30/20, MoM variations, Fixed vs Variable, Runway).
     */
    public AdvancedAnalyticsDto getAdvancedAnalytics(User user, int year, Integer month) {
        // 1. Current period transactions
        LocalDate currentStart = month != null ? LocalDate.of(year, month, 1) : LocalDate.of(year, 1, 1);
        LocalDate currentEnd = month != null
                ? currentStart.withDayOfMonth(currentStart.lengthOfMonth())
                : LocalDate.of(year, 12, 31);

        List<Transaction> currentTxs = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                user.getId(), currentStart, currentEnd);

        CashFlowDto baseFlow = buildCashFlowDto(currentTxs, year, month);

        AdvancedAnalyticsDto dto = new AdvancedAnalyticsDto();
        // Copy base cash flow values
        dto.setTotalIncome(baseFlow.getTotalIncome());
        dto.setTotalExpense(baseFlow.getTotalExpense());
        dto.setNetFlow(baseFlow.getNetFlow());
        dto.setSavingsRate(baseFlow.getSavingsRate());
        dto.setIncomeSources(baseFlow.getIncomeSources());
        dto.setExpenseDestinations(baseFlow.getExpenseDestinations());
        dto.setMonthlyTrend(baseFlow.getMonthlyTrend());

        dto.setYear(year);
        dto.setMonth(month);

        if (month != null) {
            String monthName = Month.of(month).getDisplayName(TextStyle.FULL, Locale.ITALIAN);
            dto.setPeriodLabel(monthName.substring(0, 1).toUpperCase(Locale.ITALIAN) + monthName.substring(1) + " " + year);
        } else {
            dto.setPeriodLabel("Anno " + year);
        }

        // 2. Previous period comparison
        LocalDate prevStart;
        LocalDate prevEnd;
        if (month != null) {
            int prevYear = month == 1 ? year - 1 : year;
            int prevMonth = month == 1 ? 12 : month - 1;
            prevStart = LocalDate.of(prevYear, prevMonth, 1);
            prevEnd = prevStart.withDayOfMonth(prevStart.lengthOfMonth());
        } else {
            prevStart = LocalDate.of(year - 1, 1, 1);
            prevEnd = LocalDate.of(year - 1, 12, 31);
        }

        List<Transaction> prevTxs = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                user.getId(), prevStart, prevEnd);

        double prevIncome = prevTxs.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .mapToDouble(Transaction::getAmount).sum();

        double prevExpense = prevTxs.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .mapToDouble(Transaction::getAmount).sum();

        double prevNet = prevIncome - prevExpense;
        double prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpense) / prevIncome) * 100.0 : 0.0;

        dto.setPrevTotalIncome(prevIncome);
        dto.setPrevTotalExpense(prevExpense);
        dto.setPrevNetFlow(prevNet);
        dto.setPrevSavingsRate(prevSavingsRate);

        if (prevIncome > 0) {
            dto.setIncomeChangePct(((dto.getTotalIncome() - prevIncome) / prevIncome) * 100.0);
        }
        if (prevExpense > 0) {
            dto.setExpenseChangePct(((dto.getTotalExpense() - prevExpense) / prevExpense) * 100.0);
        }
        if (Math.abs(prevNet) > 0.001) {
            dto.setNetFlowChangePct(((dto.getNetFlow() - prevNet) / Math.abs(prevNet)) * 100.0);
        }

        // 3. Category MoM Changes
        dto.setCategoryChanges(buildCategoryMoMChanges(currentTxs, prevTxs));

        // Profile configuration
        var profile = user.getFinancialProfile();
        dto.setFinancialProfile(profile.name());
        dto.setFinancialProfileName(profile.getDisplayName());
        dto.setFinancialProfileDescription(profile.getDescription());
        dto.setTargetNeedsPercent(profile.getTargetNeedsPercent());
        dto.setTargetWantsPercent(profile.getTargetWantsPercent());
        dto.setTargetSavingsPercent(profile.getTargetSavingsPercent());
        dto.setIdealRunwayMonthsMin(profile.getRunwayMonthsMin());
        dto.setIdealRunwayMonthsMax(profile.getRunwayMonthsMax());

        // 4. Budget Allocation Breakdown (based on profile targets)
        compute50_30_20Rule(dto, currentTxs, profile);

        // 5. Fixed vs Variable Expenses
        computeFixedVsVariable(dto, currentTxs);

        // 6. Liquidity, Runway and Burn Rate
        computeLiquidityAndRunway(user, dto, year, month);

        // 7. Investment & PAC Metrics
        computeInvestmentAndPac(user, dto, month);

        return dto;
    }

    /**
     * Generates strategic financial coaching via Gemini with strict zero-amount privacy.
     */
    public AiFinancialInsightsDto getAiFinancialInsights(User user, int year, Integer month) {
        AdvancedAnalyticsDto advanced = getAdvancedAnalytics(user, year, month);
        return geminiService.generateFinancialAdvice(user, advanced);
    }

    private void compute50_30_20Rule(AdvancedAnalyticsDto dto, List<Transaction> transactions, com.financeapp.model.FinancialProfileType profile) {
        double needsAmount = 0.0;
        double wantsAmount = 0.0;
        double savingsDirectAmount = 0.0;

        for (Transaction t : transactions) {
            if (t.getType() != TransactionType.EXPENSE) {
                continue;
            }
            String catName = getTopCategoryName(t);
            if (isSavingsCategory(catName)) {
                savingsDirectAmount += t.getAmount();
            } else if (isNeedCategory(catName)) {
                needsAmount += t.getAmount();
            } else {
                wantsAmount += t.getAmount();
            }
        }

        // In 50/30/20 rule, savings is direct savings expense + positive net cash flow if income covers it
        double netSurplus = Math.max(0.0, dto.getNetFlow());
        double totalSavingsAndInvest = savingsDirectAmount + netSurplus;

        dto.setNeedsAmount(needsAmount);
        dto.setWantsAmount(wantsAmount);
        dto.setSavingsInvestAmount(totalSavingsAndInvest);

        // Baseline: percentage of income if income > 0, otherwise percentage of total expense
        double baseForPercent = dto.getTotalIncome() > 0 ? dto.getTotalIncome() : dto.getTotalExpense();
        if (baseForPercent > 0) {
            dto.setNeedsPercent((needsAmount / baseForPercent) * 100.0);
            dto.setWantsPercent((wantsAmount / baseForPercent) * 100.0);
            dto.setSavingsInvestPercent((totalSavingsAndInvest / baseForPercent) * 100.0);
        } else {
            dto.setNeedsPercent(0.0);
            dto.setWantsPercent(0.0);
            dto.setSavingsInvestPercent(0.0);
        }

        // Determine health status tailored to the user's active financial profile
        double targetNeeds = profile.getTargetNeedsPercent();
        double targetWants = profile.getTargetWantsPercent();
        double targetSavings = profile.getTargetSavingsPercent();

        if (dto.getNeedsPercent() > targetNeeds + 5.0) {
            dto.setRuleHealthStatus("NEEDS_HIGH");
        } else if (dto.getWantsPercent() > targetWants + 5.0) {
            dto.setRuleHealthStatus("WANTS_HIGH");
        } else if (dto.getSavingsInvestPercent() < targetSavings - 5.0) {
            dto.setRuleHealthStatus("SAVINGS_LOW");
        } else {
            dto.setRuleHealthStatus("BALANCED");
        }
    }

    private void computeFixedVsVariable(AdvancedAnalyticsDto dto, List<Transaction> transactions) {
        double fixedAmount = 0.0;
        double variableAmount = 0.0;

        for (Transaction t : transactions) {
            if (t.getType() != TransactionType.EXPENSE) {
                continue;
            }
            String catName = getTopCategoryName(t);
            if (isFixedExpenseCategory(catName)) {
                fixedAmount += t.getAmount();
            } else {
                variableAmount += t.getAmount();
            }
        }

        dto.setFixedExpensesAmount(fixedAmount);
        dto.setVariableExpensesAmount(variableAmount);

        double totalExp = dto.getTotalExpense();
        if (totalExp > 0) {
            dto.setFixedExpensesPercent((fixedAmount / totalExp) * 100.0);
            dto.setVariableExpensesPercent((variableAmount / totalExp) * 100.0);
        } else {
            dto.setFixedExpensesPercent(0.0);
            dto.setVariableExpensesPercent(0.0);
        }
    }

    private void computeLiquidityAndRunway(User user, AdvancedAnalyticsDto dto, int year, Integer month) {
        List<AccountDto> accounts = accountService.getAccounts(user);

        // Liquid accounts = non-archived Checking, Savings, Cash (exclude INVESTMENT accounts)
        double liquidCapital = accounts.stream()
                .filter(a -> !a.isArchived() && a.getType() != AccountType.INVESTMENT)
                .mapToDouble(a -> Math.max(0.0, a.getCurrentBalance()))
                .sum();
        dto.setLiquidCapital(liquidCapital);

        // Average monthly expense baseline
        double avgMonthlyExpense;
        int daysInPeriod;
        if (month != null) {
            avgMonthlyExpense = dto.getTotalExpense();
            daysInPeriod = LocalDate.of(year, month, 1).lengthOfMonth();
        } else {
            int currentYear = LocalDate.now().getYear();
            int monthsPassed = (year == currentYear) ? Math.max(1, LocalDate.now().getMonthValue()) : 12;
            avgMonthlyExpense = monthsPassed > 0 ? dto.getTotalExpense() / monthsPassed : dto.getTotalExpense();
            daysInPeriod = LocalDate.of(year, 1, 1).lengthOfYear();
        }
        dto.setAverageMonthlyExpense(avgMonthlyExpense);

        // Runway months
        if (avgMonthlyExpense > 0) {
            dto.setEmergencyRunwayMonths(liquidCapital / avgMonthlyExpense);
        } else {
            dto.setEmergencyRunwayMonths(liquidCapital > 0 ? 12.0 : 0.0);
        }

        // Daily Burn Rate
        dto.setDailyBurnRate(daysInPeriod > 0 ? dto.getTotalExpense() / daysInPeriod : 0.0);
    }

    private void computeInvestmentAndPac(User user, AdvancedAnalyticsDto dto, Integer month) {
        List<Investment> investments = investmentRepository.findByUserIdOrderByNameAsc(user.getId());

        double totalPortfolioValue = investments.stream()
                .mapToDouble(inv -> inv.getCurrentValue() != null ? inv.getCurrentValue() : 0.0)
                .sum();
        dto.setTotalInvestedPortfolioValue(totalPortfolioValue);

        double pacMonthlyDeclared = investments.stream()
                .filter(Investment::isPacActive)
                .mapToDouble(inv -> inv.getRecurringAmount() != null ? inv.getRecurringAmount() : 0.0)
                .sum();

        double pacAmount = (month != null) ? pacMonthlyDeclared : (pacMonthlyDeclared * 12.0);
        dto.setPacInvestedAmount(pacAmount);

        if (dto.getTotalIncome() > 0) {
            dto.setPacInvestedPercentOfIncome((pacAmount / dto.getTotalIncome()) * 100.0);
        } else {
            dto.setPacInvestedPercentOfIncome(0.0);
        }
    }

    private List<AdvancedAnalyticsDto.CategoryMoMChange> buildCategoryMoMChanges(
            List<Transaction> currentTxs, List<Transaction> prevTxs) {

        Map<Long, AdvancedAnalyticsDto.CategoryMoMChange> map = new HashMap<>();

        // Group current expenses
        currentTxs.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE && t.getCategory() != null)
                .forEach(t -> {
                    var topCat = t.getCategory().getParent() != null ? t.getCategory().getParent() : t.getCategory();
                    AdvancedAnalyticsDto.CategoryMoMChange item = map.computeIfAbsent(topCat.getId(), k -> {
                        AdvancedAnalyticsDto.CategoryMoMChange change = new AdvancedAnalyticsDto.CategoryMoMChange();
                        change.setCategoryId(topCat.getId());
                        change.setCategoryName(topCat.getName());
                        change.setCategoryColor(topCat.getColor());
                        return change;
                    });
                    item.setCurrentAmount(item.getCurrentAmount() + t.getAmount());
                });

        // Group previous expenses
        prevTxs.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE && t.getCategory() != null)
                .forEach(t -> {
                    var topCat = t.getCategory().getParent() != null ? t.getCategory().getParent() : t.getCategory();
                    AdvancedAnalyticsDto.CategoryMoMChange item = map.computeIfAbsent(topCat.getId(), k -> {
                        AdvancedAnalyticsDto.CategoryMoMChange change = new AdvancedAnalyticsDto.CategoryMoMChange();
                        change.setCategoryId(topCat.getId());
                        change.setCategoryName(topCat.getName());
                        change.setCategoryColor(topCat.getColor());
                        return change;
                    });
                    item.setPrevAmount(item.getPrevAmount() + t.getAmount());
                });

        // Calculate deltas
        for (AdvancedAnalyticsDto.CategoryMoMChange change : map.values()) {
            double delta = change.getCurrentAmount() - change.getPrevAmount();
            change.setDeltaAmount(delta);
            change.setIncrease(delta > 0);
            if (change.getPrevAmount() > 0) {
                change.setDeltaPercent((delta / change.getPrevAmount()) * 100.0);
            } else if (change.getCurrentAmount() > 0) {
                change.setDeltaPercent(100.0);
            } else {
                change.setDeltaPercent(0.0);
            }
        }

        return map.values().stream()
                .sorted(Comparator.comparingDouble((AdvancedAnalyticsDto.CategoryMoMChange c) -> Math.abs(c.getDeltaAmount())).reversed())
                .collect(Collectors.toList());
    }

    private String getTopCategoryName(Transaction t) {
        if (t.getCategory() == null) return "Altro";
        var cat = t.getCategory();
        return cat.getParent() != null ? cat.getParent().getName() : cat.getName();
    }

    private boolean isNeedCategory(String name) {
        if (name == null) return false;
        String lower = name.toLowerCase(Locale.ROOT);
        return lower.contains("casa") || lower.contains("utenze") || lower.contains("bollett") ||
                lower.contains("affitto") || lower.contains("mutuo") || lower.contains("spesa") ||
                lower.contains("alimentar") || lower.contains("supermercat") || lower.contains("salute") ||
                lower.contains("farmacia") || lower.contains("med") || lower.contains("trasport") ||
                lower.contains("carburant") || lower.contains("benzina") || lower.contains("tasse") ||
                lower.contains("assicura") || lower.contains("condominio") || lower.contains("bollo");
    }

    private boolean isSavingsCategory(String name) {
        if (name == null) return false;
        String lower = name.toLowerCase(Locale.ROOT);
        return lower.contains("investiment") || lower.contains("pac") || lower.contains("risparmio") ||
                lower.contains("fondo emergenza") || lower.contains("pensione") || lower.contains("azioni") ||
                lower.contains("etf") || lower.contains("crypto") || lower.contains("titoli") ||
                lower.contains("obbligazioni");
    }

    private boolean isFixedExpenseCategory(String name) {
        if (name == null) return false;
        String lower = name.toLowerCase(Locale.ROOT);
        return lower.contains("affitto") || lower.contains("mutuo") || lower.contains("bollett") ||
                lower.contains("utenze") || lower.contains("internet") || lower.contains("telefono") ||
                lower.contains("abbonament") || lower.contains("streaming") || lower.contains("assicura") ||
                lower.contains("rata") || lower.contains("rate") || lower.contains("condominio") ||
                lower.contains("tasse") || lower.contains("canone");
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


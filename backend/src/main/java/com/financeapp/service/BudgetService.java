package com.financeapp.service;

import com.financeapp.dto.BudgetDto;
import com.financeapp.dto.BudgetStatusDto;
import com.financeapp.dto.BudgetUpdateDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.BudgetMapper;
import com.financeapp.model.Budget;
import com.financeapp.model.BudgetOverride;
import com.financeapp.model.Category;
import com.financeapp.model.FinancialProfileType;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.BudgetOverrideRepository;
import com.financeapp.repository.BudgetRepository;
import com.financeapp.repository.CategoryRepository;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetMapper budgetMapper;
    private final CategoryService categoryService;
    private final TransactionRepository transactionRepository;
    private final BudgetOverrideRepository budgetOverrideRepository;

    public static String resolveStatus(double percentageUsed) {
        if (percentageUsed >= 100) {
            return "EXCEEDED";
        }
        if (percentageUsed >= 80) {
            return "WARNING";
        }
        return "OK";
    }

    public List<BudgetStatusDto> getBudgetStatusesByMonthAndYear(User user, Integer month, Integer year) {
        List<Budget> budgets = budgetRepository.findByUserId(user.getId());
        if (budgets.isEmpty()) {
            seedDefaultBudgets(user);
            budgets = budgetRepository.findByUserId(user.getId());
        }

        budgets = budgets.stream()
                .filter(b -> b.getCategory() != null)
                .collect(Collectors.toList());

        List<Long> budgetIds = budgets.stream().map(Budget::getId).collect(Collectors.toList());
        List<BudgetOverride> overrides = budgetOverrideRepository.findByBudgetIdInAndMonthAndYear(budgetIds, month, year);

        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = YearMonth.of(year, month).atEndOfMonth();

        List<Transaction> monthTransactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                user.getId(), startOfMonth, endOfMonth);

        return computeBudgetStatuses(budgets, overrides, monthTransactions, month, year);
    }

    public List<BudgetStatusDto> computeBudgetStatuses(
            List<Budget> budgets,
            List<BudgetOverride> overrides,
            List<Transaction> monthTransactions,
            Integer month,
            Integer year) {

        double totalIncome = monthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .mapToDouble(Transaction::getAmount)
                .sum();

        Map<Long, Double> spendingByCategoryId = new HashMap<>();
        for (Transaction t : monthTransactions) {
            if (t.getType() == TransactionType.EXPENSE && t.getCategory() != null) {
                Long catId = t.getCategory().getId();
                spendingByCategoryId.merge(catId, t.getAmount(), Double::sum);

                if (t.getCategory().getParent() != null) {
                    Long parentId = t.getCategory().getParent().getId();
                    spendingByCategoryId.merge(parentId, t.getAmount(), Double::sum);
                }
            }
        }

        Map<Long, BudgetOverride> overrideByBudgetId = overrides.stream()
                .collect(Collectors.toMap(o -> o.getBudget().getId(), o -> o, (existing, replacementVal) -> existing));

        return budgets.stream().map(budget -> {
            Double effectiveLimit = budget.getLimitAmount();
            BudgetOverride override = overrideByBudgetId.get(budget.getId());

            if (override != null) {
                if (override.getAmount() != null) {
                    effectiveLimit = override.getAmount();
                } else if (override.getPercentageOfIncome() != null) {
                    effectiveLimit = totalIncome > 0
                            ? totalIncome * (override.getPercentageOfIncome() / 100.0)
                            : (budget.getLimitAmount() != null ? budget.getLimitAmount() : 0.0);
                }
            } else if (budget.getPercentageOfIncome() != null) {
                effectiveLimit = totalIncome > 0
                        ? totalIncome * (budget.getPercentageOfIncome() / 100.0)
                        : (budget.getLimitAmount() != null ? budget.getLimitAmount() : 0.0);
            }

            final double limit = effectiveLimit != null ? effectiveLimit : 0.0;
            double currentSpending = spendingByCategoryId.getOrDefault(budget.getCategory().getId(), 0.0);
            double percentageUsed = limit > 0 ? (currentSpending / limit) * 100 : 0;

            Double effectivePct = (override != null && override.getPercentageOfIncome() != null)
                    ? override.getPercentageOfIncome()
                    : budget.getPercentageOfIncome();

            return BudgetStatusDto.builder()
                    .id(budget.getId())
                    .categoryId(budget.getCategory().getId())
                    .categoryName(budget.getCategory().getName())
                    .categoryColor(budget.getCategory().getColor())
                    .month(month)
                    .year(year)
                    .limitAmount(limit)
                    .percentageOfIncome(effectivePct)
                    .automatic(budget.isAutomatic())
                    .currentSpending(currentSpending)
                    .remainingAmount(limit - currentSpending)
                    .percentageUsed(percentageUsed)
                    .overridden(override != null)
                    .status(resolveStatus(percentageUsed))
                    .build();
        }).collect(Collectors.toList());
    }

    public record ProfileBudgetRec(double percentageOfIncome, double baselineAmount) {}

    public static Map<String, ProfileBudgetRec> getRecommendationsForProfile(FinancialProfileType profile) {
        Map<String, ProfileBudgetRec> map = new LinkedHashMap<>();
        if (profile == null) {
            profile = FinancialProfileType.BALANCED_50_30_20;
        }

        switch (profile) {
            case STUDENT -> {
                map.put("Casa & Utenze", new ProfileBudgetRec(35.0, 350.0));
                map.put("Spesa Alimentare", new ProfileBudgetRec(20.0, 200.0));
                map.put("Trasporti", new ProfileBudgetRec(10.0, 60.0));
                map.put("Salute & Benessere", new ProfileBudgetRec(5.0, 40.0));
                map.put("Svago & Uscite", new ProfileBudgetRec(8.0, 80.0));
                map.put("Shopping & Personale", new ProfileBudgetRec(4.0, 40.0));
                map.put("Abbonamenti & Servizi", new ProfileBudgetRec(3.0, 20.0));
                map.put("Investimenti & Risparmio", new ProfileBudgetRec(15.0, 50.0));
            }
            case BALANCED_50_30_20 -> {
                map.put("Casa & Utenze", new ProfileBudgetRec(25.0, 500.0));
                map.put("Spesa Alimentare", new ProfileBudgetRec(15.0, 300.0));
                map.put("Trasporti", new ProfileBudgetRec(7.0, 150.0));
                map.put("Salute & Benessere", new ProfileBudgetRec(3.0, 60.0));
                map.put("Svago & Uscite", new ProfileBudgetRec(14.0, 250.0));
                map.put("Shopping & Personale", new ProfileBudgetRec(8.0, 150.0));
                map.put("Abbonamenti & Servizi", new ProfileBudgetRec(4.0, 50.0));
                map.put("Viaggi & Vacanze", new ProfileBudgetRec(4.0, 100.0));
                map.put("Investimenti & Risparmio", new ProfileBudgetRec(20.0, 400.0));
            }
            case FREELANCER -> {
                map.put("Casa & Utenze", new ProfileBudgetRec(30.0, 600.0));
                map.put("Spesa Alimentare", new ProfileBudgetRec(18.0, 350.0));
                map.put("Trasporti", new ProfileBudgetRec(8.0, 160.0));
                map.put("Salute & Benessere", new ProfileBudgetRec(4.0, 80.0));
                map.put("Svago & Uscite", new ProfileBudgetRec(10.0, 200.0));
                map.put("Shopping & Personale", new ProfileBudgetRec(5.0, 100.0));
                map.put("Abbonamenti & Servizi", new ProfileBudgetRec(5.0, 100.0));
                map.put("Investimenti & Risparmio", new ProfileBudgetRec(20.0, 450.0));
            }
            case FIRE_SEEKER -> {
                map.put("Casa & Utenze", new ProfileBudgetRec(18.0, 400.0));
                map.put("Spesa Alimentare", new ProfileBudgetRec(10.0, 200.0));
                map.put("Trasporti", new ProfileBudgetRec(5.0, 100.0));
                map.put("Salute & Benessere", new ProfileBudgetRec(2.0, 50.0));
                map.put("Svago & Uscite", new ProfileBudgetRec(8.0, 150.0));
                map.put("Shopping & Personale", new ProfileBudgetRec(4.0, 80.0));
                map.put("Abbonamenti & Servizi", new ProfileBudgetRec(3.0, 40.0));
                map.put("Investimenti & Risparmio", new ProfileBudgetRec(50.0, 1200.0));
            }
            case FAMILY -> {
                map.put("Casa & Utenze", new ProfileBudgetRec(32.0, 800.0));
                map.put("Spesa Alimentare", new ProfileBudgetRec(20.0, 500.0));
                map.put("Trasporti", new ProfileBudgetRec(8.0, 200.0));
                map.put("Salute & Benessere", new ProfileBudgetRec(5.0, 120.0));
                map.put("Svago & Uscite", new ProfileBudgetRec(7.0, 150.0));
                map.put("Shopping & Personale", new ProfileBudgetRec(5.0, 120.0));
                map.put("Abbonamenti & Servizi", new ProfileBudgetRec(3.0, 50.0));
                map.put("Investimenti & Risparmio", new ProfileBudgetRec(20.0, 400.0));
            }
            case DEBT_REPAYMENT -> {
                map.put("Casa & Utenze", new ProfileBudgetRec(35.0, 500.0));
                map.put("Spesa Alimentare", new ProfileBudgetRec(20.0, 300.0));
                map.put("Trasporti", new ProfileBudgetRec(10.0, 150.0));
                map.put("Salute & Benessere", new ProfileBudgetRec(5.0, 70.0));
                map.put("Svago & Uscite", new ProfileBudgetRec(5.0, 80.0));
                map.put("Shopping & Personale", new ProfileBudgetRec(3.0, 50.0));
                map.put("Abbonamenti & Servizi", new ProfileBudgetRec(2.0, 30.0));
                map.put("Investimenti & Risparmio", new ProfileBudgetRec(20.0, 300.0));
            }
        }
        return map;
    }

    public void seedDefaultBudgets(User user) {
        applyFinancialProfileBudgets(user, user.getFinancialProfile());
    }

    public void applyFinancialProfileBudgets(User user, FinancialProfileType profile) {
        if (profile == null) {
            profile = FinancialProfileType.BALANCED_50_30_20;
        }

        Map<String, ProfileBudgetRec> recs = getRecommendationsForProfile(profile);
        List<Category> expenseCategories = categoryRepository.findByUserIdAndType(user.getId(), TransactionType.EXPENSE);

        for (Map.Entry<String, ProfileBudgetRec> entry : recs.entrySet()) {
            String catName = entry.getKey();
            ProfileBudgetRec rec = entry.getValue();

            expenseCategories.stream()
                    .filter(c -> c.getParent() == null && c.getName().equalsIgnoreCase(catName))
                    .findFirst()
                    .ifPresent(category -> {
                        Budget budget = budgetRepository.findByUserIdAndCategoryId(user.getId(), category.getId())
                                .orElse(Budget.builder()
                                        .user(user)
                                        .category(category)
                                        .build());

                        budget.setPercentageOfIncome(rec.percentageOfIncome());
                        budget.setLimitAmount(rec.baselineAmount());
                        budget.setAutomatic(true);
                        budgetRepository.save(budget);
                    });
        }
    }

    public BudgetDto createBudget(User user, BudgetDto budgetDto) {
        Category category = categoryService.getCategoryAndVerifyOwner(budgetDto.getCategoryId(), user);

        if (category.getType() != TransactionType.EXPENSE) {
            throw new IllegalArgumentException("Budgets can only be set for EXPENSE categories");
        }

        if (budgetRepository.findByUserIdAndCategoryId(user.getId(), category.getId()).isPresent()) {
            throw new IllegalArgumentException("A budget already exists for this category");
        }

        Budget budget = budgetMapper.toEntity(budgetDto);
        budget.setUser(user);
        budget.setCategory(category);

        Budget savedBudget = budgetRepository.save(budget);
        return budgetMapper.toDto(savedBudget);
    }

    public BudgetDto updateBudget(User user, Long id, BudgetUpdateDto budgetDto) {
        Budget budget = getBudgetAndVerifyOwner(id, user);

        if (budgetDto.getType() == BudgetUpdateDto.UpdateType.TEMPORARY) {
            if (budgetDto.getMonth() == null || budgetDto.getYear() == null) {
                throw new IllegalArgumentException("Month and year are required for temporary budget overrides");
            }

            if (budgetDto.getLimitAmount() == null && budgetDto.getPercentageOfIncome() == null) {
                budgetOverrideRepository.deleteByBudgetIdAndMonthAndYear(budget.getId(), budgetDto.getMonth(), budgetDto.getYear());
            } else {
                BudgetOverride override = budgetOverrideRepository
                        .findByBudgetIdAndMonthAndYear(budget.getId(), budgetDto.getMonth(), budgetDto.getYear())
                        .orElse(BudgetOverride.builder()
                                .budget(budget)
                                .month(budgetDto.getMonth())
                                .year(budgetDto.getYear())
                                .build());

                override.setAmount(budgetDto.getLimitAmount());
                override.setPercentageOfIncome(budgetDto.getPercentageOfIncome());
                budgetOverrideRepository.save(override);
            }
        } else {
            budget.setLimitAmount(budgetDto.getLimitAmount());
            budget.setPercentageOfIncome(budgetDto.getPercentageOfIncome());
            budget.setAutomatic(budgetDto.isAutomatic());
            budgetRepository.save(budget);
        }

        return budgetMapper.toDto(budget);
    }

    public void deleteBudget(User user, Long id) {
        Budget budget = getBudgetAndVerifyOwner(id, user);
        budgetRepository.delete(budget);
    }

    private Budget getBudgetAndVerifyOwner(Long id, User user) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to access this budget");
        }

        return budget;
    }
}

package com.financeapp.service;

import com.financeapp.dto.BudgetDto;
import com.financeapp.dto.BudgetStatusDto;
import com.financeapp.dto.BudgetUpdateDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.BudgetMapper;
import com.financeapp.model.Budget;
import com.financeapp.model.BudgetOverride;
import com.financeapp.model.Category;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.BudgetOverrideRepository;
import com.financeapp.repository.BudgetRepository;
import com.financeapp.repository.CategoryRepository;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.service.pattern.state.BudgetContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
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

    public List<BudgetStatusDto> getBudgetStatusesByMonthAndYear(User user, Integer month, Integer year) {
        List<Budget> budgets = budgetRepository.findByUserId(user.getId());
        if (budgets.size() < 5) {
            seedDefaultBudgets(user);
            budgets = budgetRepository.findByUserId(user.getId());
        }

        // Clean out any orphaned budgets if category is null
        budgets = budgets.stream()
                .filter(b -> b.getCategory() != null)
                .collect(Collectors.toList());

        List<Long> budgetIds = budgets.stream().map(Budget::getId).collect(Collectors.toList());
        List<BudgetOverride> overrides = budgetOverrideRepository.findByBudgetIdInAndMonthAndYear(budgetIds, month, year);

        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = YearMonth.of(year, month).atEndOfMonth();

        BudgetContext budgetContext = new BudgetContext();

        List<Transaction> monthTransactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                user.getId(), startOfMonth, endOfMonth);

        double totalIncome = monthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .mapToDouble(Transaction::getAmount)
                .sum();

        // Roll up spending: if transaction has a subcategory, credit both subcategory and parent macro category
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

            // Check for override
            BudgetOverride override = overrideByBudgetId.get(budget.getId());

            if (override != null) {
                if (override.getAmount() != null) {
                    effectiveLimit = override.getAmount();
                } else if (override.getPercentageOfIncome() != null) {
                    effectiveLimit = totalIncome * (override.getPercentageOfIncome() / 100.0);
                }
            } else if (budget.getPercentageOfIncome() != null) {
                effectiveLimit = totalIncome * (budget.getPercentageOfIncome() / 100.0);
            }

            final Double limit = effectiveLimit; // effectiveLimit is effectively final for lambda

            double currentSpending = spendingByCategoryId.getOrDefault(budget.getCategory().getId(), 0.0);

            double percentageUsed = limit > 0 ? (currentSpending / limit) * 100 : 0;

            Double effectivePct = budget.getPercentageOfIncome();
            if (override != null && override.getPercentageOfIncome() != null) {
                effectivePct = override.getPercentageOfIncome();
            }

            BudgetStatusDto statusDto = BudgetStatusDto.builder()
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
                    .build();

            budgetContext.applyState(statusDto);
            return statusDto;
        }).collect(Collectors.toList());
    }

    public void seedDefaultBudgets(User user) {
        seedBudget(user, "Casa & Utenze", 25);
        seedBudget(user, "Spesa Alimentare", 15);
        seedBudget(user, "Trasporti", 7);
        seedBudget(user, "Salute & Benessere", 3);
        seedBudget(user, "Shopping & Personale", 10);
        seedBudget(user, "Svago & Uscite", 15);
        seedBudget(user, "Abbonamenti & Servizi", 5);
        seedBudget(user, "Viaggi & Vacanze", 5);
        seedBudget(user, "Investimenti & Risparmio", 15);
    }

    private void seedBudget(User user, String categoryName, double percentageOfIncome) {
        categoryRepository.findByUserIdAndType(user.getId(), TransactionType.EXPENSE).stream()
                .filter(category -> category.getParent() == null && category.getName().equalsIgnoreCase(categoryName))
                .findFirst()
                .ifPresent(category -> budgetRepository.findByUserIdAndCategoryId(user.getId(), category.getId())
                        .orElseGet(() -> budgetRepository.save(Budget.builder()
                                .user(user)
                                .category(category)
                                .percentageOfIncome(percentageOfIncome)
                                .automatic(true)
                                .build())));
    }

    public List<BudgetDto> getBudgets(User user) {
        if (budgetRepository.findByUserId(user.getId()).size() < 5) {
            seedDefaultBudgets(user);
        }
        return budgetRepository.findByUserId(user.getId())
                .stream()
                .filter(b -> b.getCategory() != null)
                .map(budgetMapper::toDto)
                .collect(Collectors.toList());
    }

    public BudgetDto getBudgetById(User user, Long id) {
        Budget budget = getBudgetAndVerifyOwner(id, user);
        return budgetMapper.toDto(budget);
    }

    public BudgetDto createBudget(User user, BudgetDto budgetDto) {
        Category category = categoryService.getCategoryAndVerifyOwner(budgetDto.getCategoryId(), user);

        if (category.getType() != TransactionType.EXPENSE) {
            throw new IllegalArgumentException("Budgets can only be set for EXPENSE categories");
        }

        if (budgetRepository.findByUserIdAndCategoryId(
                user.getId(), category.getId()).isPresent()) {
            throw new IllegalArgumentException(
                    "A budget already exists for this category");
        }

        Budget budget = budgetMapper.toEntity(budgetDto);
        budget.setUser(user);
        budget.setCategory(category);

        Budget savedBudget = budgetRepository.save(budget);
        return budgetMapper.toDto(savedBudget);
    }

    public BudgetDto updateBudget(User user, Long id, BudgetUpdateDto budgetDto) {
        Budget budget = getBudgetAndVerifyOwner(id, user);

        if (budgetDto.getType() == BudgetUpdateDto.UpdateType.PERMANENT) {
            budget.setLimitAmount(budgetDto.getLimitAmount());
            budget.setPercentageOfIncome(budgetDto.getPercentageOfIncome());
            budget.setAutomatic(budgetDto.isAutomatic());
            budgetRepository.save(budget);
        } else if (budgetDto.getType() == BudgetUpdateDto.UpdateType.TEMPORARY) {
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
            // Default fallback if type is not provided, act as permanent update
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

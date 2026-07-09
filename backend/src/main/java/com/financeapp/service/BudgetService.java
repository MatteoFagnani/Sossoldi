package com.financeapp.service;

import com.financeapp.dto.BudgetDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.BudgetMapper;
import com.financeapp.model.Budget;
import com.financeapp.model.Category;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.BudgetRepository;
import com.financeapp.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;
import com.financeapp.dto.BudgetStatusDto;
import com.financeapp.dto.BudgetUpdateDto;
import com.financeapp.model.BudgetOverride;
import com.financeapp.repository.BudgetOverrideRepository;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.service.pattern.state.BudgetContext;

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
        if (budgets.isEmpty()) {
            seedDefaultBudgets(user);
            budgets = budgetRepository.findByUserId(user.getId());
        }
        
        List<Long> budgetIds = budgets.stream().map(Budget::getId).collect(Collectors.toList());
        List<BudgetOverride> overrides = budgetOverrideRepository.findByBudgetIdInAndMonthAndYear(budgetIds, month, year);
        
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = YearMonth.of(year, month).atEndOfMonth();
        
        BudgetContext budgetContext = new BudgetContext();
        
        double totalIncome = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
            user.getId(), startOfMonth, endOfMonth)
            .stream()
            .filter(t -> t.getType() == TransactionType.INCOME)
            .mapToDouble(com.financeapp.model.Transaction::getAmount)
            .sum();

        return budgets.stream().map(budget -> {
            Double effectiveLimit = budget.getLimitAmount();
            
            // Check for override
            BudgetOverride override = overrides.stream()
                .filter(o -> o.getBudget().getId().equals(budget.getId()))
                .findFirst()
                .orElse(null);
                
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
            
            double currentSpending = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                user.getId(), startOfMonth, endOfMonth)
                .stream()
                .filter(t -> t.getCategory().getId().equals(budget.getCategory().getId()) && 
                            t.getType() == TransactionType.EXPENSE)
                .mapToDouble(com.financeapp.model.Transaction::getAmount)
                .sum();
                
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
        seedBudget(user, "Casa", 25);
        seedBudget(user, "Alimentari", 15);
        seedBudget(user, "Trasporti", 7);
        seedBudget(user, "Salute", 3);
        seedBudget(user, "Shopping", 10);
        seedBudget(user, "Bar e Ristoranti", 8);
        seedBudget(user, "Intrattenimento", 5);
        seedBudget(user, "Viaggi", 5);
        seedBudget(user, "Istruzione", 2);
        seedBudget(user, "Risparmio e investimenti", 20);
    }

    private void seedBudget(User user, String categoryName, double percentageOfIncome) {
        categoryRepository.findByUserIdAndType(user.getId(), TransactionType.EXPENSE).stream()
                .filter(category -> category.getName().equals(categoryName))
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
        if (budgetRepository.findByUserId(user.getId()).isEmpty()) {
            seedDefaultBudgets(user);
        }
        return budgetRepository.findByUserId(user.getId())
                .stream()
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


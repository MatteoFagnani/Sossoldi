package com.financeapp.repository;

import com.financeapp.model.BudgetOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetOverrideRepository extends JpaRepository<BudgetOverride, Long> {
    List<BudgetOverride> findByBudgetIdInAndMonthAndYear(List<Long> budgetIds, Integer month, Integer year);

    List<BudgetOverride> findByBudgetIdInAndYear(List<Long> budgetIds, Integer year);

    Optional<BudgetOverride> findByBudgetIdAndMonthAndYear(Long budgetId, Integer month, Integer year);

    @Transactional
    void deleteByBudgetIdAndMonthAndYear(Long budgetId, Integer month, Integer year);
}

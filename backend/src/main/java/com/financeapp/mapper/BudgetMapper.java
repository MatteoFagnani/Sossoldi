package com.financeapp.mapper;

import com.financeapp.dto.BudgetDto;
import com.financeapp.model.Budget;
import org.springframework.stereotype.Component;

@Component
public class BudgetMapper {

    public BudgetDto toDto(Budget budget) {
        if (budget == null) {
            return null;
        }
        BudgetDto dto = new BudgetDto();
        dto.setId(budget.getId());
        if (budget.getCategory() != null) {
            dto.setCategoryId(budget.getCategory().getId());
            dto.setCategoryName(budget.getCategory().getName());
            dto.setCategoryColor(budget.getCategory().getColor());
        }
        dto.setLimitAmount(budget.getLimitAmount());
        dto.setPercentageOfIncome(budget.getPercentageOfIncome());
        dto.setAutomatic(budget.isAutomatic());
        return dto;
    }

    public Budget toEntity(BudgetDto dto) {
        if (dto == null) {
            return null;
        }
        Budget budget = new Budget();
        budget.setId(dto.getId());
        budget.setLimitAmount(dto.getLimitAmount());
        budget.setPercentageOfIncome(dto.getPercentageOfIncome());
        budget.setAutomatic(dto.isAutomatic());
        return budget;
    }
}

package com.financeapp.controller;

import com.financeapp.dto.BudgetDto;
import com.financeapp.dto.BudgetStatusDto;
import com.financeapp.dto.BudgetUpdateDto;
import com.financeapp.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController extends BaseController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetStatusDto>> getBudgets(
            Authentication authentication,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int rMonth = month != null ? month : LocalDate.now().getMonthValue();
        int rYear = year != null ? year : LocalDate.now().getYear();

        return ResponseEntity.ok(budgetService.getBudgetStatusesByMonthAndYear(getCurrentUser(authentication), rMonth, rYear));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetDto> getBudgetById(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(budgetService.getBudgetById(getCurrentUser(authentication), id));
    }

    @PostMapping
    public ResponseEntity<BudgetDto> createBudget(
            Authentication authentication,
            @Valid @RequestBody BudgetDto budgetDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(budgetService.createBudget(getCurrentUser(authentication), budgetDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetDto> updateBudget(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody BudgetUpdateDto budgetDto) {
        return ResponseEntity.ok(budgetService.updateBudget(getCurrentUser(authentication), id, budgetDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            Authentication authentication,
            @PathVariable Long id) {
        budgetService.deleteBudget(getCurrentUser(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sync-profile")
    public ResponseEntity<List<BudgetStatusDto>> syncBudgetsWithProfile(
            Authentication authentication,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int rMonth = month != null ? month : LocalDate.now().getMonthValue();
        int rYear = year != null ? year : LocalDate.now().getYear();

        var user = getCurrentUser(authentication);
        budgetService.applyFinancialProfileBudgets(user, user.getFinancialProfile());
        return ResponseEntity.ok(budgetService.getBudgetStatusesByMonthAndYear(user, rMonth, rYear));
    }
}

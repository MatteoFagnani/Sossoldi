package com.financeapp.service.report;

import com.financeapp.dto.ReportDto;
import com.financeapp.model.Category;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.TransactionRepository;
import com.financeapp.service.BudgetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportStrategyTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private MonthlyReportStrategy monthlyReportStrategy;

    @InjectMocks
    private CategoryReportStrategy categoryReportStrategy;

    private User testUser;
    private Transaction incomeTx;
    private Transaction expenseTx;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).build();

        Category incomeCat = Category.builder().name("Salary").type(TransactionType.INCOME).build();
        Category expenseCat = Category.builder().name("Rent").type(TransactionType.EXPENSE).build();

        incomeTx = Transaction.builder()
                .amount(2000.0)
                .type(TransactionType.INCOME)
                .category(incomeCat)
                .date(LocalDate.now())
                .build();

        expenseTx = Transaction.builder()
                .amount(500.0)
                .type(TransactionType.EXPENSE)
                .category(expenseCat)
                .date(LocalDate.now())
                .build();
    }

    @Test
    void monthlyReportStrategy_ShouldAggregateIncomeAndExpenseCorrectly() {
        LocalDate start = LocalDate.now().minusDays(1);
        LocalDate end = LocalDate.now().plusDays(1);

        when(transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(eq(1L), any(), any()))
                .thenReturn(Arrays.asList(incomeTx, expenseTx));

        ReportDto report = monthlyReportStrategy.generateReport(testUser, start, end);

        assertNotNull(report);
        assertEquals(2000.0, report.getTotalIncome());
        assertEquals(500.0, report.getTotalExpense());
    }

    @Test
    void categoryReportStrategy_ShouldGroupTotalsByCategory() {
        LocalDate start = LocalDate.now().minusDays(1);
        LocalDate end = LocalDate.now().plusDays(1);

        when(transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(eq(1L), any(), any()))
                .thenReturn(Arrays.asList(incomeTx, expenseTx));

        ReportDto report = categoryReportStrategy.generateReport(testUser, start, end);

        assertNotNull(report);
        assertEquals(500.0, report.getDataPoints().get("Rent"));
        assertEquals(1, report.getDataPoints().size());
    }

    @Test
    void budgetServiceResolveStatus_ShouldReturnCorrectThresholdStatus() {
        assertEquals("OK", BudgetService.resolveStatus(50.0));
        assertEquals("WARNING", BudgetService.resolveStatus(85.0));
        assertEquals("EXCEEDED", BudgetService.resolveStatus(105.0));
    }
}

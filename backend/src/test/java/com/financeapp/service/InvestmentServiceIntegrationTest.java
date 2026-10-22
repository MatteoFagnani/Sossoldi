package com.financeapp.service;

import com.financeapp.dto.AccountDto;
import com.financeapp.dto.InvestmentDto;
import com.financeapp.dto.TransactionDto;
import com.financeapp.model.*;
import com.financeapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class InvestmentServiceIntegrationTest {

    @Autowired
    private InvestmentService investmentService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testCreateRoboAdvisorInvestment() {
        User user = userRepository.findByEmail("investor@test.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("investor_test")
                        .email("investor@test.com")
                        .password("password")
                        .role(Role.USER)
                        .build())
        );

        InvestmentDto dto = new InvestmentDto();
        dto.setName("Moneyfarm Roboadvisor");
        dto.setType(InvestmentType.ROBO_ADVISOR);
        dto.setCurrentValue(5000.0);
        dto.setInvestedCapital(4800.0);
        dto.setTrackingFrequency("YEARLY");
        dto.setComponents(List.of(
                InvestmentComponent.builder()
                        .assetClass("Azioni")
                        .name("Azionario Globale")
                        .percentage(70.0)
                        .build(),
                InvestmentComponent.builder()
                        .assetClass("Obbligazioni")
                        .name("Governativi EU")
                        .percentage(30.0)
                        .build()
        ));
        dto.setSnapshots(List.of(
                InvestmentSnapshot.builder()
                        .month("2024")
                        .investedCapital(2400.0)
                        .currentValue(2500.0)
                        .build(),
                InvestmentSnapshot.builder()
                        .month("2025")
                        .investedCapital(2400.0)
                        .currentValue(5000.0)
                        .build()
        ));

        InvestmentDto result = investmentService.createInvestment(user, dto);
        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(InvestmentType.ROBO_ADVISOR, result.getType());
        assertEquals("YEARLY", result.getTrackingFrequency());
        assertEquals(2, result.getComponents().size());
        assertEquals(2, result.getSnapshots().size());
    }

    @Test
    void testPacExecutionDeductsFromLinkedAccount() {
        User user = userRepository.findByEmail("pac_user@test.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("pac_user")
                        .email("pac_user@test.com")
                        .password("password")
                        .role(Role.USER)
                        .build())
        );

        AccountDto accDto = new AccountDto();
        String accountName = "Conto PAC " + System.currentTimeMillis();
        accDto.setName(accountName);
        accDto.setType(AccountType.INVESTMENT);
        accDto.setInitialBalance(1000.0);
        AccountDto createdAccount = accountService.createAccount(user, accDto);

        InvestmentDto invDto = new InvestmentDto();
        invDto.setName("PAC Roboadvisor " + System.currentTimeMillis());
        invDto.setType(InvestmentType.ROBO_ADVISOR);
        invDto.setCurrentValue(1000.0);
        invDto.setInvestedCapital(1000.0);
        invDto.setPacActive(true);
        invDto.setRecurringAmount(250.0);
        invDto.setRecurringDay(1);
        invDto.setAccountId(createdAccount.getId());
        invDto.setTrackingFrequency("MONTHLY");

        InvestmentDto createdInv = investmentService.createInvestment(user, invDto);
        assertNotNull(createdInv.getId());
        assertEquals(createdAccount.getId(), createdInv.getAccountId());
        assertEquals(accountName, createdInv.getAccountName());
        assertEquals(1000.0, createdInv.getAccountBalance());

        // Execute PAC
        InvestmentDto updatedInv = investmentService.executePac(user, createdInv.getId());
        assertNotNull(updatedInv);
        assertEquals(1250.0, updatedInv.getInvestedCapital());
        assertEquals(1250.0, updatedInv.getCurrentValue());
        assertEquals(750.0, updatedInv.getAccountBalance());

        // Check PAC history
        List<TransactionDto> history = investmentService.getPacHistory(user, createdInv.getId());
        assertEquals(1, history.size());
        assertEquals(250.0, history.get(0).getAmount());
        assertEquals(createdAccount.getId(), history.get(0).getAccountId());

        // Executing again in the same month should fail
        assertThrows(IllegalStateException.class, () -> investmentService.executePac(user, createdInv.getId()));
    }
}

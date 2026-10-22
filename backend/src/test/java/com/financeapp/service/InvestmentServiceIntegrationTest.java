package com.financeapp.service;

import com.financeapp.dto.InvestmentDto;
import com.financeapp.model.*;
import com.financeapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class InvestmentServiceIntegrationTest {

    @Autowired
    private InvestmentService investmentService;

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
}


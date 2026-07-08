package com.financeapp.service;

import com.financeapp.dto.InvestmentDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.model.Investment;
import com.financeapp.model.User;
import com.financeapp.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;

    public List<InvestmentDto> getInvestments(User user) {
        List<Investment> investments = investmentRepository.findByUserIdOrderByNameAsc(user.getId());
        double total = investments.stream().mapToDouble(Investment::getCurrentValue).sum();
        return investments.stream().map(investment -> toDto(investment, total)).toList();
    }

    public InvestmentDto createInvestment(User user, InvestmentDto dto) {
        Investment investment = Investment.builder()
                .name(dto.getName())
                .type(dto.getType())
                .ticker(dto.getTicker())
                .currentValue(dto.getCurrentValue())
                .investedCapital(dto.getInvestedCapital())
                .recurringAmount(dto.getRecurringAmount())
                .recurringDay(dto.getRecurringDay())
                .pacActive(dto.isPacActive())
                .lastUpdateDate(dto.getLastUpdateDate() == null ? LocalDate.now() : dto.getLastUpdateDate())
                .user(user)
                .build();
        return toDto(investmentRepository.save(investment), investment.getCurrentValue());
    }

    public InvestmentDto updateInvestment(User user, Long id, InvestmentDto dto) {
        Investment investment = getInvestmentAndVerifyOwner(id, user);
        investment.setName(dto.getName());
        investment.setType(dto.getType());
        investment.setTicker(dto.getTicker());
        investment.setCurrentValue(dto.getCurrentValue());
        investment.setInvestedCapital(dto.getInvestedCapital());
        investment.setRecurringAmount(dto.getRecurringAmount());
        investment.setRecurringDay(dto.getRecurringDay());
        investment.setPacActive(dto.isPacActive());
        investment.setLastUpdateDate(dto.getLastUpdateDate() == null ? LocalDate.now() : dto.getLastUpdateDate());
        return toDto(investmentRepository.save(investment), investment.getCurrentValue());
    }

    public void deleteInvestment(User user, Long id) {
        investmentRepository.delete(getInvestmentAndVerifyOwner(id, user));
    }

    private Investment getInvestmentAndVerifyOwner(Long id, User user) {
        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investment not found with id: " + id));
        if (!investment.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to access this investment");
        }
        return investment;
    }

    private InvestmentDto toDto(Investment investment, double total) {
        InvestmentDto dto = new InvestmentDto();
        dto.setId(investment.getId());
        dto.setName(investment.getName());
        dto.setType(investment.getType());
        dto.setTicker(investment.getTicker());
        dto.setCurrentValue(investment.getCurrentValue());
        dto.setInvestedCapital(investment.getInvestedCapital());
        dto.setRecurringAmount(investment.getRecurringAmount());
        dto.setRecurringDay(investment.getRecurringDay());
        dto.setPacActive(investment.isPacActive());
        dto.setLastUpdateDate(investment.getLastUpdateDate());
        double gain = investment.getCurrentValue() - investment.getInvestedCapital();
        dto.setGainLoss(gain);
        dto.setGainLossPercent(investment.getInvestedCapital() == 0 ? 0 : gain / investment.getInvestedCapital() * 100);
        dto.setAllocationPercent(total == 0 ? 0 : investment.getCurrentValue() / total * 100);
        return dto;
    }
}

package com.financeapp.service;

import com.financeapp.dto.InvestmentDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.model.Investment;
import com.financeapp.model.InvestmentSnapshot;
import com.financeapp.model.User;
import com.financeapp.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;

    public List<InvestmentDto> getInvestments(User user) {
        List<Investment> investments = investmentRepository.findByUserIdOrderByNameAsc(user.getId());
        Map<Long, List<InvestmentSnapshot>> sortedSnapshotsMap = new HashMap<>();
        for (Investment investment : investments) {
            sortedSnapshotsMap.put(investment.getId(), sortedSnapshots(investment));
        }
        double total = investments.stream()
                .mapToDouble(inv -> effectiveCurrentValue(inv, sortedSnapshotsMap.get(inv.getId())))
                .sum();
        return investments.stream()
                .map(inv -> toDto(inv, total, sortedSnapshotsMap.get(inv.getId())))
                .toList();
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
                .trackingFrequency(dto.getTrackingFrequency() != null ? dto.getTrackingFrequency() : "MONTHLY")
                .stocksPercent(dto.getStocksPercent())
                .bondsPercent(dto.getBondsPercent())
                .governmentBondsPercent(dto.getGovernmentBondsPercent())
                .cashPercent(dto.getCashPercent())
                .otherPercent(dto.getOtherPercent())
                .components(dto.getComponents() == null ? new ArrayList<>() : dto.getComponents())
                .snapshots(dto.getSnapshots() == null ? new ArrayList<>() : dto.getSnapshots())
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
        investment.setTrackingFrequency(dto.getTrackingFrequency() != null ? dto.getTrackingFrequency() : "MONTHLY");
        investment.setStocksPercent(dto.getStocksPercent());
        investment.setBondsPercent(dto.getBondsPercent());
        investment.setGovernmentBondsPercent(dto.getGovernmentBondsPercent());
        investment.setCashPercent(dto.getCashPercent());
        investment.setOtherPercent(dto.getOtherPercent());
        investment.setComponents(dto.getComponents() == null ? new ArrayList<>() : dto.getComponents());
        investment.setSnapshots(dto.getSnapshots() == null ? new ArrayList<>() : dto.getSnapshots());
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
        return toDto(investment, total, sortedSnapshots(investment));
    }

    private InvestmentDto toDto(Investment investment, double total, List<InvestmentSnapshot> snapshots) {
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
        dto.setTrackingFrequency(investment.getTrackingFrequency() != null ? investment.getTrackingFrequency() : "MONTHLY");
        dto.setStocksPercent(investment.getStocksPercent());
        dto.setBondsPercent(investment.getBondsPercent());
        dto.setGovernmentBondsPercent(investment.getGovernmentBondsPercent());
        dto.setCashPercent(investment.getCashPercent());
        dto.setOtherPercent(investment.getOtherPercent());
        dto.setComponents(investment.getComponents());
        dto.setSnapshots(investment.getSnapshots());
        dto.setLastUpdateDate(investment.getLastUpdateDate());
        double currentValue = effectiveCurrentValue(investment, snapshots);
        double investedCapital = effectiveInvestedCapital(investment, snapshots);
        double gain = currentValue - investedCapital;
        dto.setCurrentValue(currentValue);
        dto.setInvestedCapital(investedCapital);
        dto.setGainLoss(gain);
        dto.setGainLossPercent(compoundReturnPercent(investment, snapshots));
        dto.setAllocationPercent(total == 0 ? 0 : currentValue / total * 100);
        return dto;
    }

    private List<InvestmentSnapshot> sortedSnapshots(Investment investment) {
        if (investment.getSnapshots() == null) return List.of();
        return investment.getSnapshots().stream()
                .filter(snapshot -> snapshot.getMonth() != null && !snapshot.getMonth().isBlank())
                .sorted(Comparator.comparing(InvestmentSnapshot::getMonth))
                .toList();
    }

    private double effectiveCurrentValue(Investment investment) {
        return effectiveCurrentValue(investment, sortedSnapshots(investment));
    }

    private double effectiveCurrentValue(Investment investment, List<InvestmentSnapshot> snapshots) {
        if (snapshots == null || snapshots.isEmpty()) return investment.getCurrentValue();
        InvestmentSnapshot last = snapshots.getLast();
        Double value = last.getCurrentValue() != null ? last.getCurrentValue() : last.getValue();
        return value == null ? investment.getCurrentValue() : value;
    }

    private double effectiveInvestedCapital(Investment investment) {
        return effectiveInvestedCapital(investment, sortedSnapshots(investment));
    }

    private double effectiveInvestedCapital(Investment investment, List<InvestmentSnapshot> snapshots) {
        if (snapshots == null || snapshots.isEmpty()) return investment.getInvestedCapital();
        return snapshots.stream().mapToDouble(snapshot -> snapshot.getInvestedCapital() == null ? 0 : snapshot.getInvestedCapital()).sum();
    }

    private double compoundReturnPercent(Investment investment) {
        return compoundReturnPercent(investment, sortedSnapshots(investment));
    }

    private double compoundReturnPercent(Investment investment, List<InvestmentSnapshot> snapshots) {
        if (snapshots == null || snapshots.isEmpty()) {
            return investment.getInvestedCapital() == 0 ? 0 : (investment.getCurrentValue() / investment.getInvestedCapital() - 1) * 100;
        }
        double previousValue = 0;
        double compound = 1;
        for (InvestmentSnapshot snapshot : snapshots) {
            double contribution = snapshot.getInvestedCapital() == null ? 0 : snapshot.getInvestedCapital();
            Double snapVal = snapshot.getCurrentValue() != null ? snapshot.getCurrentValue() : snapshot.getValue();
            double currentValue = snapVal == null ? previousValue + contribution : snapVal;
            double base = previousValue == 0 ? contribution : previousValue;
            if (base > 0) {
                double monthlyReturn = previousValue == 0 ? currentValue / base - 1 : (currentValue - contribution) / base - 1;
                compound *= 1 + monthlyReturn;
            }
            previousValue = currentValue;
        }
        return (compound - 1) * 100;
    }
}

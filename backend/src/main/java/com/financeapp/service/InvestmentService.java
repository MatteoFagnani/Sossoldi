package com.financeapp.service;

import com.financeapp.dto.InvestmentDto;
import com.financeapp.dto.TransactionDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.TransactionMapper;
import com.financeapp.model.Account;
import com.financeapp.model.Category;
import com.financeapp.model.Investment;
import com.financeapp.model.InvestmentSnapshot;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.CategoryRepository;
import com.financeapp.repository.InvestmentRepository;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final AccountService accountService;
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    @Transactional
    public List<InvestmentDto> getInvestments(User user) {
        processDuePacs(user);

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

    @Transactional
    public InvestmentDto createInvestment(User user, InvestmentDto dto) {
        Account account = dto.getAccountId() != null
                ? accountService.getAccountAndVerifyOwner(dto.getAccountId(), user)
                : null;

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
                .account(account)
                .lastPacExecutionMonth(dto.getLastPacExecutionMonth())
                .user(user)
                .build();
        return toDto(investmentRepository.save(investment), investment.getCurrentValue());
    }

    @Transactional
    public InvestmentDto updateInvestment(User user, Long id, InvestmentDto dto) {
        Investment investment = getInvestmentAndVerifyOwner(id, user);
        Account account = dto.getAccountId() != null
                ? accountService.getAccountAndVerifyOwner(dto.getAccountId(), user)
                : null;

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
        investment.setAccount(account);
        if (dto.getLastPacExecutionMonth() != null) {
            investment.setLastPacExecutionMonth(dto.getLastPacExecutionMonth());
        }
        return toDto(investmentRepository.save(investment), investment.getCurrentValue());
    }

    @Transactional
    public void deleteInvestment(User user, Long id) {
        Investment investment = getInvestmentAndVerifyOwner(id, user);
        List<Transaction> transactions = transactionRepository.findByInvestmentIdOrderByDateDesc(id);
        for (Transaction t : transactions) {
            t.setInvestment(null);
        }
        transactionRepository.saveAll(transactions);
        investmentRepository.delete(investment);
    }

    @Transactional
    public InvestmentDto executePac(User user, Long investmentId) {
        Investment investment = getInvestmentAndVerifyOwner(investmentId, user);
        YearMonth currentYm = YearMonth.now();
        String ymStr = currentYm.toString();

        if (ymStr.equals(investment.getLastPacExecutionMonth())) {
            throw new IllegalStateException("La rata PAC per " + ymStr + " è già stata eseguita per questo investimento.");
        }

        boolean executed = executePacForInvestment(investment, LocalDate.now(), false);
        if (!executed) {
            throw new IllegalStateException("Impossibile eseguire il PAC: verifica che sia attivo, abbia un importo ricorrente valido e un conto collegato.");
        }

        return toDto(investment, investment.getCurrentValue());
    }

    @Transactional(readOnly = true)
    public List<TransactionDto> getPacHistory(User user, Long investmentId) {
        getInvestmentAndVerifyOwner(investmentId, user);
        return transactionRepository.findByInvestmentIdOrderByDateDesc(investmentId).stream()
                .map(transactionMapper::toDto)
                .toList();
    }

    @Transactional
    public void processDuePacs(User user) {
        List<Investment> activePacs = investmentRepository.findByUserIdAndPacActiveTrue(user.getId());
        LocalDate today = LocalDate.now();
        YearMonth currentYm = YearMonth.from(today);
        String currentYmStr = currentYm.toString();

        for (Investment inv : activePacs) {
            if (inv.getAccount() == null || inv.getRecurringAmount() == null || inv.getRecurringAmount() <= 0) {
                continue;
            }
            if (currentYmStr.equals(inv.getLastPacExecutionMonth())) {
                continue;
            }

            int day = (inv.getRecurringDay() != null && inv.getRecurringDay() >= 1)
                    ? Math.min(inv.getRecurringDay(), currentYm.lengthOfMonth())
                    : 1;
            LocalDate scheduledDate = currentYm.atDay(day);

            if (!today.isBefore(scheduledDate)) {
                executePacForInvestment(inv, scheduledDate, false);
            }
        }
    }

    public synchronized boolean executePacForInvestment(Investment investment, LocalDate executionDate, boolean force) {
        if (!investment.isPacActive()
                || investment.getAccount() == null
                || investment.getRecurringAmount() == null
                || investment.getRecurringAmount() <= 0) {
            return false;
        }

        YearMonth ym = YearMonth.from(executionDate);
        String ymStr = ym.toString();

        if (!force && ymStr.equals(investment.getLastPacExecutionMonth())) {
            return false;
        }

        Category pacCategory = resolvePacCategory(investment.getUser());

        Transaction tx = Transaction.builder()
                .amount(investment.getRecurringAmount())
                .type(TransactionType.EXPENSE)
                .date(executionDate)
                .description("Versamento PAC " + investment.getName())
                .category(pacCategory)
                .account(investment.getAccount())
                .investment(investment)
                .user(investment.getUser())
                .build();
        transactionRepository.save(tx);

        applyPacToSnapshots(investment, ym, investment.getRecurringAmount());

        investment.setInvestedCapital(investment.getInvestedCapital() + investment.getRecurringAmount());
        investment.setCurrentValue(investment.getCurrentValue() + investment.getRecurringAmount());
        investment.setLastUpdateDate(executionDate);
        investment.setLastPacExecutionMonth(ymStr);

        investmentRepository.save(investment);
        return true;
    }

    private void applyPacToSnapshots(Investment investment, YearMonth ym, double recurringAmount) {
        boolean isYearly = "YEARLY".equalsIgnoreCase(investment.getTrackingFrequency());
        String period = isYearly ? String.valueOf(ym.getYear()) : ym.toString();

        if (investment.getSnapshots() == null) {
            investment.setSnapshots(new ArrayList<>());
        }

        Optional<InvestmentSnapshot> existing = investment.getSnapshots().stream()
                .filter(s -> period.equalsIgnoreCase(s.getMonth()))
                .findFirst();

        if (existing.isPresent()) {
            InvestmentSnapshot snap = existing.get();
            double prevInvested = snap.getInvestedCapital() != null ? snap.getInvestedCapital() : 0.0;
            snap.setInvestedCapital(prevInvested + recurringAmount);

            Double curr = snap.getCurrentValue() != null ? snap.getCurrentValue() : snap.getValue();
            double newVal = (curr == null ? 0.0 : curr) + recurringAmount;
            snap.setCurrentValue(newVal);
            snap.setValue(newVal);
        } else {
            double baselineCapital = investment.getSnapshots().isEmpty()
                    ? (investment.getInvestedCapital() != null ? investment.getInvestedCapital() : 0.0)
                    : 0.0;
            double currentInvVal = investment.getCurrentValue() != null ? investment.getCurrentValue() : 0.0;
            InvestmentSnapshot newSnap = InvestmentSnapshot.builder()
                    .month(period)
                    .investedCapital(baselineCapital + recurringAmount)
                    .value(currentInvVal + recurringAmount)
                    .currentValue(currentInvVal + recurringAmount)
                    .build();
            investment.getSnapshots().add(newSnap);
        }
    }

    private Category resolvePacCategory(User user) {
        Optional<Category> exact = categoryRepository.findFirstByUserIdAndNameIgnoreCase(user.getId(), "Investimenti & PAC");
        if (exact.isPresent()) return exact.get();

        List<Category> byKeyword = categoryRepository.findByUserIdAndNameContainingIgnoreCase(user.getId(), "Investimenti");
        if (!byKeyword.isEmpty()) return byKeyword.get(0);

        List<Category> pacKeyword = categoryRepository.findByUserIdAndNameContainingIgnoreCase(user.getId(), "PAC");
        if (!pacKeyword.isEmpty()) return pacKeyword.get(0);

        List<Category> expenses = categoryRepository.findByUserIdAndType(user.getId(), TransactionType.EXPENSE);
        if (!expenses.isEmpty()) return expenses.get(0);

        categoryService.seedDefaultCategories(user);
        return categoryRepository.findFirstByUserIdAndNameIgnoreCase(user.getId(), "Investimenti & PAC")
                .orElseGet(() -> categoryRepository.findByUserIdAndType(user.getId(), TransactionType.EXPENSE).get(0));
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

        if (investment.getAccount() != null) {
            dto.setAccountId(investment.getAccount().getId());
            dto.setAccountName(investment.getAccount().getName());
            dto.setAccountBalance(accountService.currentBalance(investment.getAccount()));
        }
        dto.setLastPacExecutionMonth(investment.getLastPacExecutionMonth());

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

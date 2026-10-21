package com.financeapp.service;

import com.financeapp.dto.AccountDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.model.Account;
import com.financeapp.model.AccountTransfer;
import com.financeapp.model.AccountType;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.AccountRepository;
import com.financeapp.repository.AccountTransferRepository;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AccountTransferRepository transferRepository;

    public void seedDefaultAccounts(User user) {
        defaultAccountFor(user);
        cashAccountFor(user);
    }

    public List<AccountDto> getAccounts(User user) {
        List<Account> accounts = accountRepository.findByUserIdOrderByArchivedAscNameAsc(user.getId());
        if (accounts.isEmpty()) {
            seedDefaultAccounts(user);
            accounts = accountRepository.findByUserIdOrderByArchivedAscNameAsc(user.getId());
        }

        List<Transaction> userTransactions = transactionRepository.findByUserIdOrderByDateDesc(user.getId());
        List<AccountTransfer> userTransfers = transferRepository.findByUserIdOrderByDateDescIdDesc(user.getId());

        Map<Long, Double> transactionSums = new HashMap<>();
        for (Transaction t : userTransactions) {
            if (t.getAccount() != null) {
                double delta = t.getType() == TransactionType.INCOME ? t.getAmount() : -t.getAmount();
                transactionSums.merge(t.getAccount().getId(), delta, Double::sum);
            }
        }

        Map<Long, Double> transferSums = new HashMap<>();
        for (AccountTransfer transfer : userTransfers) {
            if (transfer.getFromAccount() != null) {
                transferSums.merge(transfer.getFromAccount().getId(), -transfer.getAmount(), Double::sum);
            }
            if (transfer.getToAccount() != null) {
                transferSums.merge(transfer.getToAccount().getId(), transfer.getAmount(), Double::sum);
            }
        }

        return accounts.stream().map(account -> {
            AccountDto dto = toDtoBase(account);
            double txTotal = transactionSums.getOrDefault(account.getId(), 0.0);
            double trTotal = transferSums.getOrDefault(account.getId(), 0.0);
            dto.setCurrentBalance(account.getInitialBalance() + txTotal + trTotal);
            return dto;
        }).toList();
    }

    public AccountDto createAccount(User user, AccountDto dto) {
        if (accountRepository.existsByUserIdAndName(user.getId(), dto.getName())) {
            throw new IllegalArgumentException("Account gia esistente");
        }
        Account account = Account.builder()
                .name(dto.getName())
                .type(dto.getType())
                .initialBalance(dto.getInitialBalance())
                .archived(dto.isArchived())
                .color(dto.getColor())
                .icon(dto.getIcon())
                .user(user)
                .build();
        return toDto(accountRepository.save(account));
    }

    public AccountDto updateAccount(User user, Long id, AccountDto dto) {
        Account account = getAccountAndVerifyOwner(id, user);
        account.setName(dto.getName());
        account.setType(dto.getType());
        account.setInitialBalance(dto.getInitialBalance());
        account.setArchived(dto.isArchived());
        account.setColor(dto.getColor());
        account.setIcon(dto.getIcon());
        return toDto(accountRepository.save(account));
    }

    public void deleteAccount(User user, Long id) {
        Account account = getAccountAndVerifyOwner(id, user);
        if (transactionRepository.existsByAccountId(id) || transferRepository.existsByFromAccountIdOrToAccountId(id, id)) {
            throw new IllegalArgumentException("Impossibile eliminare un conto con movimenti collegati. Archiviarlo o spostare prima le transazioni.");
        }
        accountRepository.delete(account);
    }

    public Account getAccountAndVerifyOwner(Long id, User user) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
        if (!account.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to access this account");
        }
        return account;
    }

    public Account defaultAccountFor(User user) {
        Account account = accountRepository.findFirstByUserIdAndArchivedFalseOrderByIdAsc(user.getId())
                .orElseGet(() -> accountRepository.save(Account.builder()
                        .name("Conto principale")
                        .type(AccountType.CHECKING)
                        .initialBalance(0.0)
                        .archived(false)
                        .color("#3b82f6")
                        .icon("🏦")
                        .user(user)
                        .build()));

        List<Transaction> withoutAccount = transactionRepository.findByUserIdAndAccountIsNull(user.getId());
        if (!withoutAccount.isEmpty()) {
            withoutAccount.forEach(transaction -> transaction.setAccount(account));
            transactionRepository.saveAll(withoutAccount);
        }
        return account;
    }

    public Account cashAccountFor(User user) {
        return accountRepository.findFirstByUserIdAndType(user.getId(), AccountType.CASH)
                .orElseGet(() -> accountRepository.save(Account.builder()
                        .name("Contanti")
                        .type(AccountType.CASH)
                        .initialBalance(0.0)
                        .archived(false)
                        .color("#10b981")
                        .icon("💵")
                        .user(user)
                        .build()));
    }

    private AccountDto toDto(Account account) {
        AccountDto dto = toDtoBase(account);
        dto.setCurrentBalance(currentBalance(account));
        return dto;
    }

    private AccountDto toDtoBase(Account account) {
        AccountDto dto = new AccountDto();
        dto.setId(account.getId());
        dto.setName(account.getName());
        dto.setType(account.getType());
        dto.setInitialBalance(account.getInitialBalance());
        dto.setArchived(account.isArchived());
        dto.setColor(account.getColor());
        dto.setIcon(account.getIcon());
        return dto;
    }

    public double currentBalance(Account account) {
        double transactionTotal = transactionRepository.findByAccountIdOrderByDateDesc(account.getId()).stream()
                .mapToDouble(transaction -> transaction.getType() == TransactionType.INCOME ? transaction.getAmount() : -transaction.getAmount())
                .sum();
        double transferTotal = transferRepository.findByFromAccountIdOrToAccountId(account.getId(), account.getId()).stream()
                .mapToDouble(transfer -> transfer.getToAccount().getId().equals(account.getId()) ? transfer.getAmount() : -transfer.getAmount())
                .sum();
        return account.getInitialBalance() + transactionTotal + transferTotal;
    }
}

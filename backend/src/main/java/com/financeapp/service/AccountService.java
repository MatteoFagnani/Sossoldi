package com.financeapp.service;

import com.financeapp.dto.AccountDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.model.Account;
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

import java.util.List;

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
        seedDefaultAccounts(user);
        return accountRepository.findByUserIdOrderByArchivedAscNameAsc(user.getId()).stream()
                .map(this::toDto)
                .toList();
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
                        .user(user)
                        .build()));
    }

    private AccountDto toDto(Account account) {
        AccountDto dto = new AccountDto();
        dto.setId(account.getId());
        dto.setName(account.getName());
        dto.setType(account.getType());
        dto.setInitialBalance(account.getInitialBalance());
        dto.setArchived(account.isArchived());
        dto.setCurrentBalance(currentBalance(account));
        return dto;
    }

    private double currentBalance(Account account) {
        double transactionTotal = transactionRepository.findByAccountIdOrderByDateDesc(account.getId()).stream()
                .mapToDouble(transaction -> transaction.getType() == TransactionType.INCOME ? transaction.getAmount() : -transaction.getAmount())
                .sum();
        double transferTotal = transferRepository.findByFromAccountIdOrToAccountId(account.getId(), account.getId()).stream()
                .mapToDouble(transfer -> transfer.getToAccount().getId().equals(account.getId()) ? transfer.getAmount() : -transfer.getAmount())
                .sum();
        return account.getInitialBalance() + transactionTotal + transferTotal;
    }
}

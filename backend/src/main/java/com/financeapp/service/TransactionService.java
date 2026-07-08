package com.financeapp.service;

import com.financeapp.dto.AccountMovementDto;
import com.financeapp.dto.TransactionDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.TransactionMapper;
import com.financeapp.model.Account;
import com.financeapp.model.AccountTransfer;
import com.financeapp.model.Category;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.AccountTransferRepository;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountTransferRepository transferRepository;
    private final TransactionMapper transactionMapper;
    private final CategoryService categoryService;
    private final AccountService accountService;

    public List<TransactionDto> getAllTransactions(User user) {
        return transactionRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream()
                .map(transactionMapper::toDto)
                .toList();
    }

    public List<AccountMovementDto> getMovements(User user, Long accountId) {
        if (accountId != null) accountService.getAccountAndVerifyOwner(accountId, user);

        List<Transaction> transactions = accountId == null
                ? transactionRepository.findByUserIdOrderByDateDesc(user.getId())
                : transactionRepository.findByUserIdAndAccountIdOrderByDateDesc(user.getId(), accountId);
        List<AccountTransfer> transfers = accountId == null
                ? transferRepository.findByUserIdOrderByDateDescIdDesc(user.getId())
                : transferRepository.findByUserIdAndFromAccountIdOrUserIdAndToAccountIdOrderByDateDescIdDesc(user.getId(), accountId, user.getId(), accountId);

        return Stream.concat(
                        transactions.stream().map(this::toMovement),
                        transfers.stream().map(transfer -> toMovement(transfer, accountId))
                )
                .sorted(Comparator.comparing(AccountMovementDto::getDate).reversed().thenComparing(Comparator.comparing(AccountMovementDto::getId).reversed()))
                .toList();
    }

    public TransactionDto getTransactionById(User user, Long id) {
        Transaction transaction = getTransactionAndVerifyOwner(id, user);
        return transactionMapper.toDto(transaction);
    }

    public TransactionDto createTransaction(User user, TransactionDto transactionDto) {
        Category category = categoryService.getCategoryAndVerifyOwner(transactionDto.getCategoryId(), user);
        Account account = transactionDto.getAccountId() == null
                ? accountService.defaultAccountFor(user)
                : accountService.getAccountAndVerifyOwner(transactionDto.getAccountId(), user);

        Transaction transaction = transactionMapper.toEntity(transactionDto);
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setAccount(account);
        transaction.setType(category.getType());

        Transaction savedTransaction = transactionRepository.save(transaction);
        return transactionMapper.toDto(savedTransaction);
    }

    public TransactionDto updateTransaction(User user, Long id, TransactionDto transactionDto) {
        Transaction transaction = getTransactionAndVerifyOwner(id, user);
        Category category = categoryService.getCategoryAndVerifyOwner(transactionDto.getCategoryId(), user);
        Account account = transactionDto.getAccountId() == null
                ? accountService.defaultAccountFor(user)
                : accountService.getAccountAndVerifyOwner(transactionDto.getAccountId(), user);

        transaction.setAmount(transactionDto.getAmount());
        transaction.setDate(transactionDto.getDate());
        transaction.setDescription(transactionDto.getDescription());
        transaction.setCategory(category);
        transaction.setAccount(account);
        transaction.setType(category.getType());

        Transaction updatedTransaction = transactionRepository.save(transaction);
        return transactionMapper.toDto(updatedTransaction);
    }

    public void deleteTransaction(User user, Long id) {
        Transaction transaction = getTransactionAndVerifyOwner(id, user);
        transactionRepository.delete(transaction);
    }

    private AccountMovementDto toMovement(Transaction transaction) {
        AccountMovementDto dto = new AccountMovementDto();
        dto.setId(transaction.getId());
        dto.setSource("TRANSACTION");
        dto.setType(transaction.getType());
        dto.setAmount(transaction.getAmount());
        dto.setSignedAmount(transaction.getType() == TransactionType.INCOME ? transaction.getAmount() : -transaction.getAmount());
        dto.setDate(transaction.getDate());
        dto.setDescription(transaction.getDescription());
        dto.setCategoryId(transaction.getCategory().getId());
        dto.setCategoryName(transaction.getCategory().getName());
        dto.setCategoryColor(transaction.getCategory().getColor());
        if (transaction.getAccount() != null) {
            dto.setAccountId(transaction.getAccount().getId());
            dto.setAccountName(transaction.getAccount().getName());
        }
        return dto;
    }

    private AccountMovementDto toMovement(AccountTransfer transfer, Long accountId) {
        boolean outgoing = accountId != null && transfer.getFromAccount().getId().equals(accountId);
        boolean incoming = accountId != null && transfer.getToAccount().getId().equals(accountId);

        AccountMovementDto dto = new AccountMovementDto();
        dto.setId(transfer.getId());
        dto.setSource("TRANSFER");
        dto.setType(TransactionType.TRANSFER);
        dto.setAmount(transfer.getAmount());
        dto.setSignedAmount(outgoing ? -transfer.getAmount() : incoming ? transfer.getAmount() : 0.0);
        dto.setDate(transfer.getDate());
        dto.setDescription(transfer.getDescription());
        dto.setCategoryName("Trasferimento");
        dto.setCategoryColor("#4b5563");
        dto.setFromAccountId(transfer.getFromAccount().getId());
        dto.setFromAccountName(transfer.getFromAccount().getName());
        dto.setToAccountId(transfer.getToAccount().getId());
        dto.setToAccountName(transfer.getToAccount().getName());
        dto.setTransferDirection(outgoing ? "OUT" : incoming ? "IN" : "NEUTRAL");
        dto.setAccountId(accountId);
        dto.setAccountName(accountId == null ? transfer.getFromAccount().getName() + " -> " + transfer.getToAccount().getName() : outgoing ? transfer.getFromAccount().getName() : transfer.getToAccount().getName());
        return dto;
    }

    private Transaction getTransactionAndVerifyOwner(Long id, User user) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to access this transaction");
        }

        return transaction;
    }
}

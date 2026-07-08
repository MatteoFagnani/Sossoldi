package com.financeapp.service;

import com.financeapp.dto.TransactionDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.TransactionMapper;
import com.financeapp.model.Account;
import com.financeapp.model.Category;
import com.financeapp.model.Transaction;
import com.financeapp.model.User;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final CategoryService categoryService;
    private final AccountService accountService;

    public List<TransactionDto> getAllTransactions(User user) {
        return transactionRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream()
                .map(transactionMapper::toDto)
                .collect(Collectors.toList());
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
        // Ensure type matches the category type
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

    private Transaction getTransactionAndVerifyOwner(Long id, User user) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to access this transaction");
        }

        return transaction;
    }
}

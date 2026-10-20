package com.financeapp.service;

import com.financeapp.dto.PasswordChangeRequest;
import com.financeapp.dto.ProfileUpdateRequest;
import com.financeapp.dto.UserDto;
import com.financeapp.mapper.UserMapper;
import com.financeapp.model.User;
import com.financeapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionCategoryMappingRepository transactionCategoryMappingRepository;
    private final AccountTransferRepository accountTransferRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetOverrideRepository budgetOverrideRepository;
    private final InvestmentRepository investmentRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserDto getProfile(User user) {
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto updateProfile(User user, ProfileUpdateRequest request) {
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsernameAndIdNot(request.getUsername(), user.getId())) {
                throw new IllegalArgumentException("Username già in uso");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailAndIdNot(request.getEmail(), user.getId())) {
                throw new IllegalArgumentException("Email già in uso");
            }
            user.setEmail(request.getEmail());
        }

        User savedUser = userRepository.save(user);
        return userMapper.toDto(savedUser);
    }

    @Transactional
    public void changePassword(User user, PasswordChangeRequest request) {
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("La vecchia password non è corretta");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(User user) {
        Long userId = user.getId();

        // 1. Transaction category mappings
        var mappings = transactionCategoryMappingRepository.findByUserId(userId);
        if (!mappings.isEmpty()) {
            transactionCategoryMappingRepository.deleteAll(mappings);
        }

        // 2. Account transfers
        var transfers = accountTransferRepository.findByUserIdOrderByDateDescIdDesc(userId);
        if (!transfers.isEmpty()) {
            accountTransferRepository.deleteAll(transfers);
        }

        // 3. Transactions
        var transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);
        if (!transactions.isEmpty()) {
            transactionRepository.deleteAll(transactions);
        }

        // 4. Budgets and overrides
        var budgets = budgetRepository.findByUserId(userId);
        for (var budget : budgets) {
            if (budget.getOverrides() != null && !budget.getOverrides().isEmpty()) {
                budgetOverrideRepository.deleteAll(budget.getOverrides());
            }
        }
        if (!budgets.isEmpty()) {
            budgetRepository.deleteAll(budgets);
        }

        // 5. Investments
        var investments = investmentRepository.findByUserIdOrderByNameAsc(userId);
        if (!investments.isEmpty()) {
            investmentRepository.deleteAll(investments);
        }

        // 6. Categories (break parent-child relations first to avoid self-referencing FK constraints)
        var categories = categoryRepository.findByUserId(userId);
        if (!categories.isEmpty()) {
            for (var category : categories) {
                category.setParent(null);
            }
            categoryRepository.saveAll(categories);
            categoryRepository.flush();
            categoryRepository.deleteAll(categories);
        }

        // 7. Accounts
        var accounts = accountRepository.findByUserIdOrderByArchivedAscNameAsc(userId);
        if (!accounts.isEmpty()) {
            accountRepository.deleteAll(accounts);
        }

        // 8. Delete user
        userRepository.delete(user);
    }
}

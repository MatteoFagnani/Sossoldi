package com.financeapp.repository;

import com.financeapp.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByDateDesc(Long userId);

    List<Transaction> findByUserIdAndAccountIdOrderByDateDesc(Long userId, Long accountId);

    List<Transaction> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate startDate, LocalDate endDate);

    List<Transaction> findByCategoryIdOrderByDateDesc(Long categoryId);

    List<Transaction> findByAccountIdOrderByDateDesc(Long accountId);

    List<Transaction> findByUserIdAndAccountIsNull(Long userId);
}

package com.financeapp.repository;

import com.financeapp.model.TransactionCategoryMapping;
import com.financeapp.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionCategoryMappingRepository extends JpaRepository<TransactionCategoryMapping, Long> {
    List<TransactionCategoryMapping> findByUserId(Long userId);

    Optional<TransactionCategoryMapping> findByUserIdAndTypeAndMatchKey(Long userId, TransactionType type, String matchKey);
}
package com.financeapp.repository;

import com.financeapp.model.Category;
import com.financeapp.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserId(Long userId);

    List<Category> findByUserIdAndType(Long userId, TransactionType type);

    Optional<Category> findByUserIdAndParentIdAndName(Long userId, Long parentId, String name);

    boolean existsByNameAndUserId(String name, Long userId);
}

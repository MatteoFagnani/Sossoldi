package com.financeapp.repository;

import com.financeapp.model.Investment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    List<Investment> findByUserIdOrderByNameAsc(Long userId);

    List<Investment> findByUserIdAndPacActiveTrue(Long userId);

    boolean existsByAccountId(Long accountId);
}

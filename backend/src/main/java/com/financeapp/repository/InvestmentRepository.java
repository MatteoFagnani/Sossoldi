package com.financeapp.repository;

import com.financeapp.model.Investment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    List<Investment> findByUserIdOrderByNameAsc(Long userId);
}

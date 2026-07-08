package com.financeapp.repository;

import com.financeapp.model.Account;
import com.financeapp.model.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserIdOrderByArchivedAscNameAsc(Long userId);

    Optional<Account> findFirstByUserIdAndType(Long userId, AccountType type);

    Optional<Account> findFirstByUserIdAndArchivedFalseOrderByIdAsc(Long userId);

    boolean existsByUserIdAndName(Long userId, String name);
}

package com.financeapp.repository;

import com.financeapp.model.AccountTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountTransferRepository extends JpaRepository<AccountTransfer, Long> {
    List<AccountTransfer> findByUserIdOrderByDateDescIdDesc(Long userId);
    List<AccountTransfer> findByFromAccountIdOrToAccountId(Long fromAccountId, Long toAccountId);
}

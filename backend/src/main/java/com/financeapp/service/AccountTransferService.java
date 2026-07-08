package com.financeapp.service;

import com.financeapp.dto.AccountTransferDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.model.Account;
import com.financeapp.model.AccountTransfer;
import com.financeapp.model.User;
import com.financeapp.repository.AccountTransferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountTransferService {

    private final AccountTransferRepository transferRepository;
    private final AccountService accountService;

    public List<AccountTransferDto> getTransfers(User user) {
        return transferRepository.findByUserIdOrderByDateDescIdDesc(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    public AccountTransferDto createTransfer(User user, AccountTransferDto dto) {
        Account fromAccount = accountService.getAccountAndVerifyOwner(dto.getFromAccountId(), user);
        Account toAccount = accountService.getAccountAndVerifyOwner(dto.getToAccountId(), user);
        if (fromAccount.getId().equals(toAccount.getId())) {
            throw new IllegalArgumentException("Scegli due conti diversi");
        }

        AccountTransfer transfer = AccountTransfer.builder()
                .amount(dto.getAmount())
                .date(dto.getDate())
                .description(dto.getDescription())
                .fromAccount(fromAccount)
                .toAccount(toAccount)
                .user(user)
                .build();
        return toDto(transferRepository.save(transfer));
    }

    public void deleteTransfer(User user, Long id) {
        AccountTransfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + id));
        if (!transfer.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to access this transfer");
        }
        transferRepository.delete(transfer);
    }

    private AccountTransferDto toDto(AccountTransfer transfer) {
        AccountTransferDto dto = new AccountTransferDto();
        dto.setId(transfer.getId());
        dto.setAmount(transfer.getAmount());
        dto.setDate(transfer.getDate());
        dto.setDescription(transfer.getDescription());
        dto.setFromAccountId(transfer.getFromAccount().getId());
        dto.setFromAccountName(transfer.getFromAccount().getName());
        dto.setToAccountId(transfer.getToAccount().getId());
        dto.setToAccountName(transfer.getToAccount().getName());
        return dto;
    }
}

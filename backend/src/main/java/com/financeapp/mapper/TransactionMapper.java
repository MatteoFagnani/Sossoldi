package com.financeapp.mapper;

import com.financeapp.dto.TransactionDto;
import com.financeapp.model.Transaction;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    public TransactionDto toDto(Transaction transaction) {
        if (transaction == null) {
            return null;
        }
        TransactionDto dto = new TransactionDto();
        dto.setId(transaction.getId());
        dto.setAmount(transaction.getAmount());
        dto.setType(transaction.getType());
        dto.setDate(transaction.getDate());
        dto.setDescription(transaction.getDescription());
        if (transaction.getCategory() != null) {
            dto.setCategoryId(transaction.getCategory().getId());
            dto.setCategoryName(transaction.getCategory().getName());
            dto.setCategoryColor(transaction.getCategory().getColor());
        }
        if (transaction.getAccount() != null) {
            dto.setAccountId(transaction.getAccount().getId());
            dto.setAccountName(transaction.getAccount().getName());
        }
        if (transaction.getInvestment() != null) {
            dto.setInvestmentId(transaction.getInvestment().getId());
            dto.setInvestmentName(transaction.getInvestment().getName());
        }
        return dto;
    }

    public Transaction toEntity(TransactionDto dto) {
        if (dto == null) {
            return null;
        }
        Transaction transaction = new Transaction();
        transaction.setId(dto.getId());
        transaction.setAmount(dto.getAmount());
        transaction.setType(dto.getType());
        transaction.setDate(dto.getDate());
        transaction.setDescription(dto.getDescription());
        return transaction;
    }
}

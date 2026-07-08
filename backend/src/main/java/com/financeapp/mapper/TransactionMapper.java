package com.financeapp.mapper;

import com.financeapp.dto.TransactionDto;
import com.financeapp.model.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {
    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "category.color", target = "categoryColor")
    @Mapping(source = "account.id", target = "accountId")
    @Mapping(source = "account.name", target = "accountName")
    @Mapping(source = "automationRule.id", target = "automationId")
    TransactionDto toDto(Transaction transaction);

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "automationRule", ignore = true)
    Transaction toEntity(TransactionDto dto);
}

package com.financeapp.service;

import com.financeapp.dto.TransactionCategoryMappingDto;
import com.financeapp.model.Category;
import com.financeapp.model.TransactionCategoryMapping;
import com.financeapp.model.User;
import com.financeapp.repository.TransactionCategoryMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionCategoryMappingService {

    private final TransactionCategoryMappingRepository repository;
    private final CategoryService categoryService;

    public List<TransactionCategoryMappingDto> getMappings(User user) {
        return repository.findByUserId(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TransactionCategoryMappingDto saveMapping(User user, TransactionCategoryMappingDto dto) {
        Category category = categoryService.getCategoryAndVerifyOwner(dto.getCategoryId(), user);
        if (category.getType() != dto.getType()) {
            throw new IllegalArgumentException("Category type does not match mapping type");
        }

        TransactionCategoryMapping mapping = repository
                .findByUserIdAndTypeAndMatchKey(user.getId(), dto.getType(), dto.getMatchKey())
                .orElse(TransactionCategoryMapping.builder()
                        .user(user)
                        .type(dto.getType())
                        .matchKey(dto.getMatchKey())
                        .build());

        mapping.setDescription(dto.getDescription());
        mapping.setCategory(category);

        return toDto(repository.save(mapping));
    }

    private TransactionCategoryMappingDto toDto(TransactionCategoryMapping mapping) {
        TransactionCategoryMappingDto dto = new TransactionCategoryMappingDto();
        dto.setId(mapping.getId());
        dto.setType(mapping.getType());
        dto.setMatchKey(mapping.getMatchKey());
        dto.setDescription(mapping.getDescription());
        dto.setCategoryId(mapping.getCategory().getId());
        dto.setCategoryName(mapping.getCategory().getName());
        return dto;
    }
}
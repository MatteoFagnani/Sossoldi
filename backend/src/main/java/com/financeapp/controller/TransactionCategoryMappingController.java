package com.financeapp.controller;

import com.financeapp.dto.TransactionCategoryMappingDto;
import com.financeapp.service.TransactionCategoryMappingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transaction-category-mappings")
@RequiredArgsConstructor
public class TransactionCategoryMappingController extends BaseController {

    private final TransactionCategoryMappingService service;

    @GetMapping
    public ResponseEntity<List<TransactionCategoryMappingDto>> getMappings(Authentication authentication) {
        return ResponseEntity.ok(service.getMappings(getCurrentUser(authentication)));
    }

    @PutMapping
    public ResponseEntity<TransactionCategoryMappingDto> saveMapping(
            Authentication authentication,
            @Valid @RequestBody TransactionCategoryMappingDto dto) {
        return ResponseEntity.ok(service.saveMapping(getCurrentUser(authentication), dto));
    }
}
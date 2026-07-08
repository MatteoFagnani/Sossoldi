package com.financeapp.controller;

import com.financeapp.dto.AccountMovementDto;
import com.financeapp.dto.TransactionDto;
import com.financeapp.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController extends BaseController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionDto>> getAllTransactions(Authentication authentication) {
        return ResponseEntity.ok(transactionService.getAllTransactions(getCurrentUser(authentication)));
    }

    @GetMapping("/movements")
    public ResponseEntity<List<AccountMovementDto>> getMovements(Authentication authentication, @RequestParam(required = false) Long accountId) {
        return ResponseEntity.ok(transactionService.getMovements(getCurrentUser(authentication), accountId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> getTransactionById(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransactionById(getCurrentUser(authentication), id));
    }

    @PostMapping
    public ResponseEntity<TransactionDto> createTransaction(
            Authentication authentication,
            @Valid @RequestBody TransactionDto transactionDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.createTransaction(getCurrentUser(authentication), transactionDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDto> updateTransaction(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody TransactionDto transactionDto) {
        return ResponseEntity
                .ok(transactionService.updateTransaction(getCurrentUser(authentication), id, transactionDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            Authentication authentication,
            @PathVariable Long id) {
        transactionService.deleteTransaction(getCurrentUser(authentication), id);
        return ResponseEntity.noContent().build();
    }
}

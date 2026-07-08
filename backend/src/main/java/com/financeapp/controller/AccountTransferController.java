package com.financeapp.controller;

import com.financeapp.dto.AccountTransferDto;
import com.financeapp.service.AccountTransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/account-transfers")
@RequiredArgsConstructor
public class AccountTransferController extends BaseController {

    private final AccountTransferService transferService;

    @GetMapping
    public ResponseEntity<List<AccountTransferDto>> getTransfers(Authentication authentication) {
        return ResponseEntity.ok(transferService.getTransfers(getCurrentUser(authentication)));
    }

    @PostMapping
    public ResponseEntity<AccountTransferDto> createTransfer(Authentication authentication, @Valid @RequestBody AccountTransferDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transferService.createTransfer(getCurrentUser(authentication), dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransfer(Authentication authentication, @PathVariable Long id) {
        transferService.deleteTransfer(getCurrentUser(authentication), id);
        return ResponseEntity.noContent().build();
    }
}

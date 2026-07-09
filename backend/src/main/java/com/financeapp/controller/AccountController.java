package com.financeapp.controller;

import com.financeapp.dto.AccountDto;
import com.financeapp.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController extends BaseController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<AccountDto>> getAccounts(Authentication authentication) {
        return ResponseEntity.ok(accountService.getAccounts(getCurrentUser(authentication)));
    }

    @PostMapping
    public ResponseEntity<AccountDto> createAccount(Authentication authentication, @Valid @RequestBody AccountDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accountService.createAccount(getCurrentUser(authentication), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountDto> updateAccount(Authentication authentication, @PathVariable Long id, @Valid @RequestBody AccountDto dto) {
        return ResponseEntity.ok(accountService.updateAccount(getCurrentUser(authentication), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(Authentication authentication, @PathVariable Long id) {
        accountService.deleteAccount(getCurrentUser(authentication), id);
        return ResponseEntity.noContent().build();
    }
}

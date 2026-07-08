package com.financeapp.controller;

import com.financeapp.dto.InvestmentDto;
import com.financeapp.service.InvestmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/investments")
@RequiredArgsConstructor
public class InvestmentController extends BaseController {

    private final InvestmentService investmentService;

    @GetMapping
    public ResponseEntity<List<InvestmentDto>> getInvestments(Authentication authentication) {
        return ResponseEntity.ok(investmentService.getInvestments(getCurrentUser(authentication)));
    }

    @PostMapping
    public ResponseEntity<InvestmentDto> createInvestment(Authentication authentication, @Valid @RequestBody InvestmentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(investmentService.createInvestment(getCurrentUser(authentication), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvestmentDto> updateInvestment(Authentication authentication, @PathVariable Long id, @Valid @RequestBody InvestmentDto dto) {
        return ResponseEntity.ok(investmentService.updateInvestment(getCurrentUser(authentication), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvestment(Authentication authentication, @PathVariable Long id) {
        investmentService.deleteInvestment(getCurrentUser(authentication), id);
        return ResponseEntity.noContent().build();
    }
}

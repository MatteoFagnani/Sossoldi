package com.financeapp.controller;

import com.financeapp.dto.CashFlowDto;
import com.financeapp.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController extends BaseController {

    private final AnalyticsService analyticsService;

    @GetMapping("/cash-flow")
    public ResponseEntity<CashFlowDto> getCashFlow(
            Authentication authentication,
            @RequestParam(required = false) Integer month,
            @RequestParam int year) {

        if (month != null) {
            return ResponseEntity.ok(analyticsService.getMonthlyCashFlow(getCurrentUser(authentication), year, month));
        }
        return ResponseEntity.ok(analyticsService.getYearlyCashFlow(getCurrentUser(authentication), year));
    }
}

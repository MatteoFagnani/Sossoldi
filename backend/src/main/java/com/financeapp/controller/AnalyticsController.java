package com.financeapp.controller;

import com.financeapp.dto.AdvancedAnalyticsDto;
import com.financeapp.dto.AiFinancialInsightsDto;
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

    @GetMapping("/advanced")
    public ResponseEntity<AdvancedAnalyticsDto> getAdvancedAnalytics(
            Authentication authentication,
            @RequestParam(required = false) Integer month,
            @RequestParam int year) {
        return ResponseEntity.ok(analyticsService.getAdvancedAnalytics(getCurrentUser(authentication), year, month));
    }

    @PostMapping("/ai-insights")
    public ResponseEntity<AiFinancialInsightsDto> getAiFinancialInsights(
            Authentication authentication,
            @RequestParam(required = false) Integer month,
            @RequestParam int year) {
        return ResponseEntity.ok(analyticsService.getAiFinancialInsights(getCurrentUser(authentication), year, month));
    }
}

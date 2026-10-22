package com.financeapp.controller;

import com.financeapp.dto.AiStatusDto;
import com.financeapp.dto.CategorizeMerchantRequest;
import com.financeapp.dto.CategorizeMerchantResponse;
import com.financeapp.service.GeminiService;
import com.financeapp.service.TransactionCategoryMappingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiCategorizationController extends BaseController {

    private final GeminiService geminiService;
    private final TransactionCategoryMappingService mappingService;

    @GetMapping("/status")
    public ResponseEntity<AiStatusDto> getStatus(Authentication authentication) {
        return ResponseEntity.ok(geminiService.getStatus(getCurrentUser(authentication)));
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection(
            Authentication authentication,
            @RequestBody(required = false) Map<String, String> body) {
        String apiKeyOverride = (body != null) ? body.get("apiKey") : null;
        return ResponseEntity.ok(geminiService.testConnection(getCurrentUser(authentication), apiKeyOverride));
    }

    @PostMapping("/categorize-and-map")
    public ResponseEntity<CategorizeMerchantResponse> categorizeAndMap(
            Authentication authentication,
            @Valid @RequestBody CategorizeMerchantRequest request) {
        return ResponseEntity.ok(mappingService.categorizeAndMapUnknown(getCurrentUser(authentication), request.getItems()));
    }
}


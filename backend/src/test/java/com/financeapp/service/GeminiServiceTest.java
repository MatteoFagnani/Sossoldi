package com.financeapp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeapp.dto.AiStatusDto;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GeminiServiceTest {

    private GeminiService geminiServiceWithSystemKey;
    private GeminiService geminiServiceEmpty;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        geminiServiceWithSystemKey = new GeminiService(
                "AIzaSyDemoSystemKey1234567890",
                "gemini-3.5-flash-lite",
                "https://generativelanguage.googleapis.com/v1beta",
                objectMapper
        );
        geminiServiceEmpty = new GeminiService(
                "",
                "gemini-3.5-flash-lite",
                "https://generativelanguage.googleapis.com/v1beta",
                objectMapper
        );
    }

    @Test
    void cleanMerchantName_ShouldRemovePricesAndNoise() {
        String input1 = "PAGAMENTO BANCOMAT DEL 14/05/2024 ORE 18.23 E. 45,90 PRESSO ESSELUNGA VIA WASHINGTON MILANO";
        String cleaned1 = TransactionCategoryMappingService.cleanMerchantName(input1);
        assertEquals("ESSELUNGA VIA WASHINGTON MILANO", cleaned1);

        String input2 = "C/O MCDONALD'S ROMA TERMINI EUR 15.40";
        String cleaned2 = TransactionCategoryMappingService.cleanMerchantName(input2);
        assertEquals("MCDONALD'S ROMA TERMINI", cleaned2);

        String input3 = "PAGAMENTO TRAMITE POS 25.50€ PRESSO BAR CENTRALE";
        String cleaned3 = TransactionCategoryMappingService.cleanMerchantName(input3);
        assertEquals("BAR CENTRALE", cleaned3);

        String input4 = "ADDEBITO DIRETTO SEPA ENEL ENERGIA SPA 74,32 EUR";
        String cleaned4 = TransactionCategoryMappingService.cleanMerchantName(input4);
        assertEquals("ENEL ENERGIA SPA", cleaned4);

        String input5 = "Q8 CARBURANTE 50.00€ VIA APPIA";
        String cleaned5 = TransactionCategoryMappingService.cleanMerchantName(input5);
        assertEquals("Q8 CARBURANTE VIA APPIA", cleaned5);
    }

    @Test
    void normalizeKey_ShouldRemovePunctuationAndNumbers() {
        String key1 = TransactionCategoryMappingService.normalizeKey("Esselunga - Milano 123");
        assertEquals("esselunga milano", key1);

        String matchKey = TransactionCategoryMappingService.buildMatchKey(TransactionType.EXPENSE, "Esselunga Superstore");
        assertEquals("EXPENSE:esselunga superstore", matchKey);
    }

    @Test
    void getStatus_WhenSystemKeyConfigured_ShouldReturnSystemSource() {
        User user = new User();
        user.setId(1L);

        AiStatusDto status = geminiServiceWithSystemKey.getStatus(user);
        assertTrue(status.isConfigured());
        assertEquals("SYSTEM", status.getSource());
        assertEquals("gemini-3.5-flash-lite", status.getModel());
        assertTrue(status.getMaskedKey().contains("..."));
    }

    @Test
    void getStatus_WhenUserKeyConfigured_ShouldReturnUserSource() {
        User user = new User();
        user.setId(1L);
        user.setGeminiApiKey("AIzaSyDemoCustomUserKey987654321");

        AiStatusDto status = geminiServiceWithSystemKey.getStatus(user);
        assertTrue(status.isConfigured());
        assertEquals("USER", status.getSource());
        assertTrue(status.getMaskedKey().startsWith("AIzaSy"));
    }

    @Test
    void getStatus_WhenNoKeyConfigured_ShouldReturnNone() {
        User user = new User();
        user.setId(1L);

        AiStatusDto status = geminiServiceEmpty.getStatus(user);
        assertFalse(status.isConfigured());
        assertEquals("NONE", status.getSource());
    }

    @Test
    void testConnection_WhenNoKey_ShouldReturnFailureMessage() {
        User user = new User();
        user.setId(1L);

        Map<String, Object> result = geminiServiceEmpty.testConnection(user, null);
        assertFalse((Boolean) result.get("success"));
        assertTrue(((String) result.get("message")).contains("Nessuna chiave"));
    }
}


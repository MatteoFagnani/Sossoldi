package com.financeapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFinancialInsightsDto {

    private String overallHealth;        // "OTTIMA", "BUONA", "STABILE", "ATTENZIONE", "CRITICA"
    private String summary;              // Concise synthesis
    private String rule50_30_20Analysis; // Assessment of Needs vs Wants vs Savings
    private String emergencyFundAnalysis;// Assessment of runway & liquid buffer
    private List<String> keyStrengths;   // Key positive patterns detected
    private List<ActionableTip> actionableTips; // Concrete coaching tips
    private String disclaimer;           // Explicit privacy confirmation

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionableTip {
        private String title;
        private String category;
        private String advice;
        private String priority;        // "HIGH", "MEDIUM", "LOW"
        private String potentialImpact; // e.g. "+3% di risparmio", "Riduzione spese superflue"
    }
}


package com.financeapp.dto;

import com.financeapp.model.FinancialProfileType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    private String username;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String email;
    private FinancialProfileType financialProfile;
    private String geminiApiKey;
}

package com.financeapp.dto;

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
    private String geminiApiKey;
}

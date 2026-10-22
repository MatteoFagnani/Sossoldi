package com.financeapp.dto;

import com.financeapp.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String email;
    private Role role;
    private String geminiApiKey;
    private Boolean geminiConfigured;
}

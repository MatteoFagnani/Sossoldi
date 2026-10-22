package com.financeapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GoogleLoginRequest {
    private String idToken;
    private String email;
    private String name;
    private String givenName;
    private String familyName;
    private String picture;
}

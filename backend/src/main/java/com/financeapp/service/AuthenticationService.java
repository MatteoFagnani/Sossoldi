package com.financeapp.service;

import com.financeapp.dto.AuthResponse;
import com.financeapp.mapper.UserMapper;
import com.financeapp.model.Role;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final CategoryService categoryService;
    private final AccountService accountService;
    private final BudgetService budgetService;

    public AuthResponse authenticateWithGoogle(String email, String name, String googleSub) {
        var userOptional = repository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
        } else {
            String baseUsername = (name != null && !name.isBlank()) ?
                    name.toLowerCase().replaceAll("[^a-z0-9]", "") :
                    email.split("@")[0].toLowerCase().replaceAll("[^a-z0-9]", "");
            if (baseUsername.isBlank()) {
                baseUsername = "user";
            }

            String username = baseUsername;
            int counter = 1;
            while (repository.existsByUsername(username)) {
                username = baseUsername + counter++;
            }

            user = User.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.USER)
                    .build();

            user = repository.save(user);
            categoryService.seedDefaultCategories(user);
            accountService.seedDefaultAccounts(user);
            budgetService.seedDefaultBudgets(user);
        }

        var jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .user(userMapper.toDto(user))
                .build();
    }
}

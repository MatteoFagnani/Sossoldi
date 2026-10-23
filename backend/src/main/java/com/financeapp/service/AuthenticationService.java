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

    public AuthResponse authenticateWithGoogle(
            String email,
            String name,
            String givenName,
            String familyName,
            String picture) {

        var userOptional = repository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            boolean updated = false;

            if ((user.getFirstName() == null || user.getFirstName().isBlank()) && givenName != null && !givenName.isBlank()) {
                user.setFirstName(givenName);
                updated = true;
            }
            if ((user.getLastName() == null || user.getLastName().isBlank()) && familyName != null && !familyName.isBlank()) {
                user.setLastName(familyName);
                updated = true;
            }
            if (picture != null && !picture.isBlank() && !picture.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(picture);
                updated = true;
            }
            if (updated) {
                user = repository.save(user);
            }
        } else {
            String fName = (givenName != null && !givenName.isBlank()) ? givenName.trim() : "";
            String lName = (familyName != null && !familyName.isBlank()) ? familyName.trim() : "";
            if (fName.isBlank() && name != null && !name.isBlank()) {
                String[] parts = name.trim().split("\\s+", 2);
                fName = parts[0];
                if (parts.length > 1) {
                    lName = parts[1];
                }
            }

            String baseUsername;
            if (!fName.isBlank() && !lName.isBlank()) {
                baseUsername = (fName + "." + lName).toLowerCase().replaceAll("[^a-z0-9.]", "");
            } else if (!fName.isBlank()) {
                baseUsername = fName.toLowerCase().replaceAll("[^a-z0-9]", "");
            } else {
                baseUsername = email.split("@")[0].toLowerCase().replaceAll("[^a-z0-9.]", "");
            }

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
                    .firstName(fName.isBlank() ? null : fName)
                    .lastName(lName.isBlank() ? null : lName)
                    .avatarUrl(picture != null && !picture.isBlank() ? picture : null)
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

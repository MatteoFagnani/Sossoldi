package com.financeapp.service;

import com.financeapp.dto.AuthResponse;
import com.financeapp.dto.LoginRequest;
import com.financeapp.dto.RegisterRequest;
import com.financeapp.mapper.UserMapper;
import com.financeapp.model.Role;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.security.AuthErrorMessages;
import com.financeapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final CategoryService categoryService;
    private final AccountService accountService;
    private final LoginAttemptService loginAttemptService;
    private final AuthenticationAttemptPersistenceService authenticationAttemptPersistenceService;

    public AuthResponse register(RegisterRequest request) {
        if (repository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username gia in uso");
        }
        if (repository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email gia registrata");
        }

        var user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        var savedUser = repository.save(user);
        categoryService.seedDefaultCategories(savedUser);
        accountService.seedDefaultAccounts(savedUser);

        var jwtToken = jwtService.generateToken(savedUser);

        return AuthResponse.builder()
                .token(jwtToken)
                .user(userMapper.toDto(savedUser))
                .build();
    }

    public AuthResponse authenticate(LoginRequest request, String clientIp) {
        String username = request.getUsername();

        if (loginAttemptService.isBlocked(clientIp, username)) {
            throw invalidCredentials();
        }

        var userOptional = authenticationAttemptPersistenceService.getUserForAuthentication(username);

        if (userOptional.isPresent()) {
            var user = userOptional.get();
            if (user.getAccountLockedUntil() != null) {
                throw invalidCredentials();
            }
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword()));
        } catch (BadCredentialsException ex) {
            loginAttemptService.recordFailure(clientIp, username);
            authenticationAttemptPersistenceService.recordFailedAttempt(username);
            throw invalidCredentials();
        } catch (LockedException ex) {
            throw invalidCredentials();
        } catch (AuthenticationException ex) {
            throw invalidCredentials();
        }

        loginAttemptService.recordSuccess(clientIp, username);

        var user = authenticationAttemptPersistenceService
                .resetSuccessfulLogin(username)
                .orElseGet(() -> repository.findByUsername(username).orElseThrow());

        var jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .user(userMapper.toDto(user))
                .build();
    }

    private BadCredentialsException invalidCredentials() {
        return new BadCredentialsException(AuthErrorMessages.GENERIC_AUTH_ERROR);
    }
}

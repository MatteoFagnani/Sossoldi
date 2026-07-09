package com.financeapp.service;

import com.financeapp.dto.AuthResponse;
import com.financeapp.dto.LoginRequest;
import com.financeapp.dto.UserDto;
import com.financeapp.mapper.UserMapper;
import com.financeapp.model.Role;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepository repository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserMapper userMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AccountService accountService;
    @Mock
    private BudgetService budgetService;
    @Mock
    private AuthenticationAttemptPersistenceService authenticationAttemptPersistenceService;

    private LoginAttemptService loginAttemptService;
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptService();
        authenticationService = new AuthenticationService(
                repository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                userMapper,
                categoryService,
                accountService,
                budgetService,
                loginAttemptService,
                authenticationAttemptPersistenceService
        );
    }

    @Test
    void authenticateLocksAccountAfterFiveFailures() {
        LoginRequest request = loginRequest("mario", "wrong-password");
        User user = userWithAttempts(4, null);

        when(authenticationAttemptPersistenceService.getUserForAuthentication("mario")).thenReturn(Optional.of(user));
        doThrow(new BadCredentialsException("bad")).when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThrows(BadCredentialsException.class,
                () -> authenticationService.authenticate(request, "10.0.0.1"));

        verify(authenticationAttemptPersistenceService).recordFailedAttempt("mario");
    }

    @Test
    void authenticateReturnsGenericErrorWhileAccountIsLocked() {
        LoginRequest request = loginRequest("mario", "wrong-password");
        User user = userWithAttempts(5, LocalDateTime.now().plusMinutes(10));

        when(authenticationAttemptPersistenceService.getUserForAuthentication("mario")).thenReturn(Optional.of(user));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authenticationService.authenticate(request, "10.0.0.1"));

        assertEquals("Credenziali non valide", ex.getMessage());
        verify(authenticationManager, times(0)).authenticate(any());
    }

    @Test
    void authenticateBlocksIpAfterTooManyFailures() {
        when(authenticationAttemptPersistenceService.getUserForAuthentication(any())).thenReturn(Optional.empty());
        doThrow(new BadCredentialsException("bad")).when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        for (int i = 0; i < 20; i++) {
            LoginRequest request = loginRequest("ghost-" + i, "wrong-password");
            assertThrows(BadCredentialsException.class,
                    () -> authenticationService.authenticate(request, "192.168.1.50"));
        }

        LoginRequest blockedRequest = loginRequest("ghost-blocked", "wrong-password");
        assertThrows(BadCredentialsException.class,
                () -> authenticationService.authenticate(blockedRequest, "192.168.1.50"));

        verify(authenticationManager, times(20)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void authenticateResetsCountersAfterSuccessfulLogin() {
        LoginRequest request = loginRequest("mario", "correct-password");
        User user = userWithAttempts(3, null);
        UserDto userDto = UserDto.builder().id(1L).username("mario").email("mario@test.com").role(Role.USER).build();

        when(authenticationAttemptPersistenceService.getUserForAuthentication("mario")).thenReturn(Optional.of(user));
        when(authenticationAttemptPersistenceService.resetSuccessfulLogin("mario")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        when(userMapper.toDto(user)).thenReturn(userDto);

        AuthResponse response = authenticationService.authenticate(request, "10.0.0.1");

        verify(authenticationAttemptPersistenceService).resetSuccessfulLogin("mario");
        assertEquals("jwt-token", response.getToken());
        assertEquals(userDto, response.getUser());
    }

    private LoginRequest loginRequest(String username, String password) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword(password);
        return request;
    }

    private User userWithAttempts(int attempts, LocalDateTime lockUntil) {
        return User.builder()
                .id(1L)
                .username("mario")
                .email("mario@test.com")
                .password("encoded")
                .role(Role.USER)
                .failedLoginAttempts(attempts)
                .accountLockedUntil(lockUntil)
                .build();
    }
}


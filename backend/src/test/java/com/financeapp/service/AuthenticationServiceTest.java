package com.financeapp.service;

import com.financeapp.dto.AuthResponse;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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
    private UserMapper userMapper;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AccountService accountService;
    @Mock
    private BudgetService budgetService;

    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        authenticationService = new AuthenticationService(
                repository,
                passwordEncoder,
                jwtService,
                userMapper,
                categoryService,
                accountService,
                budgetService
        );
    }

    @Test
    void authenticateWithGoogleReturnsExistingUserWithoutSeeding() {
        String email = "mario.rossi@gmail.com";
        User existingUser = User.builder()
                .id(1L)
                .username("mariorossi")
                .email(email)
                .role(Role.USER)
                .build();
        UserDto userDto = UserDto.builder().id(1L).username("mariorossi").email(email).role(Role.USER).build();

        when(repository.findByEmail(email)).thenReturn(Optional.of(existingUser));
        when(jwtService.generateToken(existingUser)).thenReturn("jwt-token-123");
        when(userMapper.toDto(existingUser)).thenReturn(userDto);

        AuthResponse response = authenticationService.authenticateWithGoogle(email, "Mario Rossi", "sub-123");

        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
        assertEquals(userDto, response.getUser());

        verifyNoInteractions(categoryService);
        verifyNoInteractions(accountService);
        verifyNoInteractions(budgetService);
    }

    @Test
    void authenticateWithGoogleCreatesNewUserAndSeedsDefaults() {
        String email = "nuovo.utente@gmail.com";
        User savedUser = User.builder()
                .id(2L)
                .username("nuovoutente")
                .email(email)
                .role(Role.USER)
                .build();
        UserDto userDto = UserDto.builder().id(2L).username("nuovoutente").email(email).role(Role.USER).build();

        when(repository.findByEmail(email)).thenReturn(Optional.empty());
        when(repository.existsByUsername("nuovoutente")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed-random-password");
        when(repository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("jwt-token-456");
        when(userMapper.toDto(savedUser)).thenReturn(userDto);

        AuthResponse response = authenticationService.authenticateWithGoogle(email, "Nuovo Utente", "sub-456");

        assertNotNull(response);
        assertEquals("jwt-token-456", response.getToken());
        assertEquals(userDto, response.getUser());

        verify(categoryService).seedDefaultCategories(savedUser);
        verify(accountService).seedDefaultAccounts(savedUser);
        verify(budgetService).seedDefaultBudgets(savedUser);
    }
}

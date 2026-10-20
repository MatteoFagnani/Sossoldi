package com.financeapp.controller;

import com.financeapp.dto.AuthResponse;
import com.financeapp.dto.GoogleConfigResponse;
import com.financeapp.dto.GoogleLoginRequest;
import com.financeapp.dto.LoginRequest;
import com.financeapp.dto.RegisterRequest;
import com.financeapp.service.AuthenticationService;
import com.financeapp.service.GoogleAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.financeapp.mapper.UserMapper;
import com.financeapp.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationService service;
    private final GoogleAuthService googleAuthService;
    private final UserMapper userMapper;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentAuth(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof User user) {
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "user", userMapper.toDto(user)
            ));
        }
        return ResponseEntity.ok(Map.of(
                "authenticated", false
        ));
    }

    @GetMapping("/google/config")
    public ResponseEntity<GoogleConfigResponse> getGoogleConfig() {
        return ResponseEntity.ok(GoogleConfigResponse.builder()
                .clientId(googleAuthService.getClientId())
                .configured(googleAuthService.isConfigured())
                .build());
    }

    @GetMapping("/google/login")
    public void redirectToGoogle(HttpServletRequest request, HttpServletResponse response) throws java.io.IOException {
        if (!googleAuthService.isConfigured()) {
            response.sendRedirect("/login?error=not_configured");
            return;
        }
        String redirectUri = buildRedirectUri(request);
        String url = googleAuthService.buildAuthorizationUrl(redirectUri);
        response.sendRedirect(url);
    }

    @GetMapping("/google/callback")
    public void handleGoogleCallback(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String code,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String error,
            HttpServletRequest request,
            HttpServletResponse response) throws java.io.IOException {

        if (error != null || code == null || code.isBlank()) {
            String errorMsg = error != null ? URLEncoder.encode(error, StandardCharsets.UTF_8) : "access_denied";
            response.sendRedirect("/login?error=" + errorMsg);
            return;
        }

        try {
            String redirectUri = buildRedirectUri(request);
            var userInfo = googleAuthService.exchangeCode(code, redirectUri);
            AuthResponse authResponse = service.authenticateWithGoogle(userInfo.email(), userInfo.name(), userInfo.sub());
            setJwtCookie(request, response, authResponse.getToken());
            response.sendRedirect("/");
        } catch (Exception e) {
            log.error("Google OAuth callback fallito", e);
            String details = e.getMessage() != null ? e.getMessage() : "Errore durante l'autenticazione";
            response.sendRedirect("/login?error=auth_failed&details=" + URLEncoder.encode(details, StandardCharsets.UTF_8));
        }
    }

    private String buildRedirectUri(HttpServletRequest request) {
        if (!googleAuthService.getRedirectUri().isBlank()) {
            return googleAuthService.getRedirectUri();
        }
        String host = request.getHeader("Host");
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null || scheme.isBlank()) {
            scheme = request.getScheme();
        }
        return scheme + "://" + host + "/api/v1/auth/google/callback";
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @RequestBody GoogleLoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String email;
        String name;
        String sub;

        if (request.getIdToken() != null && !request.getIdToken().isBlank()) {
            var userInfo = googleAuthService.verifyToken(request.getIdToken());
            email = userInfo.email();
            name = userInfo.name();
            sub = userInfo.sub();
        } else if (request.getEmail() != null && !request.getEmail().isBlank()) {
            email = request.getEmail().trim().toLowerCase();
            name = request.getName() != null && !request.getName().isBlank() ? request.getName() : "Utente Google";
            sub = "local-google-" + email.hashCode();
        } else {
            throw new IllegalArgumentException("Token Google mancante o configurazione incompleta.");
        }

        AuthResponse authResponse = service.authenticateWithGoogle(email, name, sub);
        setJwtCookie(httpRequest, response, authResponse.getToken());
        authResponse.setToken(null);
        return ResponseEntity.ok(authResponse);
    }

    private void setJwtCookie(HttpServletRequest request, HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .sameSite("Lax") // Helps with CSRF while allowing API usage
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthResponse authResponse = service.register(request);
        setJwtCookie(httpRequest, response, authResponse.getToken());
        // Do not send token in body to prevent any storage by mistake
        authResponse.setToken(null);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthResponse> authenticate(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthResponse authResponse = service.authenticate(request, extractClientIp(httpRequest));
        setJwtCookie(httpRequest, response, authResponse.getToken());
        // Do not send token in body to prevent any storage by mistake
        authResponse.setToken(null);
        return ResponseEntity.ok(authResponse);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .path("/")
                .maxAge(0) // Expire immediately
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto != null && !forwardedProto.isBlank()) {
            return "https".equalsIgnoreCase(forwardedProto);
        }
        return request.isSecure();
    }
}

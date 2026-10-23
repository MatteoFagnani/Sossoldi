package com.financeapp.controller;

import com.financeapp.dto.AuthResponse;
import com.financeapp.dto.GoogleConfigResponse;
import com.financeapp.mapper.UserMapper;
import com.financeapp.model.User;
import com.financeapp.service.AuthenticationService;
import com.financeapp.service.GoogleAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error,
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
            AuthResponse authResponse = service.authenticateWithGoogle(
                    userInfo.email(),
                    userInfo.name(),
                    userInfo.givenName(),
                    userInfo.familyName(),
                    userInfo.picture()
            );
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

    private void setJwtCookie(HttpServletRequest request, HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        clearJwtCookie(request, response);
        return ResponseEntity.ok().build();
    }

    public static void clearJwtCookie(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private static boolean isSecureRequest(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto != null && !forwardedProto.isBlank()) {
            return "https".equalsIgnoreCase(forwardedProto);
        }
        return request.isSecure();
    }
}

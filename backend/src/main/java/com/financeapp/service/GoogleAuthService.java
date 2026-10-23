package com.financeapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    @Value("${google.client-id:}")
    private String clientId;

    @Value("${google.client-secret:}")
    private String clientSecret;

    @Value("${google.redirect-uri:}")
    private String redirectUri;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public boolean isConfigured() {
        return clientId != null && !clientId.trim().isBlank();
    }

    public String getClientId() {
        return clientId != null ? clientId.trim() : "";
    }

    public String getRedirectUri() {
        return redirectUri != null ? redirectUri.trim() : "";
    }

    public String buildAuthorizationUrl(String redirectUri) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google OAuth non e' configurato. Inserisci GOOGLE_CLIENT_ID nel file .env.");
        }
        String scope = URLEncoder.encode("openid email profile", StandardCharsets.UTF_8);
        String encodedRedirect = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
        return "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=" + URLEncoder.encode(clientId.trim(), StandardCharsets.UTF_8) +
                "&redirect_uri=" + encodedRedirect +
                "&response_type=code" +
                "&scope=" + scope +
                "&access_type=offline" +
                "&prompt=select_account";
    }

    public GoogleUserInfo exchangeCode(String code, String redirectUri) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google OAuth non e' configurato.");
        }

        try {
            String form = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                    "&client_id=" + URLEncoder.encode(clientId.trim(), StandardCharsets.UTF_8) +
                    "&client_secret=" + URLEncoder.encode(clientSecret != null ? clientSecret.trim() : "", StandardCharsets.UTF_8) +
                    "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                    "&grant_type=authorization_code";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Scambio codice Google fallito con status {}: {}", response.statusCode(), response.body());
                throw new IllegalArgumentException("Impossibile completare l'accesso con Google. Il codice di autorizzazione potrebbe essere scaduto.");
            }

            JsonNode tokenResponse = objectMapper.readTree(response.body());
            String idToken = tokenResponse.has("id_token") ? tokenResponse.get("id_token").asText() : null;
            String accessToken = tokenResponse.has("access_token") ? tokenResponse.get("access_token").asText() : null;

            if (idToken != null && !idToken.isBlank()) {
                try {
                    String[] parts = idToken.split("\\.");
                    if (parts.length >= 2) {
                        byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
                        JsonNode claims = objectMapper.readTree(decoded);
                        boolean emailVerified = claims.has("email_verified") && claims.get("email_verified").asBoolean(true);
                        GoogleUserInfo info = parseUserNode(claims);
                        if (info.email() != null && !info.email().isBlank() && emailVerified) {
                            return info;
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Impossibile decodificare direttamente il payload dell'id_token Google, procedo con tokeninfo: {}", ex.getMessage());
                }
                return verifyToken(idToken);
            }

            if (accessToken != null && !accessToken.isBlank()) {
                HttpRequest userinfoReq = HttpRequest.newBuilder()
                        .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                        .header("Authorization", "Bearer " + accessToken)
                        .timeout(Duration.ofSeconds(10))
                        .GET()
                        .build();

                HttpResponse<String> userinfoResp = httpClient.send(userinfoReq, HttpResponse.BodyHandlers.ofString());
                return parseUserNode(objectMapper.readTree(userinfoResp.body()));
            }

            throw new IllegalArgumentException("Risposta di Google priva di informazioni utente.");
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Errore durante lo scambio del codice Google OAuth", e);
            throw new RuntimeException("Errore durante l'autenticazione con Google.", e);
        }
    }

    private GoogleUserInfo verifyToken(String idToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken.trim()))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Verifica token Google fallita con status {}: {}", response.statusCode(), response.body());
                throw new IllegalArgumentException("Verifica token Google fallita. Il token potrebbe essere scaduto.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            boolean emailVerified = root.has("email_verified") && root.get("email_verified").asBoolean(true);
            GoogleUserInfo info = parseUserNode(root);

            if (info.email() == null || info.email().isBlank() || !emailVerified) {
                throw new IllegalArgumentException("L'account Google non ha un'email verificata.");
            }

            return info;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Errore durante la verifica del token Google", e);
            throw new RuntimeException("Impossibile verificare l'account con i server di Google.", e);
        }
    }

    private GoogleUserInfo parseUserNode(JsonNode node) {
        String email = node.has("email") ? node.get("email").asText() : null;
        String name = node.has("name") ? node.get("name").asText() : "";
        String givenName = extractGivenName(node, name);
        String familyName = extractFamilyName(node, name);
        String sub = node.has("sub") ? node.get("sub").asText() : "";
        String picture = node.has("picture") ? node.get("picture").asText() : "";
        return new GoogleUserInfo(email, name, givenName, familyName, sub, picture);
    }

    private String extractGivenName(JsonNode node, String fullName) {
        if (node.hasNonNull("given_name") && !node.get("given_name").asText().isBlank()) {
            return node.get("given_name").asText().trim();
        }
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim().split("\\s+")[0];
        }
        return "";
    }

    private String extractFamilyName(JsonNode node, String fullName) {
        if (node.hasNonNull("family_name") && !node.get("family_name").asText().isBlank()) {
            return node.get("family_name").asText().trim();
        }
        if (fullName != null && !fullName.isBlank()) {
            String[] parts = fullName.trim().split("\\s+", 2);
            if (parts.length > 1) {
                return parts[1].trim();
            }
        }
        return "";
    }

    public record GoogleUserInfo(String email, String name, String givenName, String familyName, String sub, String picture) {}
}

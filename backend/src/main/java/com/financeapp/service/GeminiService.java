package com.financeapp.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeapp.dto.AiStatusDto;
import com.financeapp.dto.CategorizeMerchantRequest;
import com.financeapp.model.Category;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class GeminiService {

    private final String systemApiKey;
    private final String defaultModel;
    private final String apiUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiService(
            @Value("${gemini.api-key:}") String systemApiKey,
            @Value("${gemini.model:gemini-3.5-flash-lite}") String defaultModel,
            @Value("${gemini.api-url:https://generativelanguage.googleapis.com/v1beta}") String apiUrl,
            ObjectMapper objectMapper) {
        this.systemApiKey = systemApiKey != null ? systemApiKey.trim() : "";
        this.defaultModel = (defaultModel != null && !defaultModel.trim().isEmpty()) ? defaultModel.trim() : "gemini-3.5-flash-lite";
        this.apiUrl = (apiUrl != null && !apiUrl.trim().isEmpty()) ? apiUrl.trim() : "https://generativelanguage.googleapis.com/v1beta";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public String getActiveApiKey(User user) {
        if (user != null && user.getGeminiApiKey() != null && !user.getGeminiApiKey().trim().isEmpty()) {
            return user.getGeminiApiKey().trim();
        }
        return !systemApiKey.isEmpty() ? systemApiKey : null;
    }

    public boolean isConfigured(User user) {
        return getActiveApiKey(user) != null;
    }

    public AiStatusDto getStatus(User user) {
        String activeKey = getActiveApiKey(user);
        boolean isUserKey = user != null && user.getGeminiApiKey() != null && !user.getGeminiApiKey().trim().isEmpty();
        boolean hasSystemKey = !systemApiKey.isEmpty();

        String source = isUserKey ? "USER" : (hasSystemKey ? "SYSTEM" : "NONE");
        String masked = maskKey(activeKey);

        return AiStatusDto.builder()
                .configured(activeKey != null)
                .source(source)
                .model(defaultModel)
                .maskedKey(masked)
                .message(activeKey != null
                        ? "Gemini AI configurato (" + (isUserKey ? "chiave account" : "chiave di sistema .env") + ")"
                        : "Nessuna API Key configurata. Inserisci la tua chiave gratuita per abilitare la categorizzazione automatica.")
                .build();
    }

    public Map<String, Object> testConnection(User user, String keyOverride) {
        String keyToUse = (keyOverride != null && !keyOverride.trim().isEmpty()) ? keyOverride.trim() : getActiveApiKey(user);
        Map<String, Object> result = new HashMap<>();

        if (keyToUse == null || keyToUse.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "Nessuna chiave API specificata o configurata.");
            return result;
        }

        try {
            String testPrompt = "Rispondi esclusivamente con un JSON: {\"status\": \"ok\", \"message\": \"Gemini Free Tier attivo\"}";
            String response = executeGeminiCall(keyToUse, defaultModel, testPrompt, true);
            JsonNode root = objectMapper.readTree(response);
            String candidateText = extractCandidateText(root);

            result.put("success", true);
            result.put("model", defaultModel);
            result.put("message", "Connessione riuscita con successo a Google Gemini (" + defaultModel + ")!");
            result.put("raw", candidateText);
            return result;
        } catch (Exception e) {
            log.warn("Gemini connection test failed: {}", e.getMessage());
            result.put("success", false);
            result.put("message", "Test fallito: " + mapFriendlyErrorMessage(e.getMessage()));
            return result;
        }
    }

    public List<MerchantPrediction> predictCategories(
            User user,
            List<CategorizeMerchantRequest.MerchantItem> items,
            List<Category> allCategories) {

        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        String apiKey = getActiveApiKey(user);
        if (apiKey == null) {
            throw new IllegalStateException("Chiave API Gemini non configurata. Configurala nel tuo Profilo o nel file .env.");
        }

        // Prepare categories summary for Gemini
        StringBuilder catList = new StringBuilder();
        for (Category cat : allCategories) {
            catList.append(String.format("- ID: %d | Tipo: %s | %s%s\n",
                    cat.getId(),
                    cat.getType().name(),
                    cat.getParent() != null ? "Macro: " + cat.getParent().getName() + " > " : "",
                    cat.getName()
            ));
        }

        StringBuilder itemsList = new StringBuilder();
        for (CategorizeMerchantRequest.MerchantItem item : items) {
            itemsList.append(String.format("- Descrizione: \"%s\" | Tipo: %s\n",
                    item.getDescription().replace("\"", "'"),
                    item.getType().name()
            ));
        }

        String prompt = "Sei un assistente per la gestione delle finanze personali e l'analisi di estratti conto bancari italiani.\n"
                + "Il tuo compito è mappare ciascun negozio, esercente o causale sconosciuta alla categoria più idonea tra quelle fornite dall'utente.\n\n"
                + "REGOLE TASSATIVE:\n"
                + "1. Assegna a ciascuna descrizione ESATTAMENTE un 'categoryId' numerico scelto tra quelli elencati.\n"
                + "2. Il 'categoryId' DEVE avere lo stesso tipo (EXPENSE per uscite, INCOME per entrate) indicato per l'esercente.\n"
                + "3. Se è disponibile una sottocategoria specifica (es: 'Supermercato' sotto 'Alimentari', 'Carburante' sotto 'Trasporti', 'Streaming' sotto 'Intrattenimento', 'Abbigliamento' sotto 'Shopping'), preferisci SEMPRE la sottocategoria specifica.\n"
                + "4. Se l'esercente non è riconoscibile con certezza, usa la categoria 'Da classificare' o 'Altro' del tipo corrispondente.\n"
                + "5. Rispondi con un JSON array valido. Non includere testo o markdown prima o dopo il JSON.\n\n"
                + "CATEGORIE DISPONIBILI:\n" + catList + "\n\n"
                + "ESERCENTI DA CATEGORIZZARE:\n" + itemsList + "\n\n"
                + "FORMATO DI RISPOSTA RICHIESTO:\n"
                + "[\n"
                + "  {\n"
                + "    \"description\": \"Nome esatto dell'esercente\",\n"
                + "    \"categoryId\": 123,\n"
                + "    \"reason\": \"Breve motivazione (es: Supermercato alimentare)\"\n"
                + "  }\n"
                + "]";

        try {
            String response = executeGeminiCall(apiKey, defaultModel, prompt, true);
            JsonNode root = objectMapper.readTree(response);
            String candidateText = extractCandidateText(root);

            List<MerchantPrediction> predictions = objectMapper.readValue(
                    candidateText,
                    new TypeReference<List<MerchantPrediction>>() {}
            );

            // Validate each prediction against valid category IDs
            Map<Long, Category> categoryMap = new HashMap<>();
            for (Category c : allCategories) {
                categoryMap.put(c.getId(), c);
            }

            for (MerchantPrediction pred : predictions) {
                Category cat = categoryMap.get(pred.getCategoryId());
                if (cat != null) {
                    pred.setCategoryName(cat.getName());
                }
            }

            return predictions;
        } catch (Exception e) {
            log.error("Failed to categorize merchants via Gemini: {}", e.getMessage(), e);
            throw new RuntimeException("Errore durante la categorizzazione AI con Gemini: " + mapFriendlyErrorMessage(e.getMessage()), e);
        }
    }

    private String executeGeminiCall(String apiKey, String model, String prompt, boolean jsonMode) throws Exception {
        List<String> modelsToTry = new ArrayList<>();
        modelsToTry.add(model);
        if (!model.equals("gemini-3.5-flash-lite")) modelsToTry.add("gemini-3.5-flash-lite");
        if (!model.equals("gemini-2.5-flash-lite")) modelsToTry.add("gemini-2.5-flash-lite");
        if (!model.equals("gemini-2.0-flash-lite")) modelsToTry.add("gemini-2.0-flash-lite");
        if (!model.equals("gemini-1.5-flash")) modelsToTry.add("gemini-1.5-flash");

        Exception lastException = null;
        for (String currentModel : modelsToTry) {
            try {
                return executeSingleCall(apiKey, currentModel, prompt, jsonMode);
            } catch (Exception ex) {
                lastException = ex;
                String msg = ex.getMessage();
                // If 404 model not found, try fallback model
                if (msg != null && (msg.contains("404") || msg.contains("not found") || msg.contains("is not supported"))) {
                    log.warn("Model {} failed with 404, attempting fallback model...", currentModel);
                    continue;
                }
                throw ex;
            }
        }
        throw lastException != null ? lastException : new RuntimeException("Tutti i tentativi con i modelli Gemini sono falliti.");
    }

    private String executeSingleCall(String apiKey, String model, String prompt, boolean jsonMode) throws Exception {
        String endpoint = String.format("%s/models/%s:generateContent?key=%s", apiUrl, model, apiKey);

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.1);
        if (jsonMode) {
            generationConfig.put("responseMimeType", "application/json");
        }

        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("contents", List.of(content));
        requestPayload.put("generationConfig", generationConfig);

        String jsonPayload = objectMapper.writeValueAsString(requestPayload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json; charset=utf-8")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(45))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            return response.body();
        }

        String errBody = response.body();
        log.error("Gemini API error HTTP {}: {}", response.statusCode(), errBody);
        throw new RuntimeException("HTTP " + response.statusCode() + ": " + errBody);
    }

    private String extractCandidateText(JsonNode root) {
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && parts.size() > 0) {
                return parts.get(0).path("text").asText();
            }
        }
        throw new IllegalStateException("Nessun testo valido generato da Gemini: " + root);
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 8) return "";
        return key.substring(0, 6) + "..." + key.substring(key.length() - 4);
    }

    private String mapFriendlyErrorMessage(String raw) {
        if (raw == null) return "Errore sconosciuto";
        if (raw.contains("API_KEY_INVALID") || raw.contains("400")) {
            return "Chiave API Gemini non valida o scaduta. Verifica la chiave su Google AI Studio.";
        }
        if (raw.contains("RESOURCE_EXHAUSTED") || raw.contains("429")) {
            return "Limite di richieste superato per il piano gratuito di Gemini (15 RPM). Attendi qualche secondo e riprova.";
        }
        if (raw.contains("PERMISSION_DENIED") || raw.contains("403")) {
            return "Permesso negato dall'API Gemini. Assicurati che l'API generativa sia abilitata per la tua chiave.";
        }
        if (raw.contains("404")) {
            return "Modello Gemini non disponibile per la chiave o la regione specificata.";
        }
        return raw;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class MerchantPrediction {
        private String description;
        private Long categoryId;
        private String categoryName;
        private String reason;
    }
}


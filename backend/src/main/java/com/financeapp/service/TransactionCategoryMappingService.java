package com.financeapp.service;

import com.financeapp.dto.CategorizeMerchantRequest;
import com.financeapp.dto.CategorizeMerchantResponse;
import com.financeapp.dto.TransactionCategoryMappingDto;
import com.financeapp.model.Category;
import com.financeapp.model.TransactionCategoryMapping;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.CategoryRepository;
import com.financeapp.repository.TransactionCategoryMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionCategoryMappingService {

    private final TransactionCategoryMappingRepository repository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final GeminiService geminiService;

    public List<TransactionCategoryMappingDto> getMappings(User user) {
        return repository.findByUserId(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TransactionCategoryMappingDto saveMapping(User user, TransactionCategoryMappingDto dto) {
        Category category = categoryService.getCategoryAndVerifyOwner(dto.getCategoryId(), user);
        if (category.getType() != dto.getType()) {
            throw new IllegalArgumentException("Category type does not match mapping type");
        }

        TransactionCategoryMapping mapping = repository
                .findByUserIdAndTypeAndMatchKey(user.getId(), dto.getType(), dto.getMatchKey())
                .orElse(TransactionCategoryMapping.builder()
                        .user(user)
                        .type(dto.getType())
                        .matchKey(dto.getMatchKey())
                        .build());

        mapping.setDescription(dto.getDescription());
        mapping.setCategory(category);

        return toDto(repository.save(mapping));
    }

    @Transactional
    public CategorizeMerchantResponse categorizeAndMapUnknown(User user, List<CategorizeMerchantRequest.MerchantItem> rawItems) {
        if (rawItems == null || rawItems.isEmpty()) {
            return CategorizeMerchantResponse.builder()
                    .mapped(Collections.emptyList())
                    .totalProcessed(0)
                    .newlyMapped(0)
                    .message("Nessun esercente fornito per la categorizzazione.")
                    .build();
        }

        // 1. Clean descriptions and deduplicate by (type, matchKey)
        Map<String, CategorizeMerchantRequest.MerchantItem> uniqueCleanItems = new LinkedHashMap<>();
        for (CategorizeMerchantRequest.MerchantItem item : rawItems) {
            if (item.getDescription() == null || item.getDescription().trim().isEmpty() || item.getType() == null) {
                continue;
            }
            String cleanName = cleanMerchantName(item.getDescription());
            if (cleanName.isEmpty()) continue;
            String matchKey = buildMatchKey(item.getType(), cleanName);
            if (!uniqueCleanItems.containsKey(matchKey)) {
                uniqueCleanItems.put(matchKey, CategorizeMerchantRequest.MerchantItem.builder()
                        .description(cleanName)
                        .type(item.getType())
                        .build());
            }
        }

        if (uniqueCleanItems.isEmpty()) {
            return CategorizeMerchantResponse.builder()
                    .mapped(Collections.emptyList())
                    .totalProcessed(0)
                    .newlyMapped(0)
                    .message("Nessuna descrizione valida trovata dopo la pulizia.")
                    .build();
        }

        // 2. Fetch existing mappings for this user
        List<TransactionCategoryMapping> existingMappings = repository.findByUserId(user.getId());
        Map<String, TransactionCategoryMapping> existingMap = new HashMap<>();
        for (TransactionCategoryMapping m : existingMappings) {
            existingMap.put(m.getMatchKey(), m);
        }

        List<CategorizeMerchantRequest.MerchantItem> unknownItems = new ArrayList<>();
        List<TransactionCategoryMappingDto> finalMapped = new ArrayList<>();

        for (Map.Entry<String, CategorizeMerchantRequest.MerchantItem> entry : uniqueCleanItems.entrySet()) {
            String matchKey = entry.getKey();
            CategorizeMerchantRequest.MerchantItem item = entry.getValue();
            TransactionCategoryMapping existing = existingMap.get(matchKey);

            // Also check keyword match if no exact matchKey exists
            if (existing == null) {
                existing = findKeywordMatch(item.getType(), item.getDescription(), existingMappings);
            }

            // Check if existing mapping has a specific category (not generic fallback)
            boolean isUnclassified = existing == null
                    || existing.getCategory() == null
                    || "da classificare".equalsIgnoreCase(existing.getCategory().getName())
                    || "altro".equalsIgnoreCase(existing.getCategory().getName());

            if (isUnclassified) {
                unknownItems.add(item);
            } else {
                finalMapped.add(toDto(existing));
            }
        }

        int newlyMappedCount = 0;
        // 3. If there are unknown items, call Gemini
        if (!unknownItems.isEmpty()) {
            List<Category> allCategories = categoryRepository.findByUserId(user.getId());
            List<GeminiService.MerchantPrediction> predictions = geminiService.predictCategories(user, unknownItems, allCategories);

            Map<Long, Category> categoryById = allCategories.stream()
                    .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));

            Category defaultExpenseCat = allCategories.stream()
                    .filter(c -> c.getType() == TransactionType.EXPENSE && "Da classificare".equalsIgnoreCase(c.getName()))
                    .findFirst()
                    .orElse(allCategories.stream().filter(c -> c.getType() == TransactionType.EXPENSE).findFirst().orElse(null));

            Category defaultIncomeCat = allCategories.stream()
                    .filter(c -> c.getType() == TransactionType.INCOME && "Entrate varie".equalsIgnoreCase(c.getName()))
                    .findFirst()
                    .orElse(allCategories.stream().filter(c -> c.getType() == TransactionType.INCOME).findFirst().orElse(null));

            for (CategorizeMerchantRequest.MerchantItem unknownItem : unknownItems) {
                GeminiService.MerchantPrediction pred = predictions.stream()
                        .filter(p -> p.getDescription() != null && p.getDescription().trim().equalsIgnoreCase(unknownItem.getDescription().trim()))
                        .findFirst()
                        .orElse(null);

                Category targetCat = null;
                if (pred != null && pred.getCategoryId() != null) {
                    targetCat = categoryById.get(pred.getCategoryId());
                    if (targetCat != null && targetCat.getType() != unknownItem.getType()) {
                        targetCat = null;
                    }
                }

                if (targetCat == null) {
                    targetCat = unknownItem.getType() == TransactionType.EXPENSE ? defaultExpenseCat : defaultIncomeCat;
                }

                if (targetCat == null) {
                    continue;
                }

                String matchKey = buildMatchKey(unknownItem.getType(), unknownItem.getDescription());
                TransactionCategoryMapping mapping = repository
                        .findByUserIdAndTypeAndMatchKey(user.getId(), unknownItem.getType(), matchKey)
                        .orElse(TransactionCategoryMapping.builder()
                                .user(user)
                                .type(unknownItem.getType())
                                .matchKey(matchKey)
                                .build());

                mapping.setDescription(unknownItem.getDescription());
                mapping.setCategory(targetCat);

                TransactionCategoryMapping saved = repository.save(mapping);
                finalMapped.add(toDto(saved));
                newlyMappedCount++;
            }
        }

        String message = String.format("Processati %d esercenti unici: %d mappati automaticamente con Gemini AI, %d già riconosciuti dalle tue mappature.",
                uniqueCleanItems.size(), newlyMappedCount, uniqueCleanItems.size() - unknownItems.size());

        return CategorizeMerchantResponse.builder()
                .mapped(finalMapped)
                .totalProcessed(uniqueCleanItems.size())
                .newlyMapped(newlyMappedCount)
                .message(message)
                .build();
    }

    public static String cleanMerchantName(String raw) {
        if (raw == null) return "";
        String text = raw.trim();
        Matcher pressoMatcher = Pattern.compile("(?i)\\bPRESSO\\b\\s+(.+)$").matcher(text);
        if (pressoMatcher.find()) {
            text = pressoMatcher.group(1).trim();
        }
        text = text.replaceAll("(?i)^C/O\\s+", "");
        text = text.replaceAll("(?i)^(PAGAMENTO|PAGAM|DISPOSIZIONE\\s+BONIFICO|BONIFICO|ADDEBITO\\s+DIRETTO|ADDEBITO|ACCREDITO|PRELIEVO)(\\s+(BANCOMAT|POS|SEPA|CARTA|TRAMITE\\s+POS|A\\s+FAVORE\\s+DI))?\\s*", "");
        text = text.replaceAll("(?i)^A\\s+FAVORE\\s+DI\\s+", "");
        text = text.replaceAll("(?i)\\bDEL\\s+\\d{1,2}[./-]\\d{1,2}([./-]\\d{2,4})?\\b", " ");
        text = text.replaceAll("\\b\\d{1,2}[./-]\\d{1,2}([./-]\\d{2,4})?\\b", " ");
        text = text.replaceAll("(?i)\\bORE\\s+\\d{1,2}[:.]\\d{2}([:.]\\d{2})?\\b", " ");
        text = text.replaceAll("\\b\\d{1,2}:\\d{2}(:\\d{2})?\\b", " ");
        text = text.replaceAll("(?i)\\b(IMPORTO|IMP|TOTALE|TOT)\\b[:.\\s]*\\d+([.,]\\d+)?\\s*(EUR|EURO|€|E\\.)?", " ");
        text = text.replaceAll("(?i)\\b(EUR|EURO|€|E\\.)\\s*\\d+([.,]\\d+)?", " ");
        text = text.replaceAll("(?i)\\d+([.,]\\d+)?\\s*(EUR|EURO|€|E\\.)\\b", " ");
        text = text.replaceAll("\\d+([.,]\\d+)?\\s*€", " ");
        text = text.replaceAll("\\b\\d+([.,]\\d{2})\\b", " ");
        text = text.replaceAll("(?i)\\b(PAN|CARTA|C\\.ES|AUT|AUTH|TERMINALE|POS|OPERAZIONE|DIV|REF|ID|TRX|N\\.|NUM)\\b[:.\\s]*\\w+", " ");
        text = text.replaceAll("[*\\d]{6,}", " ");
        text = text.replaceAll("\\*{3,}\\d+", " ");
        text = text.replaceAll("(?i)\\bN\\.\\s*\\d+", " ");
        text = text.replaceAll("(?i)\\b(EUR|EURO)\\b|[€]", " ");
        text = text.replaceAll("\\s*-\\s*", " ").replaceAll("\\s+", " ").trim();
        text = text.replaceAll("^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$", "").trim();
        return text.isEmpty() ? raw.split("-")[0].trim() : text;
    }

    public static String normalizeKey(String description) {
        if (description == null) return "";
        String normalized = Normalizer.normalize(description, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\b\\d{1,2}[./-]\\d{1,2}([./-]\\d{2,4})?\\b", " ")
                .replaceAll("\\b\\d{1,2}:\\d{2}(:\\d{2})?\\b", " ")
                .replaceAll("\\b[a-z]*\\d+[a-z\\d]*\\b", " ")
                .replaceAll("\\b\\d+[a-z]+\\b", " ")
                .replaceAll("x{2,}", " ")
                .replaceAll("[^a-z\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return normalized.isEmpty() ? description.trim().toLowerCase(Locale.ROOT) : normalized;
    }

    public static String buildMatchKey(TransactionType type, String merchant) {
        return type.name() + ":" + normalizeKey(merchant);
    }

    private TransactionCategoryMapping findKeywordMatch(TransactionType type, String cleanDescription, List<TransactionCategoryMapping> mappings) {
        String normalized = normalizeKey(cleanDescription);
        String prefix = type.name() + ":";
        return mappings.stream()
                .filter(m -> m.getType() == type && m.getMatchKey() != null && m.getMatchKey().startsWith(prefix))
                .filter(m -> {
                    String kw = m.getMatchKey().substring(prefix.length());
                    return !kw.isEmpty() && normalized.contains(kw);
                })
                .max(Comparator.comparingInt(m -> m.getMatchKey().length()))
                .orElse(null);
    }

    private TransactionCategoryMappingDto toDto(TransactionCategoryMapping mapping) {
        TransactionCategoryMappingDto dto = new TransactionCategoryMappingDto();
        dto.setId(mapping.getId());
        dto.setType(mapping.getType());
        dto.setMatchKey(mapping.getMatchKey());
        dto.setDescription(mapping.getDescription());
        dto.setCategoryId(mapping.getCategory().getId());
        dto.setCategoryName(mapping.getCategory().getName());
        return dto;
    }
}

package com.financeapp.service;

import com.financeapp.dto.CategoryDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.CategoryMapper;
import com.financeapp.model.Category;
import com.financeapp.model.TransactionCategoryMapping;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.CategoryRepository;
import com.financeapp.repository.TransactionCategoryMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionCategoryMappingRepository mappingRepository;
    private final CategoryMapper categoryMapper;

    @Transactional
    public void seedDefaultCategories(User user) {
        List<Category> existing = categoryRepository.findByUserId(user.getId());

        // 1. Casa & Utenze
        Category home = seedMacro(existing, "Casa & Utenze", TransactionType.EXPENSE, "#f59e0b", user);
        seedSubWithKeywords(home, "Affitto / Mutuo", "#d97706", user, "affitto", "canone locazione", "mutuo casa", "rata mutuo");
        seedSubWithKeywords(home, "Bollette & Utenze", "#b45309", user, "enel", "plenitude", "eni plenitude", "sorgenia", "edison", "a2a", "hera", "acea", "iren", "servizio elettrico", "nen", "octopus energy", "acquedotto", "tari", "luce", "gas", "bolletta");
        seedSubWithKeywords(home, "Internet & Telefono", "#92400e", user, "fastweb", "eolo", "sky wifi", "open fiber", "iliad", "vodafone", "windtre", "tim", "ho mobile", "kena", "very mobile", "poste mobile", "fibra");
        seedSubWithKeywords(home, "Casa & Manutenzione", "#78350f", user, "ikea", "leroy merlin", "mondo convenienza", "brico", "obi", "idraulico", "elettricista", "ferramenta", "condominio", "spese condominiali");

        // 2. Spesa Alimentare
        Category food = seedMacro(existing, "Spesa Alimentare", TransactionType.EXPENSE, "#ef4444", user);
        seedSubWithKeywords(food, "Supermercato & Alimentari", "#dc2626", user, "esselunga", "conad", "coop", "carrefour", "lidl", "eurospin", "aldi", "pam", "iper", "md", "crai", "tigros", "bennet", "il gigante", "despar", "sigma", "unes", "penny market", "mercato", "discount", "macelleria", "pescheria", "forno", "panettiere", "panificio", "alimentari");

        // 3. Svago & Uscite
        Category leisure = seedMacro(existing, "Svago & Uscite", TransactionType.EXPENSE, "#8b5cf6", user);
        seedSubWithKeywords(leisure, "Ristoranti & Pizzerie", "#7c3aed", user, "ristorante", "trattoria", "osteria", "pizzeria", "sushi", "poke", "ramen", "burger", "mcdonald", "burger king", "kfc", "old wild west", "five guys", "deliveroo", "glovo", "just eat", "ubereats", "uber eats");
        seedSubWithKeywords(leisure, "Bar & Aperitivi", "#6d28d9", user, "bar", "caffe", "caffetteria", "starbucks", "autogrill", "illy", "aperitivo", "pub", "birreria", "cocktail", "gelateria", "gelato", "grom");
        seedSubWithKeywords(leisure, "Serate & Feste", "#5b21b6", user, "discoteca", "club", "festa", "festival", "serata", "night", "prive", "evento notte");
        seedSubWithKeywords(leisure, "Cinema, Concerti & Eventi", "#4c1d95", user, "cinema", "ticketone", "eventim", "teatro", "concerto", "mostra", "museo", "spettacolo");
        seedSubWithKeywords(leisure, "Sport & Hobby", "#a78bfa", user, "palestra", "fitactive", "mcfit", "virgin active", "anytime fitness", "padel", "tennis", "calcetto", "piscina", "nuoto", "sci", "decathlon", "steam", "playstation", "xbox", "nintendo");

        // 4. Trasporti
        Category transport = seedMacro(existing, "Trasporti", TransactionType.EXPENSE, "#f97316", user);
        seedSubWithKeywords(transport, "Carburante & Ricariche", "#ea580c", user, "eni station", "q8", "esso", "ip", "tamoil", "benzina", "carburante", "diesel", "metano", "gpl", "enel x way", "tesla supercharger", "ionity", "be charge");
        seedSubWithKeywords(transport, "Mezzi Pubblici & Treni", "#c2410c", user, "atm", "atac", "bus", "metro", "tpl", "gtt", "anm", "trenitalia", "italo", "trenord");
        seedSubWithKeywords(transport, "Auto, Moto & Manutenzione", "#9a3412", user, "autostrade", "telepass", "pedaggio", "unipolmove", "easypark", "parcheggio", "parking", "meccanico", "gommista", "revisione", "autofficina", "norauto", "midas", "carglass", "unipolsai", "genertel", "prima assicurazioni", "allianz", "zurich", "linear", "bollo auto");
        seedSubWithKeywords(transport, "Taxi & Mobilità Condivisa", "#7c2d12", user, "uber", "freenow", "taxi", "it taxi", "enjoy", "share now", "lime", "dott", "tier", "cooltra");

        // 5. Shopping & Personale
        Category shopping = seedMacro(existing, "Shopping & Personale", TransactionType.EXPENSE, "#ec4899", user);
        seedSubWithKeywords(shopping, "Abbigliamento & Accessori", "#db2777", user, "zara", "hm", "h m", "ovs", "nike", "adidas", "pull bear", "bershka", "primark", "zalando", "intimissimi", "calzedonia", "tezenis", "uniqlo", "mango", "stradivarius", "foot locker", "snipes", "cisalfa");
        seedSubWithKeywords(shopping, "Cura della Persona", "#be185d", user, "sephora", "douglas", "acqua sapone", "tigota", "profumeria", "kiko", "parrucchiere", "barbiere", "barber", "estetista");
        seedSubWithKeywords(shopping, "Elettronica & Shopping Online", "#9d174d", user, "amazon", "mediaworld", "unieuro", "apple", "eprice", "euronics", "gamestop", "ebay", "aliexpress", "temu", "shein");

        // 6. Salute & Benessere
        Category health = seedMacro(existing, "Salute & Benessere", TransactionType.EXPENSE, "#14b8a6", user);
        seedSubWithKeywords(health, "Farmacia & Medicinali", "#0d9488", user, "farmacia", "lafarmacia", "dr max", "lloyds", "redcare", "efarma", "docpeter", "medicinali", "farmaci");
        seedSubWithKeywords(health, "Visite Mediche & Dentista", "#0f766e", user, "studio medico", "visita medica", "dentista", "dentalpro", "synlab", "cerba", "santagostino", "ospedale", "analisi cliniche");

        // 7. Abbonamenti & Servizi
        Category subscriptions = seedMacro(existing, "Abbonamenti & Servizi", TransactionType.EXPENSE, "#6366f1", user);
        seedSubWithKeywords(subscriptions, "Streaming Video & Musica", "#4f46e5", user, "netflix", "spotify", "prime video", "disney", "dazn", "now tv", "youtube premium", "apple music", "apple tv", "tidal");
        seedSubWithKeywords(subscriptions, "Software & Servizi Digitali", "#4338ca", user, "chatgpt", "openai", "icloud", "google one", "microsoft 365", "github", "canva", "notion", "adobe", "dropbox");

        // 8. Viaggi & Vacanze
        Category travel = seedMacro(existing, "Viaggi & Vacanze", TransactionType.EXPENSE, "#06b6d4", user);
        seedSubWithKeywords(travel, "Alloggi & Hotel", "#0891b2", user, "booking", "airbnb", "hotel", "b b", "bed breakfast", "hostel");
        seedSubWithKeywords(travel, "Voli & Trasporti Vacanze", "#0e7490", user, "ryanair", "easyjet", "wizz", "ita airways", "lufthansa", "vueling", "noleggio auto", "rentalcars", "hertz", "avis", "sixt");
        seedSubWithKeywords(travel, "Vacanze & Escursioni", "#155e75", user, "viaggio", "vacanza", "tour", "escursione", "traghetto", "agenzia viaggi");

        // 9. Investimenti & Risparmio
        Category savings = seedMacro(existing, "Investimenti & Risparmio", TransactionType.EXPENSE, "#3b82f6", user);
        seedSubWithKeywords(savings, "Investimenti & PAC", "#2563eb", user, "directa", "moneyfarm", "trade republic", "scalable", "degiro", "fineco trading", "pac", "investimento", "etf", "roboadvisor");
        seedSubWithKeywords(savings, "Fondo Emergenza & Risparmio", "#1d4ed8", user, "fondo emergenza", "risparmio", "accantonamento");

        // 10. Altro & Imprevisti
        Category otherExpense = seedMacro(existing, "Altro & Imprevisti", TransactionType.EXPENSE, "#64748b", user);
        seedSubWithKeywords(otherExpense, "Regali & Donazioni", "#475569", user, "regalo", "regali", "donazione", "onlus", "beneficenza", "croce rossa", "unicef");
        seedSubWithKeywords(otherExpense, "Tasse & Spese Bancarie", "#334155", user, "f24", "agenzia entrate", "pagopa", "pago pa", "inps", "multa", "canone conto", "imposta di bollo", "commissione bancaria");
        seedSubWithKeywords(otherExpense, "Spese Varie", "#1e293b", user, "spese varie", "pos", "sumup", "paypal", "prelievo contante", "atm prelievo");

        // ENTRATE (INCOME)
        Category work = seedMacro(existing, "Lavoro", TransactionType.INCOME, "#10b981", user);
        seedSubWithKeywords(work, "Stipendio", "#059669", user, "stipendio", "salary", "retribuzione", "cedolino", "bonifico stipendio");
        seedSubWithKeywords(work, "Tredicesima & Quattordicesima", "#047857", user, "tredicesima", "quattordicesima");
        seedSubWithKeywords(work, "Bonus & Straordinari", "#065f46", user, "bonus", "premio produzione", "straordinari", "buoni pasto", "edenred", "welfare");
        seedSubWithKeywords(work, "Lavoro Autonomo & Extra", "#064e3b", user, "fattura", "parcella", "saldo fattura", "onorario", "prestazione occasionale", "consulenza");

        Category investments = seedMacro(existing, "Investimenti & Rendite", TransactionType.INCOME, "#3b82f6", user);
        seedSubWithKeywords(investments, "Dividendi & Interessi", "#2563eb", user, "dividendo", "dividend", "interessi", "interest", "cedola");
        seedSubWithKeywords(investments, "Rendite & Capital Gain", "#1d4ed8", user, "capital gain", "vendita titoli", "plusvalenza", "rendita", "affitto attivo");

        Category extraIncome = seedMacro(existing, "Entrate Extra & Rimborsi", TransactionType.INCOME, "#f59e0b", user);
        seedSubWithKeywords(extraIncome, "Rimborsi & Splitwise", "#d97706", user, "splitwise", "rimborso", "satispay", "bancomat pay", "rimborso 730", "rimborso irpef");
        seedSubWithKeywords(extraIncome, "Vendita Usato", "#b45309", user, "vinted", "subito", "wallapop", "ebay vendita");
        seedSubWithKeywords(extraIncome, "Regali Ricevuti & Altro", "#92400e", user, "regalo ricevuto", "mancia", "mance", "accredito vario");
    }

    private Category seedMacro(List<Category> existing, String name, TransactionType type, String color, User user) {
        return existing.stream()
                .filter(c -> c.getParent() == null && c.getType() == type && c.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(createCategoryEntity(name, type, color, user, null)));
    }

    private void seedSubWithKeywords(Category parent, String name, String color, User user, String... keywords) {
        Category sub = categoryRepository.findByUserIdAndParentIdAndName(user.getId(), parent.getId(), name)
                .orElseGet(() -> categoryRepository.save(createCategoryEntity(name, parent.getType(), color, user, parent)));

        for (String keyword : keywords) {
            String matchKey = TransactionCategoryMappingService.buildMatchKey(sub.getType(), keyword);
            mappingRepository.findByUserIdAndTypeAndMatchKey(user.getId(), sub.getType(), matchKey)
                    .orElseGet(() -> mappingRepository.save(TransactionCategoryMapping.builder()
                            .user(user)
                            .type(sub.getType())
                            .matchKey(matchKey)
                            .description(keyword)
                            .category(sub)
                            .build()));
        }
    }

    private Category createCategoryEntity(String name, TransactionType type, String color, User user, Category parent) {
        return Category.builder()
                .name(name)
                .type(type)
                .color(color)
                .user(user)
                .parent(parent)
                .build();
    }

    @Transactional
    public List<CategoryDto> getAllCategories(User user) {
        List<Category> categories = categoryRepository.findByUserId(user.getId());
        if (categories.isEmpty()) {
            seedDefaultCategories(user);
            categories = categoryRepository.findByUserId(user.getId());
        }
        return categories.stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    public CategoryDto createCategory(User user, CategoryDto categoryDto) {
        if (categoryRepository.existsByNameAndUserId(categoryDto.getName(), user.getId())) {
            throw new IllegalArgumentException("A category with this name already exists");
        }

        Category category = categoryMapper.toEntity(categoryDto);
        category.setUser(user);
        category.setParent(resolveParent(categoryDto, user, null));

        Category savedCategory = categoryRepository.save(category);
        return categoryMapper.toDto(savedCategory);
    }

    public CategoryDto updateCategory(User user, Long id, CategoryDto categoryDto) {
        Category category = getCategoryAndVerifyOwner(id, user);

        if (!category.getName().equals(categoryDto.getName()) &&
                categoryRepository.existsByNameAndUserId(categoryDto.getName(), user.getId())) {
            throw new IllegalArgumentException("A category with this name already exists");
        }

        category.setName(categoryDto.getName());
        category.setType(categoryDto.getType());
        category.setColor(categoryDto.getColor());
        category.setParent(resolveParent(categoryDto, user, id));

        Category updatedCategory = categoryRepository.save(category);
        return categoryMapper.toDto(updatedCategory);
    }

    public void deleteCategory(User user, Long id) {
        Category category = getCategoryAndVerifyOwner(id, user);
        categoryRepository.delete(category);
    }

    public Category getCategoryAndVerifyOwner(Long id, User user) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (!category.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to access this category");
        }

        return category;
    }

    private Category resolveParent(CategoryDto dto, User user, Long currentId) {
        if (dto.getParentId() == null) {
            return null;
        }
        if (dto.getParentId().equals(currentId)) {
            throw new IllegalArgumentException("A category cannot be its own macro category");
        }

        Category parent = getCategoryAndVerifyOwner(dto.getParentId(), user);
        if (parent.getParent() != null) {
            throw new IllegalArgumentException("A subcategory cannot be used as a macro category");
        }
        if (parent.getType() != dto.getType()) {
            throw new IllegalArgumentException("Macro category type must match category type");
        }
        return parent;
    }
}

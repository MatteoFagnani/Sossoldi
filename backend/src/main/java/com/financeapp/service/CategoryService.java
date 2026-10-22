package com.financeapp.service;

import com.financeapp.dto.CategoryDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.CategoryMapper;
import com.financeapp.model.Budget;
import com.financeapp.model.Category;
import com.financeapp.model.Transaction;
import com.financeapp.model.TransactionCategoryMapping;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.BudgetRepository;
import com.financeapp.repository.CategoryRepository;
import com.financeapp.repository.TransactionCategoryMappingRepository;
import com.financeapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionCategoryMappingRepository mappingRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryMapper categoryMapper;

    /**
     * Seeds realistic, essential default categories tailored to everyday life:
     * work, hanging out with friends, parties, investments, housing, transport, shopping, health.
     */
    public void seedDefaultCategories(User user) {
        // ==========================================
        // SPESE (EXPENSE)
        // ==========================================

        // 1. Casa & Utenze
        Category home = seedMacro("Casa & Utenze", TransactionType.EXPENSE, "#f59e0b", user);
        seedSub(home, "Affitto / Mutuo", "#d97706", user);
        seedSub(home, "Bollette & Utenze", "#b45309", user);
        seedSub(home, "Internet & Telefono", "#92400e", user);
        seedSub(home, "Casa & Manutenzione", "#78350f", user);

        // 2. Spesa Alimentare
        Category food = seedMacro("Spesa Alimentare", TransactionType.EXPENSE, "#ef4444", user);
        seedSub(food, "Supermercato & Alimentari", "#dc2626", user);

        // 3. Svago & Uscite
        Category leisure = seedMacro("Svago & Uscite", TransactionType.EXPENSE, "#8b5cf6", user);
        seedSub(leisure, "Ristoranti & Pizzerie", "#7c3aed", user);
        seedSub(leisure, "Bar & Aperitivi", "#6d28d9", user);
        seedSub(leisure, "Serate & Feste", "#5b21b6", user);
        seedSub(leisure, "Cinema, Concerti & Eventi", "#4c1d95", user);
        seedSub(leisure, "Sport & Hobby", "#a78bfa", user);

        // 4. Trasporti
        Category transport = seedMacro("Trasporti", TransactionType.EXPENSE, "#f97316", user);
        seedSub(transport, "Carburante & Ricariche", "#ea580c", user);
        seedSub(transport, "Mezzi Pubblici & Treni", "#c2410c", user);
        seedSub(transport, "Auto, Moto & Manutenzione", "#9a3412", user);
        seedSub(transport, "Taxi & Mobilità Condivisa", "#7c2d12", user);

        // 5. Shopping & Personale
        Category shopping = seedMacro("Shopping & Personale", TransactionType.EXPENSE, "#ec4899", user);
        seedSub(shopping, "Abbigliamento & Accessori", "#db2777", user);
        seedSub(shopping, "Cura della Persona", "#be185d", user);
        seedSub(shopping, "Elettronica & Shopping Online", "#9d174d", user);

        // 6. Salute & Benessere
        Category health = seedMacro("Salute & Benessere", TransactionType.EXPENSE, "#14b8a6", user);
        seedSub(health, "Farmacia & Medicinali", "#0d9488", user);
        seedSub(health, "Visite Mediche & Dentista", "#0f766e", user);

        // 7. Abbonamenti & Servizi
        Category subscriptions = seedMacro("Abbonamenti & Servizi", TransactionType.EXPENSE, "#6366f1", user);
        seedSub(subscriptions, "Streaming Video & Musica", "#4f46e5", user);
        seedSub(subscriptions, "Software & Servizi Digitali", "#4338ca", user);

        // 8. Viaggi & Vacanze
        Category travel = seedMacro("Viaggi & Vacanze", TransactionType.EXPENSE, "#06b6d4", user);
        seedSub(travel, "Alloggi & Hotel", "#0891b2", user);
        seedSub(travel, "Voli & Trasporti Vacanze", "#0e7490", user);
        seedSub(travel, "Vacanze & Escursioni", "#155e75", user);

        // 9. Investimenti & Risparmio
        Category savings = seedMacro("Investimenti & Risparmio", TransactionType.EXPENSE, "#3b82f6", user);
        seedSub(savings, "Investimenti & PAC", "#2563eb", user);
        seedSub(savings, "Fondo Emergenza & Risparmio", "#1d4ed8", user);

        // 10. Altro & Imprevisti
        Category otherExpense = seedMacro("Altro & Imprevisti", TransactionType.EXPENSE, "#64748b", user);
        seedSub(otherExpense, "Regali & Donazioni", "#475569", user);
        seedSub(otherExpense, "Tasse & Spese Bancarie", "#334155", user);
        seedSub(otherExpense, "Spese Varie", "#1e293b", user);

        // ==========================================
        // ENTRATE (INCOME)
        // ==========================================

        // 1. Lavoro
        Category work = seedMacro("Lavoro", TransactionType.INCOME, "#10b981", user);
        seedSub(work, "Stipendio", "#059669", user);
        seedSub(work, "Tredicesima & Quattordicesima", "#047857", user);
        seedSub(work, "Bonus & Straordinari", "#065f46", user);
        seedSub(work, "Lavoro Autonomo & Extra", "#064e3b", user);

        // 2. Investimenti & Rendite
        Category investments = seedMacro("Investimenti & Rendite", TransactionType.INCOME, "#3b82f6", user);
        seedSub(investments, "Dividendi & Interessi", "#2563eb", user);
        seedSub(investments, "Rendite & Capital Gain", "#1d4ed8", user);

        // 3. Entrate Extra & Rimborsi
        Category extraIncome = seedMacro("Entrate Extra & Rimborsi", TransactionType.INCOME, "#f59e0b", user);
        seedSub(extraIncome, "Rimborsi & Splitwise", "#d97706", user);
        seedSub(extraIncome, "Vendita Usato", "#b45309", user);
        seedSub(extraIncome, "Regali Ricevuti & Altro", "#92400e", user);

        seedDefaultMappings(user, home, food, leisure, transport, shopping, health, subscriptions, travel, savings, otherExpense, work, investments, extraIncome);
    }

    private void seedDefaultMappings(User user,
                                     Category home, Category food, Category leisure, Category transport,
                                     Category shopping, Category health, Category subscriptions,
                                     Category travel, Category savings, Category otherExpense,
                                     Category work, Category investments, Category extraIncome) {

        // Casa & Utenze
        seedKeywords(user, child(home, "Affitto / Mutuo"), "affitto", "canone locazione", "mutuo casa", "rata mutuo");
        seedKeywords(user, child(home, "Bollette & Utenze"), "enel", "plenitude", "eni plenitude", "sorgenia", "edison", "a2a", "hera", "acea", "iren", "servizio elettrico", "nen", "octopus energy", "acquedotto", "tari", "luce", "gas", "bolletta");
        seedKeywords(user, child(home, "Internet & Telefono"), "fastweb", "eolo", "sky wifi", "open fiber", "iliad", "vodafone", "windtre", "tim", "ho mobile", "kena", "very mobile", "poste mobile", "fibra");
        seedKeywords(user, child(home, "Casa & Manutenzione"), "ikea", "leroy merlin", "mondo convenienza", "brico", "obi", "idraulico", "elettricista", "ferramenta", "condominio", "spese condominiali");

        // Spesa Alimentare
        seedKeywords(user, child(food, "Supermercato & Alimentari"), "esselunga", "conad", "coop", "carrefour", "lidl", "eurospin", "aldi", "pam", "iper", "md", "crai", "tigros", "bennet", "il gigante", "despar", "sigma", "unes", "penny market", "mercato", "discount", "macelleria", "pescheria", "forno", "panettiere", "panificio", "alimentari");

        // Svago & Uscite
        seedKeywords(user, child(leisure, "Ristoranti & Pizzerie"), "ristorante", "trattoria", "osteria", "pizzeria", "sushi", "poke", "ramen", "burger", "mcdonald", "burger king", "kfc", "old wild west", "five guys", "deliveroo", "glovo", "just eat", "ubereats", "uber eats");
        seedKeywords(user, child(leisure, "Bar & Aperitivi"), "bar", "caffe", "caffetteria", "starbucks", "autogrill", "illy", "aperitivo", "pub", "birreria", "cocktail", "gelateria", "gelato", "grom");
        seedKeywords(user, child(leisure, "Serate & Feste"), "discoteca", "club", "festa", "festival", "serata", "night", "prive", "evento notte");
        seedKeywords(user, child(leisure, "Cinema, Concerti & Eventi"), "cinema", "ticketone", "eventim", "teatro", "concerto", "mostra", "museo", "spettacolo");
        seedKeywords(user, child(leisure, "Sport & Hobby"), "palestra", "fitactive", "mcfit", "virgin active", "anytime fitness", "padel", "tennis", "calcetto", "piscina", "nuoto", "sci", "decathlon", "steam", "playstation", "xbox", "nintendo");

        // Trasporti
        seedKeywords(user, child(transport, "Carburante & Ricariche"), "eni station", "q8", "esso", "ip", "tamoil", "benzina", "carburante", "diesel", "metano", "gpl", "enel x way", "tesla supercharger", "ionity", "be charge");
        seedKeywords(user, child(transport, "Mezzi Pubblici & Treni"), "atm", "atac", "bus", "metro", "tpl", "gtt", "anm", "trenitalia", "italo", "trenord");
        seedKeywords(user, child(transport, "Auto, Moto & Manutenzione"), "autostrade", "telepass", "pedaggio", "unipolmove", "easypark", "parcheggio", "parking", "meccanico", "gommista", "revisione", "autofficina", "norauto", "midas", "carglass", "unipolsai", "genertel", "prima assicurazioni", "allianz", "zurich", "linear", "bollo auto");
        seedKeywords(user, child(transport, "Taxi & Mobilità Condivisa"), "uber", "freenow", "taxi", "it taxi", "enjoy", "share now", "lime", "dott", "tier", "cooltra");

        // Shopping & Personale
        seedKeywords(user, child(shopping, "Abbigliamento & Accessori"), "zara", "hm", "h m", "ovs", "nike", "adidas", "pull bear", "bershka", "primark", "zalando", "intimissimi", "calzedonia", "tezenis", "uniqlo", "mango", "stradivarius", "foot locker", "snipes", "cisalfa");
        seedKeywords(user, child(shopping, "Cura della Persona"), "sephora", "douglas", "acqua sapone", "tigota", "profumeria", "kiko", "parrucchiere", "barbiere", "barber", "estetista");
        seedKeywords(user, child(shopping, "Elettronica & Shopping Online"), "amazon", "mediaworld", "unieuro", "apple", "eprice", "euronics", "gamestop", "ebay", "aliexpress", "temu", "shein");

        // Salute & Benessere
        seedKeywords(user, child(health, "Farmacia & Medicinali"), "farmacia", "lafarmacia", "dr max", "lloyds", "redcare", "efarma", "docpeter", "medicinali", "farmaci");
        seedKeywords(user, child(health, "Visite Mediche & Dentista"), "studio medico", "visita medica", "dentista", "dentalpro", "synlab", "cerba", "santagostino", "ospedale", "analisi cliniche");

        // Abbonamenti & Servizi
        seedKeywords(user, child(subscriptions, "Streaming Video & Musica"), "netflix", "spotify", "prime video", "disney", "dazn", "now tv", "youtube premium", "apple music", "apple tv", "tidal");
        seedKeywords(user, child(subscriptions, "Software & Servizi Digitali"), "chatgpt", "openai", "icloud", "google one", "microsoft 365", "github", "canva", "notion", "adobe", "dropbox");

        // Viaggi & Vacanze
        seedKeywords(user, child(travel, "Alloggi & Hotel"), "booking", "airbnb", "hotel", "b b", "bed breakfast", "hostel");
        seedKeywords(user, child(travel, "Voli & Trasporti Vacanze"), "ryanair", "easyjet", "wizz", "ita airways", "lufthansa", "vueling", "noleggio auto", "rentalcars", "hertz", "avis", "sixt");
        seedKeywords(user, child(travel, "Vacanze & Escursioni"), "viaggio", "vacanza", "tour", "escursione", "traghetto", "agenzia viaggi");

        // Investimenti & Risparmio
        seedKeywords(user, child(savings, "Investimenti & PAC"), "directa", "moneyfarm", "trade republic", "scalable", "degiro", "fineco trading", "pac", "investimento", "etf", "roboadvisor");
        seedKeywords(user, child(savings, "Fondo Emergenza & Risparmio"), "fondo emergenza", "risparmio", "accantonamento");

        // Altro & Imprevisti
        seedKeywords(user, child(otherExpense, "Regali & Donazioni"), "regalo", "regali", "donazione", "onlus", "beneficenza", "croce rossa", "unicef");
        seedKeywords(user, child(otherExpense, "Tasse & Spese Bancarie"), "f24", "agenzia entrate", "pagopa", "pago pa", "inps", "multa", "canone conto", "imposta di bollo", "commissione bancaria");
        seedKeywords(user, child(otherExpense, "Spese Varie"), "spese varie", "pos", "sumup", "paypal", "prelievo contante", "atm prelievo");

        // Lavoro (Income)
        seedKeywords(user, child(work, "Stipendio"), "stipendio", "salary", "retribuzione", "cedolino", "bonifico stipendio");
        seedKeywords(user, child(work, "Tredicesima & Quattordicesima"), "tredicesima", "quattordicesima");
        seedKeywords(user, child(work, "Bonus & Straordinari"), "bonus", "premio produzione", "straordinari", "buoni pasto", "edenred", "welfare");
        seedKeywords(user, child(work, "Lavoro Autonomo & Extra"), "fattura", "parcella", "saldo fattura", "onorario", "prestazione occasionale", "consulenza");

        // Investimenti & Rendite (Income)
        seedKeywords(user, child(investments, "Dividendi & Interessi"), "dividendo", "dividend", "interessi", "interest", "cedola");
        seedKeywords(user, child(investments, "Rendite & Capital Gain"), "capital gain", "vendita titoli", "plusvalenza", "rendita", "affitto attivo");

        // Entrate Extra & Rimborsi (Income)
        seedKeywords(user, child(extraIncome, "Rimborsi & Splitwise"), "splitwise", "rimborso", "satispay", "bancomat pay", "rimborso 730", "rimborso irpef");
        seedKeywords(user, child(extraIncome, "Vendita Usato"), "vinted", "subito", "wallapop", "ebay vendita");
        seedKeywords(user, child(extraIncome, "Regali Ricevuti & Altro"), "regalo ricevuto", "mancia", "mance", "accredito vario");
    }

    private Category seedMacro(String name, TransactionType type, String color, User user) {
        return categoryRepository.findByUserId(user.getId()).stream()
                .filter(c -> c.getParent() == null && c.getType() == type && c.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(createCategoryEntity(name, type, color, user, null)));
    }

    private Category seedSub(Category parent, String name, String color, User user) {
        return categoryRepository.findByUserIdAndParentIdAndName(user.getId(), parent.getId(), name)
                .orElseGet(() -> categoryRepository.save(createCategoryEntity(name, parent.getType(), color, user, parent)));
    }

    private Category child(Category parent, String name) {
        return categoryRepository.findByUserIdAndParentIdAndName(parent.getUser().getId(), parent.getId(), name)
                .orElse(parent);
    }

    private void seedKeywords(User user, Category category, String... keywords) {
        for (String keyword : keywords) {
            String matchKey = category.getType() + ":" + keyword.toLowerCase();
            mappingRepository.findByUserIdAndTypeAndMatchKey(user.getId(), category.getType(), matchKey)
                    .orElseGet(() -> mappingRepository.save(TransactionCategoryMapping.builder()
                            .user(user)
                            .type(category.getType())
                            .matchKey(matchKey)
                            .description(keyword)
                            .category(category)
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
    public void ensurePragmaticDefaults(User user) {
        List<Category> userCategories = categoryRepository.findByUserId(user.getId());
        if (userCategories.isEmpty()) {
            seedDefaultCategories(user);
            return;
        }

        // Check if user has legacy bloated categories (e.g., contains "Bollette luce gas acqua", "Macelleria e pescheria", or > 55 categories)
        boolean hasBloatedCategories = userCategories.size() > 55 ||
                userCategories.stream().anyMatch(c ->
                        c.getName().equalsIgnoreCase("Macelleria e pescheria") ||
                        c.getName().equalsIgnoreCase("Bollette luce gas acqua") ||
                        c.getName().equalsIgnoreCase("Panetteria e pasticceria") ||
                        c.getName().equalsIgnoreCase("Famiglia e animali") ||
                        c.getName().equalsIgnoreCase("Bar e Ristoranti")
                );

        if (hasBloatedCategories) {
            migrateUserToPragmaticDefaults(user);
        }
    }

    @Transactional
    public void migrateUserToPragmaticDefaults(User user) {
        // 1. Clear old keyword mappings for the user (they point to old category entities)
        var oldMappings = mappingRepository.findByUserId(user.getId());
        if (!oldMappings.isEmpty()) {
            mappingRepository.deleteAll(oldMappings);
        }

        // 2. Ensure new pragmatic defaults exist
        seedDefaultCategories(user);

        // 3. Fetch refreshed categories
        List<Category> allUserCats = categoryRepository.findByUserId(user.getId());
        Map<String, Category> catByName = allUserCats.stream()
                .collect(Collectors.toMap(c -> c.getName().toLowerCase(), c -> c, (a, b) -> a));

        Category fallbackExpense = catByName.get("spese varie");
        Category fallbackIncome = catByName.get("regali ricevuti & altro");

        // Set of valid pragmatic category names to retain
        Set<String> validNames = Set.of(
                // Macro Spese
                "casa & utenze", "spesa alimentare", "svago & uscite", "trasporti",
                "shopping & personale", "salute & benessere", "abbonamenti & servizi",
                "viaggi & vacanze", "investimenti & risparmio", "altro & imprevisti",
                // Sub Spese
                "affitto / mutuo", "bollette & utenze", "internet & telefono", "casa & manutenzione",
                "supermercato & alimentari",
                "ristoranti & pizzerie", "bar & aperitivi", "serate & feste", "cinema, concerti & eventi", "sport & hobby",
                "carburante & ricariche", "mezzi pubblici & treni", "auto, moto & manutenzione", "taxi & mobilità condivisa",
                "abbigliamento & accessori", "cura della persona", "elettronica & shopping online",
                "farmacia & medicinali", "visite mediche & dentista",
                "streaming video & musica", "software & servizi digitali",
                "alloggi & hotel", "voli & trasporti vacanze", "vacanze & escursioni",
                "investimenti & pac", "fondo emergenza & risparmio",
                "regali & donazioni", "tasse & spese bancarie", "spese varie",
                // Macro Entrate
                "lavoro", "investimenti & rendite", "entrate extra & rimborsi",
                // Sub Entrate
                "stipendio", "tredicesima & quattordicesima", "bonus & straordinari", "lavoro autonomo & extra",
                "dividendi & interessi", "rendite & capital gain",
                "rimborsi & splitwise", "vendita usato", "regali ricevuti & altro"
        );

        List<Category> obsoleteCats = allUserCats.stream()
                .filter(c -> !validNames.contains(c.getName().toLowerCase()))
                .toList();

        if (!obsoleteCats.isEmpty()) {
            // Remap transactions
            List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(user.getId());
            for (Transaction t : transactions) {
                if (t.getCategory() != null && !validNames.contains(t.getCategory().getName().toLowerCase())) {
                    String targetName = resolveNewCategoryName(t.getCategory().getName());
                    Category replacement = targetName != null ? catByName.get(targetName.toLowerCase()) : null;
                    if (replacement == null) {
                        replacement = t.getType() == TransactionType.INCOME ? fallbackIncome : fallbackExpense;
                    }
                    t.setCategory(replacement);
                    transactionRepository.save(t);
                }
            }

            // Remap budgets
            List<Budget> budgets = budgetRepository.findByUserId(user.getId());
            for (Budget b : budgets) {
                if (b.getCategory() != null && !validNames.contains(b.getCategory().getName().toLowerCase())) {
                    String targetName = resolveNewCategoryName(b.getCategory().getName());
                    Category replacement = targetName != null ? catByName.get(targetName.toLowerCase()) : null;
                    if (replacement == null) {
                        replacement = fallbackExpense;
                    }
                    b.setCategory(replacement);
                    budgetRepository.save(b);
                }
            }

            // Subcategories must be deleted before macro categories
            List<Category> obsoleteSubs = obsoleteCats.stream().filter(c -> c.getParent() != null).toList();
            List<Category> obsoleteMacros = obsoleteCats.stream().filter(c -> c.getParent() == null).toList();

            categoryRepository.deleteAll(obsoleteSubs);
            categoryRepository.deleteAll(obsoleteMacros);
        }
    }

    private String resolveNewCategoryName(String oldName) {
        String lower = oldName.trim().toLowerCase();

        // Spesa & Alimentari
        if (lower.contains("supermercato") || lower.contains("alimentari") || lower.contains("discount") ||
                lower.contains("macelleria") || lower.contains("pescheria") || lower.contains("panetteria") ||
                lower.contains("frutta") || lower.contains("verdura") || lower.contains("bevande") || lower.contains("enoteca") ||
                lower.contains("integratori")) {
            return "Supermercato & Alimentari";
        }

        // Ristoranti
        if (lower.contains("ristorant") || lower.contains("pizzeri") || lower.contains("fast food") ||
                lower.contains("delivery") || lower.contains("asporto") || lower.contains("pranz")) {
            return "Ristoranti & Pizzerie";
        }

        // Bar & Aperitivi
        if (lower.contains("bar") || lower.contains("caffe") || lower.contains("aperitiv") ||
                lower.contains("pub") || lower.contains("gelater")) {
            return "Bar & Aperitivi";
        }

        // Serate & Feste
        if (lower.contains("feste") || lower.contains("serate") || lower.contains("discotec") || lower.contains("club")) {
            return "Serate & Feste";
        }

        // Cinema & Eventi
        if (lower.contains("cinema") || lower.contains("concert") || lower.contains("teatro") || lower.contains("mostr")) {
            return "Cinema, Concerti & Eventi";
        }

        // Sport & Hobby
        if (lower.contains("palestra") || lower.contains("sport") || lower.contains("cors") || lower.contains("piscina") ||
                lower.contains("giochi") || lower.contains("console") || lower.contains("hobby")) {
            return "Sport & Hobby";
        }

        // Casa & Utenze
        if (lower.contains("affitto") || lower.contains("mutuo")) {
            return "Affitto / Mutuo";
        }
        if (lower.contains("bollett") || lower.contains("luce") || lower.contains("gas") || lower.contains("acqua") || lower.contains("rifiuti") || lower.contains("tari")) {
            return "Bollette & Utenze";
        }
        if (lower.contains("internet") || lower.contains("wi-fi") || lower.contains("telefonia") || lower.contains("mobile") || lower.contains("fibra")) {
            return "Internet & Telefono";
        }
        if (lower.contains("casa") || lower.contains("manutenzion") || lower.contains("arredamento") || lower.contains("bricolage") ||
                lower.contains("pulizia") || lower.contains("condomin") || lower.contains("animal") || lower.contains("scuola")) {
            return "Casa & Manutenzione";
        }

        // Trasporti
        if (lower.contains("carburant") || lower.contains("benzina") || lower.contains("diesel") || lower.contains("ricarica")) {
            return "Carburante & Ricariche";
        }
        if (lower.contains("mezzi") || lower.contains("bus") || lower.contains("metro") || lower.contains("tren")) {
            return "Mezzi Pubblici & Treni";
        }
        if (lower.contains("taxi") || lower.contains("sharing") || lower.contains("uber")) {
            return "Taxi & Mobilità Condivisa";
        }
        if (lower.contains("auto") || lower.contains("moto") || lower.contains("pedagg") || lower.contains("parchegg") ||
                lower.contains("tagliando") || lower.contains("meccanico") || lower.contains("bollo") || lower.contains("assicurazion")) {
            return "Auto, Moto & Manutenzione";
        }

        // Shopping & Personale
        if (lower.contains("abbigliamento") || lower.contains("scarpe") || lower.contains("accessori") || lower.contains("borse")) {
            return "Abbigliamento & Accessori";
        }
        if (lower.contains("parrucchier") || lower.contains("barbier") || lower.contains("cosmetica") || lower.contains("profumeria") ||
                lower.contains("estetica") || lower.contains("igiene") || lower.contains("cura persona")) {
            return "Cura della Persona";
        }
        if (lower.contains("elettronica") || lower.contains("informatica") || lower.contains("marketplace") || lower.contains("shopping")) {
            return "Elettronica & Shopping Online";
        }

        // Salute
        if (lower.contains("farmacia") || lower.contains("medicinal") || lower.contains("farmac")) {
            return "Farmacia & Medicinali";
        }
        if (lower.contains("medic") || lower.contains("visite") || lower.contains("dentista") || lower.contains("ottico") ||
                lower.contains("analisi") || lower.contains("fisioterapia") || lower.contains("salute")) {
            return "Visite Mediche & Dentista";
        }

        // Abbonamenti
        if (lower.contains("streaming") || lower.contains("tv") || lower.contains("musica") || lower.contains("audio") || lower.contains("podcast")) {
            return "Streaming Video & Musica";
        }
        if (lower.contains("software") || lower.contains("abbonament") || lower.contains("digital") || lower.contains("istruzion") ||
                lower.contains("universit") || lower.contains("master") || lower.contains("libri") || lower.contains("corsi")) {
            return "Software & Servizi Digitali";
        }

        // Viaggi
        if (lower.contains("hotel") || lower.contains("allogg") || lower.contains("b&b") || lower.contains("airbnb")) {
            return "Alloggi & Hotel";
        }
        if (lower.contains("vol") || lower.contains("aere") || lower.contains("nolegg")) {
            return "Voli & Trasporti Vacanze";
        }
        if (lower.contains("viagg") || lower.contains("vacanz") || lower.contains("tour") || lower.contains("escursion")) {
            return "Vacanze & Escursioni";
        }

        // Investimenti & Risparmio
        if (lower.contains("pac") || lower.contains("investiment") || lower.contains("previdenz") || lower.contains("fondi")) {
            return "Investimenti & PAC";
        }
        if (lower.contains("fondo emergenza") || lower.contains("risparmio")) {
            return "Fondo Emergenza & Risparmio";
        }

        // Regali, Tasse, Altro
        if (lower.contains("regal") || lower.contains("donazion") || lower.contains("beneficenza") || lower.contains("onlus")) {
            return "Regali & Donazioni";
        }
        if (lower.contains("tasse") || lower.contains("multe") || lower.contains("impost") || lower.contains("f24") ||
                lower.contains("commercialista") || lower.contains("bancar") || lower.contains("commission") || lower.contains("canon") || lower.contains("interess")) {
            return "Tasse & Spese Bancarie";
        }

        // ENTRATE
        if (lower.contains("stipendio") || lower.contains("salary") || lower.contains("retribuzion") || lower.contains("cedolino") || lower.contains("stage") || lower.contains("tirocinio")) {
            return "Stipendio";
        }
        if (lower.contains("tredicesima") || lower.contains("quattordicesima")) {
            return "Tredicesima & Quattordicesima";
        }
        if (lower.contains("bonus") || lower.contains("prem") || lower.contains("straordinar") || lower.contains("welfare") || lower.contains("buoni pasto") || lower.contains("trasfert")) {
            return "Bonus & Straordinari";
        }
        if (lower.contains("fattur") || lower.contains("autonom") || lower.contains("client") || lower.contains("prestazion") || lower.contains("consulenz") || lower.contains("freelance")) {
            return "Lavoro Autonomo & Extra";
        }
        if (lower.contains("dividend") || lower.contains("cedol") || lower.contains("interess")) {
            return "Dividendi & Interessi";
        }
        if (lower.contains("capital gain") || lower.contains("rendit") || lower.contains("affitto attiv") || lower.contains("crypto") || lower.contains("plusvalenz")) {
            return "Rendite & Capital Gain";
        }
        if (lower.contains("splitwise") || lower.contains("rimbors") || lower.contains("cashback")) {
            return "Rimborsi & Splitwise";
        }
        if (lower.contains("usat") || lower.contains("vinted") || lower.contains("subito")) {
            return "Vendita Usato";
        }
        if (lower.contains("regal") || lower.contains("manc") || lower.contains("eredit") || lower.contains("straordinari")) {
            return "Regali Ricevuti & Altro";
        }

        return null;
    }

    public List<CategoryDto> getAllCategories(User user) {
        ensurePragmaticDefaults(user);
        return categoryRepository.findByUserId(user.getId())
                .stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<CategoryDto> getCategoriesByType(User user, TransactionType type) {
        ensurePragmaticDefaults(user);
        return categoryRepository.findByUserIdAndType(user.getId(), type)
                .stream()
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

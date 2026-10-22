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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionCategoryMappingRepository mappingRepository;
    private final CategoryMapper categoryMapper;

    public void seedDefaultCategories(User user) {
        // ==========================================
        // SPESE (EXPENSE)
        // ==========================================

        // 1. Alimentari
        Category food = seedMacro("Alimentari", TransactionType.EXPENSE, "#f87171", user);
        seedSub(food, "Supermercato", "#ef4444", user);
        seedSub(food, "Discount", "#dc2626", user);
        seedSub(food, "Macelleria e pescheria", "#b91c1c", user);
        seedSub(food, "Panetteria e pasticceria", "#f43f5e", user);
        seedSub(food, "Frutta e verdura", "#e11d48", user);
        seedSub(food, "Bevande ed enoteca", "#be123c", user);
        seedSub(food, "Farmacia alimentare e integratori", "#fb7185", user);

        // 2. Bar e Ristoranti
        Category restaurants = seedMacro("Bar e Ristoranti", TransactionType.EXPENSE, "#a78bfa", user);
        seedSub(restaurants, "Ristoranti e pizzerie", "#7c3aed", user);
        seedSub(restaurants, "Bar e caffe", "#8b5cf6", user);
        seedSub(restaurants, "Fast food e street food", "#6d28d9", user);
        seedSub(restaurants, "Delivery e asporto", "#5b21b6", user);
        seedSub(restaurants, "Aperitivi e pub", "#4c1d95", user);
        seedSub(restaurants, "Gelaterie e dolci", "#c084fc", user);
        seedSub(restaurants, "Pranzi di lavoro e mensa", "#9333ea", user);

        // 3. Casa & Utenze
        Category home = seedMacro("Casa", TransactionType.EXPENSE, "#facc15", user);
        seedSub(home, "Affitto e mutuo", "#eab308", user);
        seedSub(home, "Bollette luce gas acqua", "#ca8a04", user);
        seedSub(home, "Spese condominiali", "#b45309", user);
        seedSub(home, "Internet e Wi-Fi casa", "#a16207", user);
        seedSub(home, "Telefonia mobile", "#d97706", user);
        seedSub(home, "Manutenzione casa e riparazioni", "#854d0e", user);
        seedSub(home, "Arredamento e bricolage", "#713f12", user);
        seedSub(home, "Pulizia e cura casa", "#f59e0b", user);
        seedSub(home, "Assicurazione casa", "#92400e", user);

        // 4. Trasporti
        Category transport = seedMacro("Trasporti", TransactionType.EXPENSE, "#fb923c", user);
        seedSub(transport, "Carburante", "#f97316", user);
        seedSub(transport, "Ricarica veicoli elettrici", "#ea580c", user);
        seedSub(transport, "Assicurazione auto e moto", "#c2410c", user);
        seedSub(transport, "Bollo e revisione", "#9a3412", user);
        seedSub(transport, "Manutenzione auto e tagliando", "#431407", user);
        seedSub(transport, "Parcheggi e strisce blu", "#ea580c", user);
        seedSub(transport, "Pedaggi e autostrade", "#c2410c", user);
        seedSub(transport, "Mezzi pubblici (Bus Metro)", "#9a3412", user);
        seedSub(transport, "Treni e stazioni", "#c2410c", user);
        seedSub(transport, "Taxi e ride sharing", "#7c2d12", user);
        seedSub(transport, "Micromobilita e car sharing", "#f97316", user);

        // 5. Shopping
        Category shopping = seedMacro("Shopping", TransactionType.EXPENSE, "#818cf8", user);
        seedSub(shopping, "Abbigliamento e scarpe", "#6366f1", user);
        seedSub(shopping, "Accessori e borse", "#4f46e5", user);
        seedSub(shopping, "Elettronica e informatica", "#4338ca", user);
        seedSub(shopping, "Marketplace online", "#3730a3", user);
        seedSub(shopping, "Articoli per la casa", "#312e81", user);
        seedSub(shopping, "Regali per altri", "#4f46e5", user);

        // 6. Cura persona
        Category personalCare = seedMacro("Cura persona", TransactionType.EXPENSE, "#f472b6", user);
        seedSub(personalCare, "Parrucchiere e barbiere", "#ec4899", user);
        seedSub(personalCare, "Cosmetica e profumeria", "#db2777", user);
        seedSub(personalCare, "Estetica e massaggi", "#be185d", user);
        seedSub(personalCare, "Igiene personale", "#9d174d", user);

        // 7. Salute
        Category health = seedMacro("Salute", TransactionType.EXPENSE, "#2dd4bf", user);
        seedSub(health, "Farmacia e medicinali", "#14b8a6", user);
        seedSub(health, "Medici e visite", "#0d9488", user);
        seedSub(health, "Dentista", "#0f766e", user);
        seedSub(health, "Ottico e occhiali", "#115e59", user);
        seedSub(health, "Analisi ed esami", "#134e4a", user);
        seedSub(health, "Fisioterapia", "#14b8a6", user);
        seedSub(health, "Assicurazione sanitaria", "#0d9488", user);

        // 8. Sport e benessere
        Category sport = seedMacro("Sport e benessere", TransactionType.EXPENSE, "#34d399", user);
        seedSub(sport, "Palestra e corsi", "#10b981", user);
        seedSub(sport, "Attrezzatura sportiva", "#059669", user);
        seedSub(sport, "Piscina e sport all'aperto", "#047857", user);

        // 9. Intrattenimento
        Category leisure = seedMacro("Intrattenimento", TransactionType.EXPENSE, "#4ade80", user);
        seedSub(leisure, "Streaming video e TV", "#22c55e", user);
        seedSub(leisure, "Streaming audio e podcast", "#16a34a", user);
        seedSub(leisure, "Cinema concerti e teatro", "#15803d", user);
        seedSub(leisure, "Giochi console e app", "#166534", user);
        seedSub(leisure, "Software e abbonamenti digitali", "#14532d", user);
        seedSub(leisure, "Hobby e collezionismo", "#15803d", user);

        // 10. Viaggi
        Category travel = seedMacro("Viaggi", TransactionType.EXPENSE, "#06b6d4", user);
        seedSub(travel, "Hotel e alloggi", "#0891b2", user);
        seedSub(travel, "Voli aerei", "#0e7490", user);
        seedSub(travel, "Treni vacanze", "#155e75", user);
        seedSub(travel, "Noleggi auto e trasporti", "#164e63", user);
        seedSub(travel, "Attivita e tour vacanza", "#0891b2", user);

        // 11. Famiglia e animali
        Category family = seedMacro("Famiglia e animali", TransactionType.EXPENSE, "#fb7185", user);
        seedSub(family, "Scuola e asilo", "#f43f5e", user);
        seedSub(family, "Materiale scolastico e libri", "#e11d48", user);
        seedSub(family, "Cibo animali (Pet food)", "#be123c", user);
        seedSub(family, "Veterinario e cure animali", "#9f1239", user);
        seedSub(family, "Accessori e toelettatura animali", "#881337", user);

        // 12. Istruzione
        Category education = seedMacro("Istruzione", TransactionType.EXPENSE, "#e879f9", user);
        seedSub(education, "Universita e master", "#d946ef", user);
        seedSub(education, "Libri e manuali", "#c026d3", user);
        seedSub(education, "Corsi online e certificazioni", "#a21caf", user);
        seedSub(education, "Corsi di lingue", "#86198f", user);

        // 13. Tasse e multe
        Category taxes = seedMacro("Tasse e multe", TransactionType.EXPENSE, "#94a3b8", user);
        seedSub(taxes, "Imposte e tasse (IRPEF, F24)", "#64748b", user);
        seedSub(taxes, "Multe e sanzioni", "#475569", user);
        seedSub(taxes, "Commercialista e consulenze fiscali", "#334155", user);
        seedSub(taxes, "Bolli e tributi locali", "#1e293b", user);

        // 14. Risparmio e investimenti
        Category savings = seedMacro("Risparmio e investimenti", TransactionType.EXPENSE, "#111827", user);
        seedSub(savings, "PAC e investimenti", "#374151", user);
        seedSub(savings, "Fondi pensione e previdenza", "#4b5563", user);
        seedSub(savings, "Fondo emergenza", "#6b7280", user);

        // 15. Bonifici e servizi bancari
        Category transfers = seedMacro("Bonifici e servizi bancari", TransactionType.EXPENSE, "#64748b", user);
        seedSub(transfers, "Bonifici inviati", "#475569", user);
        seedSub(transfers, "Prelievi contante", "#334155", user);
        seedSub(transfers, "Commissioni e canoni bancari", "#1e293b", user);
        seedSub(transfers, "Interessi prestiti e mutui", "#0f172a", user);

        // 16. Donazioni
        Category donations = seedMacro("Donazioni", TransactionType.EXPENSE, "#f87171", user);
        seedSub(donations, "Beneficenza e ONLUS", "#ef4444", user);

        // 17. Altro (Spese)
        Category otherExpense = seedMacro("Altro", TransactionType.EXPENSE, "#94a3b8", user);
        seedSub(otherExpense, "Da classificare", "#64748b", user);
        seedSub(otherExpense, "Spese varie", "#475569", user);


        // ==========================================
        // ENTRATE (INCOME)
        // ==========================================

        // 1. Lavoro
        Category work = seedMacro("Lavoro", TransactionType.INCOME, "#10b981", user);
        seedSub(work, "Stipendio", "#059669", user);
        seedSub(work, "Tredicesima e quattordicesima", "#047857", user);
        seedSub(work, "Bonus e premi", "#065f46", user);
        seedSub(work, "Rimborsi lavoro e trasferte", "#064e3b", user);
        seedSub(work, "Buoni pasto e welfare", "#059669", user);
        seedSub(work, "Tirocinio e stage", "#047857", user);
        seedSub(work, "Indennita e sussidi", "#065f46", user);

        // 2. Lavoro autonomo
        Category freelance = seedMacro("Lavoro autonomo", TransactionType.INCOME, "#14b8a6", user);
        seedSub(freelance, "Fatture e clienti", "#0d9488", user);
        seedSub(freelance, "Prestazioni occasionali", "#0f766e", user);
        seedSub(freelance, "Consulenze professionali", "#115e59", user);
        seedSub(freelance, "Royalties e diritti autore", "#134e4a", user);

        // 3. Investimenti
        Category investments = seedMacro("Investimenti", TransactionType.INCOME, "#3b82f6", user);
        seedSub(investments, "Dividendi", "#2563eb", user);
        seedSub(investments, "Interessi e cedole", "#1d4ed8", user);
        seedSub(investments, "Vendite investimenti (Capital gain)", "#1e40af", user);
        seedSub(investments, "Rendite da affitto immobili", "#1e3a8a", user);
        seedSub(investments, "Crypto e staking", "#2563eb", user);

        // 4. Regali e rimborsi
        Category gifts = seedMacro("Regali e rimborsi", TransactionType.INCOME, "#fbbf24", user);
        seedSub(gifts, "Regali e mance", "#f59e0b", user);
        seedSub(gifts, "Vendita oggetti usati", "#d97706", user);
        seedSub(gifts, "Rimborsi amici (Splitwise, cene)", "#b45309", user);
        seedSub(gifts, "Rimborsi fiscali (730, IRPEF)", "#92400e", user);
        seedSub(gifts, "Rimborsi assicurativi", "#f59e0b", user);
        seedSub(gifts, "Cashback e premi fedelta", "#d97706", user);

        // 5. Altro (Entrate)
        Category otherIncome = seedMacro("Altro", TransactionType.INCOME, "#94a3b8", user);
        seedSub(otherIncome, "Entrate straordinarie", "#64748b", user);
        seedSub(otherIncome, "Eredita e donazioni familiari", "#475569", user);
        seedSub(otherIncome, "Entrate varie", "#334155", user);

        // Seed comprehensive merchant mappings
        seedDefaultMappings(user, food, restaurants, home, transport, shopping, personalCare, health, sport, leisure, travel, family, education, taxes, savings, transfers, donations, otherExpense, work, freelance, investments, gifts, otherIncome);
    }

    private void seedDefaultMappings(User user,
                                     Category food, Category restaurants, Category home, Category transport,
                                     Category shopping, Category personalCare, Category health, Category sport,
                                     Category leisure, Category travel, Category family, Category education,
                                     Category taxes, Category savings, Category transfers, Category donations,
                                     Category otherExpense, Category work, Category freelance, Category investments,
                                     Category gifts, Category otherIncome) {

        // Alimentari
        seedKeywords(user, child(food, "Supermercato"), "esselunga", "conad", "coop", "carrefour", "lidl", "eurospin", "aldi", "pam", "iper", "md", "crai", "tigros", "bennet", "il gigante", "despar", "sigma", "unes", "penny market", "mercato");
        seedKeywords(user, child(food, "Discount"), "discount", "d piu", "prix", "tuodi", "in's mercato");
        seedKeywords(user, child(food, "Macelleria e pescheria"), "macelleria", "pescheria", "carni", "ittico", "polleria");
        seedKeywords(user, child(food, "Panetteria e pasticceria"), "panificio", "panetteria", "forno");
        seedKeywords(user, child(food, "Frutta e verdura"), "fruttivendolo", "ortofrutta", "verdura");
        seedKeywords(user, child(food, "Bevande ed enoteca"), "enoteca", "vino", "birra", "tannico", "bernabei");
        seedKeywords(user, child(food, "Farmacia alimentare e integratori"), "prozis", "myprotein", "integratori", "farmacia alimentare");

        // Bar e Ristoranti
        seedKeywords(user, child(restaurants, "Bar e caffe"), "bar", "caffe", "caffetteria", "starbucks", "autogrill", "illy", "nespresso");
        seedKeywords(user, child(restaurants, "Ristoranti e pizzerie"), "ristorante", "trattoria", "osteria", "pizzeria", "sushi", "poke", "ramen", "burger");
        seedKeywords(user, child(restaurants, "Fast food e street food"), "mcdonald", "burger king", "kfc", "old wild west", "five guys");
        seedKeywords(user, child(restaurants, "Delivery e asporto"), "deliveroo", "glovo", "just eat", "ubereats", "uber eats");
        seedKeywords(user, child(restaurants, "Aperitivi e pub"), "pub", "aperitivo", "birreria", "cocktail", "lounge");
        seedKeywords(user, child(restaurants, "Gelaterie e dolci"), "gelateria", "gelato", "grom");

        // Casa & Utenze
        seedKeywords(user, child(home, "Bollette luce gas acqua"), "enel", "eni plenitude", "plenitude", "sorgenia", "edison", "a2a", "hera", "acea", "iren", "servizio elettrico", "nen", "octopus energy", "acquedotto", "tari");
        seedKeywords(user, child(home, "Internet e Wi-Fi casa"), "fastweb", "eolo", "sky wifi", "open fiber", "fibra");
        seedKeywords(user, child(home, "Telefonia mobile"), "iliad", "vodafone", "windtre", "tim", "ho mobile", "kena", "very mobile", "poste mobile", "spusu");
        seedKeywords(user, child(home, "Arredamento e bricolage"), "ikea", "leroy merlin", "mondo convenienza", "brico", "obi", "bricocenter", "maisons du monde");
        seedKeywords(user, child(home, "Manutenzione casa e riparazioni"), "idraulico", "elettricista", "fabbro", "caldaia", "ferramenta");
        seedKeywords(user, child(home, "Pulizia e cura casa"), "detersivi", "lavanderia", "tintoria");

        // Trasporti
        seedKeywords(user, child(transport, "Carburante"), "eni station", "q8", "esso", "ip", "tamoil", "sarroch", "benzina", "carburante", "metano", "gpl");
        seedKeywords(user, child(transport, "Ricarica veicoli elettrici"), "enel x way", "tesla supercharger", "ionity", "be charge", "a2a ricarica");
        seedKeywords(user, child(transport, "Assicurazione auto e moto"), "unipolsai", "genertel", "prima assicurazioni", "allianz", "zurich", "linear", "conte.it", "axa", "quixa");
        seedKeywords(user, child(transport, "Parcheggi e strisce blu"), "easypark", "mycicero", "parcheggio", "parking", "apcoa", "sosta");
        seedKeywords(user, child(transport, "Pedaggi e autostrade"), "autostrade", "telepass", "pedaggio", "unipolmove");
        seedKeywords(user, child(transport, "Mezzi pubblici (Bus Metro)"), "atm", "atac", "bus", "metro", "tpl", "gtt", "anm");
        seedKeywords(user, child(transport, "Treni e stazioni"), "trenitalia", "italo", "trenord");
        seedKeywords(user, child(transport, "Taxi e ride sharing"), "uber", "freenow", "taxi", "it taxi");
        seedKeywords(user, child(transport, "Micromobilita e car sharing"), "enjoy", "share now", "lime", "dott", "tier", "cooltra");
        seedKeywords(user, child(transport, "Manutenzione auto e tagliando"), "meccanico", "gommista", "revisione", "autofficina", "norauto", "midas", "carglass");

        // Shopping
        seedKeywords(user, child(shopping, "Abbigliamento e scarpe"), "zara", "hm", "h m", "ovs", "nike", "adidas", "decathlon", "pull bear", "bershka", "primark", "zalando", "intimissimi", "calzedonia", "tezenis", "uniqlo", "mango", "stradivarius", "foot locker", "cisalfa", "snipes");
        seedKeywords(user, child(shopping, "Elettronica e informatica"), "mediaworld", "unieuro", "apple", "eprice", "euronics", "gamestop", "trony", "expert");
        seedKeywords(user, child(shopping, "Marketplace online"), "amazon", "ebay", "aliexpress", "temu", "vinted", "subito", "etsy", "shein", "wallapop");

        // Cura persona
        seedKeywords(user, child(personalCare, "Cosmetica e profumeria"), "sephora", "douglas", "acqua sapone", "tigota", "profumeria", "kiko", "pinalli");
        seedKeywords(user, child(personalCare, "Parrucchiere e barbiere"), "parrucchiere", "barbiere", "barber", "hair", "hairstylist");

        // Salute
        seedKeywords(user, child(health, "Farmacia e medicinali"), "farmacia", "lafarmacia", "dr max", "lloyds", "redcare", "efarma", "docpeter");
        seedKeywords(user, child(health, "Medici e visite"), "studio medico", "visita medica", "synlab", "cerba", "santagostino", "ospedale", "poliambulatorio");
        seedKeywords(user, child(health, "Dentista"), "dentista", "dentalpro", "vitaldent", "studio dentistico");
        seedKeywords(user, child(health, "Ottico e occhiali"), "ottica", "grandvision", "salmoiraghi", "nau", "occhiali");

        // Sport e benessere
        seedKeywords(user, child(sport, "Palestra e corsi"), "palestra", "fitactive", "mcfit", "virgin active", "anytime fitness", "yoga", "crossfit", "padel", "tennis");
        seedKeywords(user, child(sport, "Piscina e sport all'aperto"), "piscina", "nuoto", "sci");

        // Intrattenimento
        seedKeywords(user, child(leisure, "Streaming video e TV"), "netflix", "disney", "prime video", "dazn", "now tv", "youtube premium", "apple tv", "crunchyroll", "paramount");
        seedKeywords(user, child(leisure, "Streaming audio e podcast"), "spotify", "apple music", "tidal", "deezer", "audible");
        seedKeywords(user, child(leisure, "Giochi console e app"), "steam", "playstation", "xbox", "nintendo", "epic games", "riot games", "blizzard", "gamsgo", "google play", "app store");
        seedKeywords(user, child(leisure, "Cinema concerti e teatro"), "cinema", "ticketone", "eventim", "teatro", "concerto");
        seedKeywords(user, child(leisure, "Software e abbonamenti digitali"), "chatgpt", "openai", "icloud", "google one", "microsoft 365", "github", "canva", "notion", "adobe", "dropbox");

        // Viaggi
        seedKeywords(user, child(travel, "Hotel e alloggi"), "booking", "airbnb", "hotel", "b b", "bed breakfast", "hostel");
        seedKeywords(user, child(travel, "Voli aerei"), "ryanair", "easyjet", "wizz", "ita airways", "lufthansa", "vueling");
        seedKeywords(user, child(travel, "Noleggi auto e trasporti"), "hertz", "avis", "sixt", "rentalcars", "noleggio");

        // Famiglia e animali
        seedKeywords(user, child(family, "Cibo animali (Pet food)"), "arcaplanet", "isola dei tesori", "zooplus", "pet food");
        seedKeywords(user, child(family, "Veterinario e cure animali"), "veterinario", "clinica veterinaria");

        // Istruzione
        seedKeywords(user, child(education, "Universita e master"), "universita", "politecnico", "unimi", "uni", "tasse universitarie");
        seedKeywords(user, child(education, "Libri e manuali"), "libreria", "feltrinelli", "mondadori", "ibs");
        seedKeywords(user, child(education, "Corsi online e certificazioni"), "udemy", "coursera", "edx", "corso");

        // Tasse e multe
        seedKeywords(user, child(taxes, "Imposte e tasse (IRPEF, F24)"), "agenzia entrate", "f24", "pago pa", "pagopa", "inps");
        seedKeywords(user, child(taxes, "Multe e sanzioni"), "polizia locale", "multa", "contravvenzione", "prefettura");

        // Risparmio e investimenti
        seedKeywords(user, child(savings, "PAC e investimenti"), "directa", "fineco trading", "degiro", "trade republic", "scalable", "moneyfarm", "pac", "investimento");
        seedKeywords(user, child(savings, "Fondo emergenza"), "fondo emergenza", "risparmio", "accantonamento");

        // Bonifici e servizi bancari
        seedKeywords(user, child(transfers, "Bonifici inviati"), "bonifico", "giroconto", "trasferimento fondi");
        seedKeywords(user, child(transfers, "Prelievi contante"), "prelievo", "atm prelievo", "bancomat");
        seedKeywords(user, child(transfers, "Commissioni e canoni bancari"), "commissione", "canone", "imposta di bollo", "spese bancarie");

        // Donazioni
        seedKeywords(user, child(donations, "Beneficenza e ONLUS"), "donazione", "onlus", "croce rossa", "unicef", "telethon", "airc");

        // Lavoro (Income)
        seedKeywords(user, child(work, "Stipendio"), "stipendio", "salary", "retribuzione", "cedolino", "bonifico stipendio");
        seedKeywords(user, child(work, "Tirocinio e stage"), "tirocinio", "stage");
        seedKeywords(user, child(work, "Bonus e premi"), "bonus", "premio produzione");
        seedKeywords(user, child(work, "Rimborsi lavoro e trasferte"), "rimborso spese", "trasferta");
        seedKeywords(user, child(work, "Buoni pasto e welfare"), "buoni pasto", "edenred", "welfare");

        // Lavoro autonomo (Income)
        seedKeywords(user, child(freelance, "Fatture e clienti"), "parcella", "saldo fattura", "onorario");

        // Investimenti (Income)
        seedKeywords(user, child(investments, "Dividendi"), "dividendo", "dividend");
        seedKeywords(user, child(investments, "Interessi e cedole"), "interessi", "interest", "cedola");
        seedKeywords(user, child(investments, "Vendite investimenti (Capital gain)"), "vendita titoli", "capital gain");

        // Regali e rimborsi (Income)
        seedKeywords(user, child(gifts, "Regali e mance"), "regalo", "gift");
        seedKeywords(user, child(gifts, "Vendita oggetti usati"), "vinted rimborso", "subito accredito", "wallapop accredito");
        seedKeywords(user, child(gifts, "Rimborsi amici (Splitwise, cene)"), "rimborso", "splitwise", "satispay", "bancomat pay");
        seedKeywords(user, child(gifts, "Rimborsi fiscali (730, IRPEF)"), "rimborso irpef", "rimborso 730", "credito imposta");

        // Altro
        seedKeywords(user, child(otherIncome, "Entrate varie"), "accredito", "entrata varia");
        seedKeywords(user, child(otherExpense, "Da classificare"), "paypal", "sumup", "pos", "stripe");
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

    public List<CategoryDto> getAllCategories(User user) {
        if (categoryRepository.findByUserId(user.getId()).isEmpty()) {
            seedDefaultCategories(user);
        }
        return categoryRepository.findByUserId(user.getId())
                .stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<CategoryDto> getCategoriesByType(User user, TransactionType type) {
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

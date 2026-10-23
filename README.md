# Sossoldi

Un'applicazione web completa per la gestione delle finanze personali, con tracciamento di entrate e uscite, gestione patrimonio e investimenti (PAC/Roboadvisor), budget dinamici basati sul profilo finanziario e report analitici con AI Financial Coach.

## Panoramica

**Sossoldi** è una piattaforma moderna per la gestione del patrimonio e del risparmio personale. L'applicazione permette agli utenti di monitorare i propri conti e flussi di cassa, categorizzare automaticamente le transazioni, impostare budget mensili allineati al proprio profilo finanziario e visualizzare l'andamento patrimoniale tramite grafici interattivi.

Include un sistema di **seeding automatico** delle categorie standard in italiano, integrazione con **Google Gemini AI** (con anonimizzazione degli importi per i consigli finanziari) e autenticazione **Google OAuth 2.0**.

## Stack Tecnologico

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Linguaggio**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Grafici**: Recharts

### Backend
- **Framework**: Spring Boot 3.2.4
- **Linguaggio**: Java 21
- **Sicurezza**: Spring Security 6 + Google OAuth 2.0 + Cookie JWT HttpOnly
- **ORM**: Spring Data JPA / Hibernate
- **AI Integration**: Google Gemini API (categorizzazione merchant e AI Financial Coach privacy-first)

### Database & Infrastruttura
- **H2 Database (file mode)**: Database locale predefinito (`./data/sossoldi.mv.db`), zero configurazione.
- **PostgreSQL 16**: Supportato tramite profilo `postgres` e `docker-compose.yml`.
- **Docker & Nginx**: Containerizzazione multi-stage pronta per il deploy.

## Design Patterns

- **Strategy Pattern (`service/report`)**: Utilizzato per la generazione dei report finanziari. `ReportContext` seleziona dinamicamente tra `MonthlyReportStrategy`, `YearlyReportStrategy` e `CategoryReportStrategy`.
- **Builder Pattern**: Utilizzato nei DTO e nelle entità di dominio per costruire risposte aggregate (es. `DashboardOverviewDto`, `AdvancedAnalyticsDto`).

## Funzionalità Principali

- **Accesso tramite Google OAuth 2.0**: Login rapido con sincronizzazione automatica di nome e foto profilo.
- **Patrimonio & Conti**: Gestione conti correnti, carte, contanti e conti deposito con giroconti immediati e riordino drag-and-drop.
- **Investimenti & PAC**: Monitoraggio di Roboadvisor, ETF, azioni, obbligazioni e fondi pensione con storico rilevazioni (annuale/mensile) ed esecuzione rate PAC collegate ai conti.
- **Profili Finanziari & Budget**: 6 profili finanziari (`Studente`, `Standard 50/30/20`, `Freelance`, `FIRE Seeker`, `Famiglia`, `Ripartenza & Debiti`) con ricalcolo automatico delle percentuali di budget.
- **Importazione Excel/CSV & Categorizzazione AI**: Pulizia automatica delle descrizioni bancarie e mappatura intelligente degli esercenti tramite Gemini AI.
- **Analisi Avanzata & AI Coach Privacy-First**: KPI patrimoniali (Emergency Runway, Burn Rate, allocazione Needs/Wants/Savings) e consigli AI basati esclusivamente su percentuali e indicatori relativi, senza inviare saldi o cifre assolute in euro.

## Installazione e Avvio Rapido

### Modalità 1: Avvio Immediato su PC (Consigliato per uso personale)
Non richiede Docker né PostgreSQL. I dati vengono salvati localmente nella cartella `./data/` e i log in `./data/sossoldi.log`.

- **Avvio silenzioso in background**: Fai doppio clic su `avvia.bat` (oppure esegui `.\scripts\avvia.ps1` per l'avvio interattivo).
- **Icona System Tray**: Una volta avviato, Sossoldi mostra un'icona nella barra di sistema di Windows (vicino all'orologio) con doppio clic per aprire **http://localhost:10000** e menu contestuale rapido (*Apri Sossoldi*, *Console Database H2*, *Ferma Sossoldi*).
- **Avvio automatico all'accensione di Windows**: Esegui `scripts\installa-avvio-automatico.bat` (registra l'attività con avvio ritardato di 10s e auto-restart). Per rimuoverlo: `scripts\rimuovi-avvio-automatico.bat`.
- **App Desktop (PWA)**: Da Chrome o Edge su `http://localhost:10000`, clicca su **Installa Sossoldi** nella barra degli indirizzi per usarla come finestra desktop dedicata.
- Per arrestare il servizio manualmente: `scripts\ferma.bat` (oppure *Ferma Sossoldi* dall'icona nella System Tray).

---

### Modalità 2: Sviluppo Locale (Live Reload)
- Fai doppio clic su `scripts\avvia-dev.bat`, oppure da terminale:
  ```bash
  # Backend (Spring Boot su http://localhost:10000)
  cd backend
  .\mvnw.cmd spring-boot:run

  # Frontend (Vite con HMR su http://localhost:5173)
  cd frontend
  npm install
  npm run dev
  ```

---

### Modalità 3: Container Docker (con PostgreSQL)
```bash
docker-compose up --build
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:10000

---

## Struttura del Progetto

```text
Sossoldi/
├── backend/                        # Server Spring Boot (Java 21)
│   ├── src/main/java/com/financeapp/
│   │   ├── config/                 # Configurazioni (Security, Async, ApplicationConfig)
│   │   ├── controller/             # Endpoint REST API (/api/v1/*)
│   │   ├── dto/                    # Data Transfer Objects
│   │   ├── exception/              # Gestione centralizzata errori (GlobalExceptionHandler)
│   │   ├── mapper/                 # Componenti Spring di mapping Model <-> DTO
│   │   ├── model/                  # Entità JPA ed Enum di dominio
│   │   ├── repository/             # Interfacce Spring Data JPA
│   │   ├── security/               # Filtri JWT, Cookie HttpOnly e OAuth2SuccessHandler
│   │   ├── service/                # Logica di Business
│   │   │   └── report/             # Strategy Pattern per i report (Monthly, Yearly, Category)
│   │   └── FinanceTrackerApplication.java
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                       # Client React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── components/             # Componenti organizzati per dominio
│   │   │   ├── budgets/            # BudgetList, BudgetForm
│   │   │   ├── categories/         # CategoryList, CategoryForm
│   │   │   ├── dashboard/          # Grafici e widget della Dashboard
│   │   │   ├── investments/        # InvestmentForm, InvestmentReportModal
│   │   │   ├── layout/             # Layout principale e Sidebar
│   │   │   ├── transactions/       # TransactionList, TransactionForm
│   │   │   ├── transfers/          # Modale condivisa TransferFormModal
│   │   │   └── ui/                 # Componenti UI base (StatCard, ProgressBar)
│   │   ├── constants/              # Metadati conti, investimenti e costanti calendario
│   │   ├── hooks/                  # Custom React Hooks (useDashboard, useTransactions, ecc.)
│   │   ├── pages/                  # Pagine dell'applicazione
│   │   ├── services/               # Client Axios e servizi API
│   │   ├── store/                  # Stato autenticazione (Zustand)
│   │   ├── types/                  # Interfacce e tipi TypeScript
│   │   ├── utils/                  # Formattatori, import Excel e gestione errori
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── scripts/                        # Script di avvio e arresto (avvia.ps1, avvia-dev.bat, ferma.bat)
├── avvia.bat                       # Avvio rapido in background
├── build.bat                       # Build completo Frontend + Backend JAR
├── docker-compose.yml              # Orchestrazione Docker (PostgreSQL + Backend + Frontend)
└── README.md
```

## Testing & Qualità del Codice

```bash
# Test unitari e di integrazione Backend
cd backend
.\mvnw.cmd test

# Linting e Build Frontend
cd frontend
npm run lint
npm run build
```

## Licenza

Questo progetto è distribuito sotto licenza MIT.

## Autore

**Matteo Fagnani** - [GitHub Profile](https://github.com/MatteoFagnani)

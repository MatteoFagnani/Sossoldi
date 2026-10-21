# Sossoldi

Un'applicazione web completa per la gestione delle finanze personali, con tracciamento di entrate e uscite, gestione budget e report dettagliati.

## Panoramica

FinanceTracker è una piattaforma moderna per la gestione del risparmio personale. L'applicazione permette agli utenti di monitorare i propri flussi di cassa, categorizzare le transazioni, impostare budget mensili e visualizzare l'andamento finanziario tramite grafici interattivi. 

Include un sistema di **seeding automatico** delle categorie standard e offre una completa **gestione del profilo utente** per garantire sicurezza e privacy. È progettata per essere robusta, sicura e pronta per l'uso in produzione.

## Architettura

L'applicazione segue un'architettura client-server moderna, garantendo separazione delle responsabilità e manutenibilità:

### Frontend
- **Web App**: Applicazione Single Page sviluppata con React 18 e Vite.
  - UI moderna e reattiva con Tailwind CSS.
  - Grafici dinamici realizzati con Recharts.
  - TypeScript per una gestione sicura dei tipi.

### Backend
- **Core Service**: API RESTful sviluppata con Spring Boot 3.
  - Sicurezza gestita con Spring Security e JWT.
  - Persistenza dati tramite Spring Data JPA e Hibernate.
  - Mapping degli oggetti con MapStruct per un'architettura pulita.

## Stack Tecnologico

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts

### Backend
- **Framework**: Spring Boot 3.4
- **Language**: Java 21
- **Security**: Spring Security + JWT
- **ORM**: Hibernate
- **Database Mapping**: MapStruct

### Database & Storage
- **PostgreSQL 16**: Database relazionale per la persistenza dei dati.
- **Docker**: Containerizzazione dei servizi per una distribuzione facilitata.

## Design Patterns

L'applicazione implementa diversi pattern architetturali per garantire flessibilità e manutenibilità:

- **Strategy Pattern**: Utilizzato per la generazione dei report finanziari. `ReportContext` seleziona dinamicamente tra `MonthlyReportStrategy` (flusso di cassa giornaliero) e `CategoryReportStrategy` (suddivisione spese per categoria), facilitando l'aggiunta di nuovi tipi di report.
- **State Pattern**: Gestisce lo stato del budget (`OkState`, `WarningState`, `ExceededState`). Ogni stato incapsula la propria logica di visualizzazione (badge, colori) e comportamento, seguendo il principio di singola responsabilità.
- **Builder Pattern**: Utilizzato in `DashboardOverviewDto` per costruire risposte complesse in modo leggibile e fluido, aggregando KPI, transazioni recenti e dati per i grafici.

## Funzionalità Principali

### Per gli Utenti
- **Accesso e Registrazione Esclusivi con Google**: Login rapido a 1 clic tramite Google Sign-In, senza password da ricordare.
- Tracciamento di entrate e spese in tempo reale
- Gestione categorie personalizzate e **seeding automatico in Italiano**
- **Sezione Profilo**: Gestione username, email e stato autenticazione Google
- Dashboard riepilogativa con grafici interattivi e report mensili
- Monitoraggio del budget con avvisi automatici
- **Eliminazione Account**: Possibilità di rimuovere permanentemente l'utente e i dati associati

## Installazione e Avvio Rapido

### Modalità 1: Avvio Immediato su PC (Consigliato per uso personale) 🚀
Non richiede l'installazione o l'esecuzione di Docker o PostgreSQL. I dati vengono salvati localmente in modo sicuro nella cartella `./data/`.

- **Doppio clic su `avvia.bat`** (oppure esegui `.\scripts\avvia.ps1` in PowerShell).
- Lo script verifica i requisiti, compila se necessario e apre automaticamente il browser all'indirizzo:
  👉 **http://localhost:10000**
- Per arrestare l'applicazione, chiudi la finestra del terminale oppure fai doppio clic su `scripts\ferma.bat`.

---

### Modalità 2: Sviluppo Locale (Live Reload)
Se vuoi modificare il codice in tempo reale con Hot Module Replacement:
- Fai doppio clic su `avvia-dev.bat`.
- Oppure manualmente da terminale:
  ```bash
  # Backend (Spring Boot con DB locale)
  cd backend
  .\mvnw.cmd spring-boot:run

  # Frontend (Vite con HMR su http://localhost:5173)
  cd frontend
  npm install
  npm run dev
  ```

---

### Modalità 3: Container Docker (con PostgreSQL)
Se preferisci utilizzare PostgreSQL tramite container Docker:
```bash
docker-compose up --build
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:10000

---

## Database e Persistenza

- **Database Locale Predefinito**: H2 Database in modalità file (`./data/sossoldi.mv.db`). Zero configurazione, zero processi in background, consumo di memoria minimo e backup immediato copiando la cartella `data`.
- **H2 Web Console**: Accessibile all'indirizzo `http://localhost:10000/h2-console` (JDBC URL: `jdbc:h2:file:./data/sossoldi`, User: `sa`, Password: vuota).
- **PostgreSQL**: Attivabile impostando il profilo `SPRING_PROFILES_ACTIVE=postgres` o tramite `docker-compose.yml`.

---

## Autenticazione con Google

L'accesso e la registrazione all'applicazione avvengono esclusivamente tramite **Google**:
- **Pulsante ufficiale Google Identity Services (GIS)**: supporta popup standard e One-Tap di Google.
- **Configurazione (Opzionale)**: Per collegare il popup ufficiale di Google Cloud Console, genera un OAuth 2.0 Client ID (tipo Web Application con origine autorizzata `http://localhost:10000`) e inseriscilo in `.env`:
  ```env
  GOOGLE_CLIENT_ID=tuo-client-id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=tuo-client-secret
  ```
- **Modalità Personale / Locale Immediata**: Se il Client ID non è ancora impostato, puoi comunque accedere con 1 clic con il tuo indirizzo email personale. I dati rimangono salvati sul tuo computer.

## Struttura del Progetto

```text
FinanceTracker/
├── backend/                        # Server Spring Boot
│   ├── src/main/java/              # Codice sorgente Java
│   │   └── com/financeapp/
│   │       ├── config/             # Configurazioni (Security, CORS, etc.)
│   │       ├── controller/         # Endpoint REST API
│   │       ├── dto/                # Data Transfer Objects
│   │       ├── exception/          # Gestione errori personalizzata
│   │       ├── mapper/             # Mapping Model <-> DTO (MapStruct)
│   │       ├── model/              # Entità del Database (JPA)
│   │       ├── repository/         # Interfacce per il Database (Spring Data JPA)
│   │       ├── security/           # Logica JWT e Filtri di Sicurezza
│   │       ├── service/            # Logica di Business
│   │       └── FinanceTrackerApplication.java
│   ├── Dockerfile                  # Configurazione Docker backend
│   └── pom.xml                     # Gestione dipendenze e build Maven
├── frontend/                       # Client React + Vite
│   ├── src/                        # Codice sorgente React
│   │   ├── assets/                 # Immagini, font, file statici
│   │   ├── components/             # UI Components riutilizzabili
│   │   ├── context/                # Context API per lo stato globale
│   │   ├── hooks/                  # Custom React Hooks
│   │   ├── pages/                  # Viste principali (Dashboard, Login, etc.)
│   │   ├── services/               # Chiamate API (Axios)
│   │   ├── store/                  # Gestione stato (se presente/Zustand/Redux)
│   │   ├── styles/                 # File CSS/Tailwind aggiuntivi
│   │   ├── types/                  # Definizioni TypeScript
│   │   └── utils/                  # Funzioni di utilità
│   │   ├── App.tsx                 # Componente radice
│   │   └── main.tsx                # Punto di ingresso React
│   ├── public/                     # Asset pubblici (index.html, icone)
│   ├── Dockerfile                  # Configurazione Docker frontend
│   └── package.json                # Dipendenze e script Node.js
├── docker-compose.yml              # Orchestrazione container Docker
├── README.md                       # Questa documentazione
```


## Sicurezza

- Autenticazione basata su JSON Web Token (JWT)
- Role-based access control (RBAC) con Spring Security
- Password hashing sicuro (BCrypt) e **cambio password con verifica vecchia password**
- **Protezione Anti Brute Force**: blocco temporaneo dell'account (15 minuti) dopo 5 tentativi di login falliti consecutivi.
- **Miglioramento UX/Sicurezza**: pulizia automatica del campo password nel frontend a ogni tentativo di accesso errato.
- **Cancellazione sicura dell'account** con eliminazione a cascata di tutti i dati associati
- Gestione sicura delle sessioni stateless

## Testing

I test coprono le parti critiche del sistema:
```bash
cd backend
mvn test
```
**Aree coperte:**
- `JwtServiceTest`: Generazione e validazione dei token.
- `BudgetStateTest`: Transizioni di stato del budget.
- `ReportStrategyTest`: Logica di aggregazione dei report.

## Licenza

Questo progetto è sotto licenza MIT.

## Autore

**Matteo Fagnani** - [GitHub Profile](https://github.com/MatteoFagnani)

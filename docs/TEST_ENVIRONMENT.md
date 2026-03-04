# Ambiente di Test Automatico — Settimanale

> Documento di riferimento per la configurazione e le scelte architetturali del testing automatico.
> Le domande aperte sono contrassegnate con **[DA DECIDERE]**.

---

## 1. Decisioni confermate

### 1.1 Autoloader interno

Creato `lib/autoloader.php` che:
- Carica le variabili d'ambiente da `.env`
- Definisce le costanti globali (`ENV_DB_HOST`, `ENV_DB_DATABABE`, `ENV_DB_PORT`, `ENV_DB_USER`, `ENV_DB_PASSWORD`, `ENV_IS_DEV`)
- Include tutte le classi del progetto in ordine di dipendenza

Ogni file PHP del progetto contiene una sola riga di inclusione:
```php
require_once __DIR__ . '/../../../lib/autoloader.php';
```

Nessuna dipendenza da Composer o autoloader esterni.

### 1.2 Database di test

Si usa il container PostgreSQL esistente nella network Docker `fa-universe`.
Il DB è una copia di produzione, usato sia per sviluppo che per test.

- Le tabelle esistono già — nessuna alterazione dello schema
- I dati di test vengono creati dai test e rimossi puntualmente alla fine (no TRUNCATE)
- Le tabelle lookup (`param_import_status`, `import_record`) sono già popolate
- Le tabelle autocomplete (`company`, `contract`, `fund`) sono già popolate

```yaml
networks:
  fa-universe:
    name: fa-universe
    external: true
```

Credenziali nel file `.env` alla root del progetto.

### 1.3 Framework test backend

**PHPUnit 9.x** — unico compatibile con PHP 7.4. Installato tramite download diretto del PHAR (niente Composer).

### 1.4 AjaxResponseHelper

Creata la classe `AjaxResponseHelper` (value object, SRP):
- Factory statici: `::success($data)`, `::error($message, $exception, $httpCode)`
- `__toString()` → solo serializzazione JSON (nessun side-effect HTTP)
- `toArray()` → array della risposta (per asserzioni nei test)
- `getHttpCode()` → codice HTTP (impostato dallo script chiamante)

Gli script Ajax gestiscono le responsabilita HTTP:
```php
http_response_code($response->getHttpCode());
echo $response;
exit;
```

### 1.5 Struttura file frontend

Il frontend resta in un unico file monolitico `app.js` (~1200 righe).

### 1.6 Frontend — Strategia di test

**Playwright E2E + Vitest unit test** (opzione B):
- Playwright per test end-to-end nel browser (tutti i flussi)
- Vitest per unit test delle funzioni pure estratte da `app.js`
- Richiede: `package.json`, estrazione funzioni pure con `module.exports` condizionale

### 1.7 Docker — Immagine di test

**Un solo container** (opzione A):
- Immagine basata su PHP 7.4 con Node.js aggiunto
- Esegue sia test PHP (PHPUnit) che test frontend (Vitest + Playwright)

### 1.8 Server PHP per test E2E

**Nginx + PHP-FPM** (opzione C) dentro il container di test.

### 1.9 CI/CD

**Solo locale**: `docker compose -f docker-compose.test.yml run tests`. Nessun CI per ora.

### 1.10 Scope test E2E — Tutti i flussi

- [x] CRUD testata (crea, modifica filename, verifica propagazione, cancella)
- [x] CRUD record per tipo rappresentativo (ASV, EMP, PSR)
- [x] Duplicazione record
- [x] Cancellazione record con verifica ricalcolo row_id e rows_imported
- [x] Autocomplete (company, policy_number, fund_code con auto-fill description + fund_type)
- [x] Validazioni warning per ciascun tipo form
- [x] Paginazione (cambia page size, naviga pagine)
- [x] Filtro (digita testo, verifica filtraggio)
- [x] Sort 3 stati su colonne diverse
- [x] Gestione errori (simulare errore backend, verificare DEV vs PROD)
- [x] Condizioni cancellazione testata (cestino appare/scompare)

---

## 2. Architettura di test

### 2.1 Backend — Test di integrazione con DB reale

I test PHP sfruttano l'istanza di PostgreSQL esistente nella network `fa-universe`.
Le query usano feature specifiche PostgreSQL (`ILIKE`, `ROW_NUMBER() OVER`, `RETURNING`, `::text`).

**Strategia dati di test:**
- Ogni test class crea i dati necessari nel `setUp()`
- Ogni test class rimuove puntualmente i dati creati nel `tearDown()` (DELETE con ID specifici)
- Le tabelle lookup e autocomplete vengono usate direttamente (dati gia presenti)

**Struttura prevista:**

```
tests/
├── bootstrap.php              — Carica autoloader
├── backend/
│   ├── ImportTrackingTest.php      — CRUD testate (HeaderManager), toggleStatus
│   ├── ImportDataFlatTest.php     — CRUD record (RecordManager), calcoli EUR, auto-copy, row_id, update
│   ├── ImportAutocompleteTest.php — Ricerca company/policy/fund incl. fund_type (FormHelper)
│   ├── ImportConfigTest.php       — Lettura config (BaseConfig::get())
│   ├── AjaxResponseHelperTest.php — Serializzazione risposte
│   └── AjaxHttpTest.php          — Test HTTP end-to-end handler Ajax
├── frontend/
│   ├── vitest.config.js
│   └── utils.test.js           — Unit test funzioni pure
├── e2e/
│   ├── playwright.config.js
│   └── *.spec.js               — Test E2E (tutti i flussi)
├── docker-compose.test.yml
├── Dockerfile.test
├── nginx.conf
├── phpunit.xml
└── package.json
```

### 2.2 Frontend — Unit test (Vitest)

Funzioni pure da estrarre e testare:
- Calcolo EUR (`valore_cur * exchange_rate`)
- Generazione colori HSL (cold/warm/green shades)
- Filtro client-side
- Sort comparator (tri-state)
- Validazione warning per tipo form

Estrazione tramite `module.exports` condizionale in fondo a `app.js`:
```js
if (typeof module !== 'undefined') {
    module.exports = { calculateEur, generateColdShade, ... };
}
```

### 2.3 Frontend — Test E2E (Playwright)

Playwright gira nel container di test, punta a Nginx+PHP-FPM locale.
Copre tutti gli 11 flussi elencati in §1.10.

---

## 3. Domande aperte

### 3.4 Handler Ajax — Strategia di test [DA DECIDERE]

Gli handler Ajax sono script procedurali con `exit`. Serve decidere come testarli.

**Contesto:** Playwright E2E coprirà già tutti i flussi (§1.10), quindi gli handler sono testati indirettamente. La domanda è se servano anche test PHP dedicati per la logica di routing/validazione degli handler.

**Opzioni:**
- **A) Refactoring in AjaxController:** Estrarre la logica switch/case in una classe con metodi che restituiscono `AjaxResponseHelper`. I file Ajax diventano thin wrapper. I test PHPUnit chiamano i metodi della classe direttamente — veloci, senza server HTTP. Richiede modifiche al codice.
- **B) Test HTTP end-to-end in PHPUnit:** Avviare Nginx+PHP-FPM (già presente nel container), fare chiamate HTTP con `file_get_contents`/`curl` dai test PHPUnit. Nessuna modifica al codice ma test più lenti e dipendenti dal server.
- **C) Solo test E2E con Playwright:** Gli handler sono testati indirettamente dai test E2E. Nessun test PHP dedicato per gli handler. Approccio più semplice ma meno granulare — se un test E2E fallisce, è più difficile capire se il problema è nel frontend o nel backend.

**Nota:** L'opzione A è la più coerente con SOLID (separa la logica di business dal trasporto HTTP) e produce test più veloci e mirati. L'opzione C è sufficiente dato lo scope completo dei test Playwright, ma offre meno isolamento nel debugging.

**Risposta:**
B
---

### 3.5 `prepareFields()` — Accesso per test [DA DECIDERE]

Il metodo `RecordManager::prepareFields()` contiene la logica di calcolo EUR e auto-copy. È `private`.

**Contesto:** Questa logica è critica (formula valuta, auto-copy per tipo form). I test di integrazione di `RecordManager::create()`/`update()` la esercitano indirettamente verificando i valori risultanti nel DB.

**Opzioni:**
- **A) Test indiretto (raccomandato):** Testare via `create()`/`update()` verificando i valori calcolati nel record risultante dal DB. Nessuna modifica al codice. Copre il caso reale end-to-end.
- **B) Rendere `protected`:** La classe di test estende `RecordManager` e chiama `prepareFields()` direttamente. Modifica minima, test più rapidi e isolati.
- **C) Estrarre in classe utility:** `FieldCalculator::prepare(...)` — funzione pura, testabile, ma aggiunge un file e modifica l'architettura.

**Risposta:**
A
---

## 4. File da creare

| File                                           | Scopo | Stato |
|------------------------------------------------|-------|-------|
| `.env`                                         | Credenziali DB | Creato |
| `lib/autoloader.php`                           | Include centralizzato | Creato |
| `src/model/Settimanale/AjaxResponseHelper.php` | Value object risposta Ajax | Creato |
| `tests/docker-compose.test.yml`                | Orchestrazione container di test | Da creare |
| `tests/Dockerfile.test`                        | Immagine PHP 7.4 + Node.js + Nginx + PHP-FPM | Da creare |
| `tests/nginx.conf`                             | Configurazione Nginx per test E2E | Da creare |
| `tests/phpunit.xml`                            | Configurazione PHPUnit | Da creare |
| `tests/bootstrap.php`                          | Bootstrap per i test | Da creare |
| `tests/backend/*.php`                          | Test PHPUnit (5 file) | Da creare |
| `tests/package.json`                           | Dipendenze Node.js (Playwright + Vitest) | Da creare |
| `tests/frontend/vitest.config.js`              | Configurazione Vitest | Da creare |
| `tests/frontend/utils.test.js`                 | Unit test funzioni pure JS | Da creare |
| `tests/e2e/playwright.config.js`               | Configurazione Playwright | Da creare |
| `tests/e2e/*.spec.js`                          | Test E2E (11 flussi) | Da creare |

# Piano di Esecuzione Multi-Agentico — Settimanale

> **Versione: 2.0** — Tutti i 38 punti (A1–H4) risolti. Frontend consolidato in file unico.
> Stato: STEP 1–5 COMPLETATI, STEP 6 IN CORSO

---

## Decisioni Architetturali Consolidate

### Stack

| Aspetto | Decisione |
|---------|-----------|
| PHP | **7.4** — `declare(strict_types=1)`, typed properties, arrow functions, `??=`, spread |
| Vue.js | **Vue 3 CDN** — Options API (`data`, `computed`, `methods`, `mounted`), template backtick |
| CSS | **Bootstrap 5 CDN** + Bootstrap Icons |
| Webserver | **Apache** — integrato in app padre |
| Database | **PostgreSQL 16** — schema pre-esistente, no DDL |
| DB Access | **TraitTryQuery** — `tryQuery($stmt, $bindings)` → `?PDOStatement` |
| Auth | Nessuna (gestita dall'app padre) |
| DEV/PROD | Costante PHP `ENV_IS_DEV` gia disponibile |

### Struttura file del progetto

```
Controller:
  FirstAdvisory\FAWill\controller\settimanale\ctl_import_settimanale
  ├── getHead()    → CDN + ./assets-fa/css/settimanale/main.css + script includes
  ├── getSubTool() → ''
  ├── getContent() → <div id="app_import_settimanale">
  └── getScript()  → init Vue app + mount (dati iniettati da PHP via json_encode)

Model (namespace FirstAdvisory\FAWill\model\Import\Settimanale):
  ├── AjaxResponseHelper.php — Outpiu JSON chiamate Ajax
  ├── HeaderManager.php      — CRUD testate
  ├── RecordManager.php      — CRUD record
  ├── BaseConfig.php         — Lettura config, payload per frontend
  └── FormHelper.php         — Autocomplete company/policy/fund

Ajax:
  ├── /model/ajax/ajax_import_settimanale_view.php  — solo GET
  └── /model/ajax/ajax_import_settimanale_save.php  — solo POST

Frontend:
  ├── ./assets-fa/css/settimanale/main.css
  └── ./assets-fa/js/settimanale/
      └── app.js           — Vue app monolitico: root + componenti + helpers

Config:
  └── settimanale_settings.json — import_main_id, mapping tipi record (id→codice→segno), campi per form
```

### Accesso DB (TraitTryQuery)

```php
// Query singola (auto-begin + auto-commit)
$stmt = $this->tryQuery($sql, [':param' => $value]);
$rows = $this->getQueryRecords($stmt);       // fetchAll FETCH_ASSOC
$row  = $this->getQueryRecord($stmt);        // fetch singolo
$n    = $this->getQueryAffectedRows($stmt);  // rowCount

// Transazione multi-query (manuale)
$this->beginTransaction();
$this->tryQuery($sql1, $bindings1, false);
$this->tryQuery($sql2, $bindings2, false);
$this->tryQuery('commit');

// Batch transazionale
$this->addQueryInStack($sql1, $bindings1);
$this->addQueryInStack($sql2, $bindings2);
$this->tryQueryStack(true);
```

### Regole di business

| Regola | Dettaglio |
|--------|-----------|
| Formula valuta | `valore_eur = valore_cur * exchange_rate` |
| row_id | Ricalcolato senza buchi dopo cancellazione |
| Modifica filename | Propaga a `source_filename` di tutti i record figli (transazione) |
| Cancellazione testata | Solo se `rows_imported = 0` AND `param_import_status_id = 1` |
| Insert/Delete record | Aggiorna atomicamente `rows_imported` (+1/-1) e `run_end_date = now()` |
| Validazioni | Warning non-bloccanti (utente puo procedere) |
| Campi sola lettura testata | rows_rejected, rows_recovered, last_check_*, last_post_* |

### Autocomplete

| Campo | Query | Note |
|-------|-------|------|
| company (field_04) | `SELECT name FROM company WHERE name ILIKE '%' \|\| :subText \|\| '%' LIMIT 20` | |
| policy_number (field_06) | `SELECT code_company FROM contract WHERE code_company ILIKE '%' \|\| :subText \|\| '%' LIMIT 20` | |
| fund_code (field_12) | `SELECT code, description FROM fund WHERE code ILIKE '%' \|\| :subText \|\| '%' LIMIT 20` | `description` auto-compila field_13 |

- Min 2 caratteri, debounce 1 secondo, risultati globali, max 20

### Colonne tabella record (D1)

Ordine con "/" per campi tipo-specifici (positivo/negativo), celle vuote se non applicabile:

```
field_02, field_01, field_04, field_06, field_11, field_12, field_13,
field_14, field_15, field_49, field_50,
field_36/37, field_38, field_39, field_40, field_41,
field_16/24, field_17/25, field_18/26, field_19/27,
field_20/28, field_21/29, field_22/30, field_23/31,
field_34, field_35, field_32, field_33
```

- **Label:** nomi tecnici inglesi (operatori abituati)
- **Colori bottoni tipo record:** generati dinamicamente dal frontend via HSL. Backend invia segno (+/-/null). Freddi=positivo, caldi=negativo, verde=neutro.

---

## Piano di Esecuzione — 6 Step

### Panoramica

| Step | Agente | Modello | Responsabilita | Output |
|------|--------|---------|----------------|--------|
| 1 | **agent-ears** | sonnet | Requisiti EARS formali | `docs/SPEC_REQUISITI.md`, `docs/GLOSSARIO.md`, `docs/ACCEPTANCE_CRITERIA.md` |
| 2 | **agent-schema** | sonnet | Schema reference + catalogo query | `docs/SCHEMA_REFERENCE.md`, `docs/QUERY_REFERENCE.md` |
| 3 | **agent-api** | sonnet | Contratto API JSON | `docs/API_CONTRACT.md` |
| 4 | **agent-backend** | sonnet | Codice PHP completo | Controller, Model classes, Ajax handlers, settimanale_settings.json |
| 5 | **agent-frontend** | sonnet | App Vue.js completa | JS files + CSS |
| 6 | **agent-integrazione** | sonnet | Test e deploy | `docs/DEPLOY.md`, checklist test |

---

### STEP 1 — Requisiti EARS (agent-ears) — AVVIABILE

**Obiettivo:** Trasformare il README in requisiti EARS formali e verificabili.

**Istruzioni per l'agente:**

Leggere i file: `README.md` e `PIANO_ESECUZIONE.md` (sezione "Decisioni Architetturali").

Produrre 3 documenti:

**1. `docs/SPEC_REQUISITI.md`** — Requisiti EARS raggruppati per dominio:
- `REQ-UI-TST-*` — Interfaccia testate (tabella, paginazione, filtro, sort, icone azione, modale nuova testata, cancellazione condizionale)
- `REQ-UI-REC-*` — Interfaccia record (tabella, bottoni tipo, colonne con "/", paginazione, filtro, sort)
- `REQ-UI-MOD-*` — Modali (3 varianti form, campi comuni, campi specifici, modifica, duplicazione, autocomplete)
- `REQ-BIZ-*` — Logica business (formula valuta, row_id, propagazione filename, aggiornamento testata, condizioni cancellazione)
- `REQ-VAL-*` — Validazioni warning non-bloccanti (3 set di formule)
- `REQ-API-*` — Endpoint (config, headers, records, autocomplete, header_save, record_save, record_delete)
- `REQ-ERR-*` — Gestione errori (messaggio + stack trace in DEV)

Per ogni requisito: ID, pattern EARS, statement, priorita MoSCoW, rationale, acceptance criteria.

**2. `docs/GLOSSARIO.md`** — Termini di dominio:
- Testata (header), Record, Tipo operazione (ASV/positivo/negativo), Valorizzazione, Operazione positiva, Operazione negativa
- field_01–field_50 con mappatura nome logico
- import_record_id → codice tipo → segno
- Tutti i campi con label italiano e nome tecnico

**3. `docs/ACCEPTANCE_CRITERIA.md`** — Criteri BDD (Given/When/Then) per ogni flusso:
- CRUD testata, CRUD record, modifica filename con propagazione, cancellazione con ricalcolo row_id
- Validazioni warning, autocomplete, paginazione/filtro/sort, gestione errori

---

### STEP 2 — Schema e Query (agent-schema) — AVVIABILE IN PARALLELO CON STEP 1

**Obiettivo:** Documentare schema DB e produrre catalogo completo query SQL.

**Istruzioni per l'agente:**

Leggere: `README.md`, `PIANO_ESECUZIONE.md`, `example/TraitTryQuery.php`.

**1. `docs/SCHEMA_REFERENCE.md`** — Documentazione tabelle:

| Tabella | Ruolo |
|---------|-------|
| `data.import_tracking` | Testate — PK `id`, campi gestiti dall'app (filename, rows_imported, run_*_date), campi sola lettura (rows_rejected, rows_recovered, last_*) |
| `data.import_data_flat` | Record — PK `id`, FK `import_tracking_id`, `row_id` progressivo, `import_record_id`, `source_filename`, `field_01`–`field_50` (tutti TEXT) |
| `data.param_import_status` | Lookup stato — `id`, `description_2` |
| `company` | Autocomplete — `name` |
| `contract` | Autocomplete — `code_company` |
| `fund` | Autocomplete — `code`, `description` |

Mapping completo field_01–field_50: per ogni field, indicare nome logico, tipo record che lo usa (comune/ASV/positivo/negativo), se automatico o chiesto all'utente, valore default.

**2. `docs/QUERY_REFERENCE.md`** — Catalogo query con named parameters `:param`:

| ID | Operazione | Metodo TraitTryQuery | Transazione |
|----|-----------|---------------------|-------------|
| Q1 | Lista testate | `tryQuery()` singola | auto |
| Q2 | Record per testata | `tryQuery()` singola | auto |
| Q3 | Inserisci testata | `tryQuery()` singola | auto |
| Q4 | Aggiorna filename + propaga source_filename | `addQueryInStack()` + `tryQueryStack(true)` | batch |
| Q5 | Cancella testata (pre-check) | `tryQuery()` singola | auto |
| Q6 | Inserisci record + aggiorna testata | `addQueryInStack()` + `tryQueryStack(true)` | batch |
| Q7 | Aggiorna record + aggiorna testata | `addQueryInStack()` + `tryQueryStack(true)` | batch |
| Q8 | Cancella record + ricalcola row_id + aggiorna testata | `addQueryInStack()` + `tryQueryStack(true)` | batch |
| Q9a | Autocomplete company | `tryQuery()` singola | auto |
| Q9b | Autocomplete policy | `tryQuery()` singola | auto |
| Q9c | Autocomplete fund | `tryQuery()` singola | auto |

Per il ricalcolo row_id (Q8), usare window function:
```sql
UPDATE data.import_data_flat AS t
SET row_id = sub.new_row_id
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY row_id) AS new_row_id
    FROM data.import_data_flat
    WHERE import_tracking_id = :tracking_id
) AS sub
WHERE t.id = sub.id AND t.row_id != sub.new_row_id;
```

---

### STEP 3 — Contratto API (agent-api) — DOPO STEP 1 (DRAFT)

**Obiettivo:** Specifica JSON completa per tutti gli endpoint.

**Istruzioni per l'agente:**

Leggere: `README.md`, `PIANO_ESECUZIONE.md`, `docs/QUERY_REFERENCE.md` (da Step 2).

Produrre `docs/API_CONTRACT.md` con:

**File GET: `ajax_import_settimanale_view.php`**

| Action | Parametri | Response |
|--------|-----------|----------|
| `config` | nessuno | `{success:true, data:{is_dev:bool, record_types:[{import_record_id, code, sign, fields:[...]}], ...}}` |
| `headers` | nessuno | `{success:true, data:[{id, run_start_date, run_end_date, filename, status_text, rows_imported, rows_rejected, rows_recovered, last_check_start, last_check_end, last_post_start, last_post_end}]}` |
| `records` | `tracking_id` | `{success:true, data:[{id, row_id, import_record_id, source_filename, field_01...field_50}]}` |
| `autocomplete` | `field`, `query` | `{success:true, data:[{value, label, description?}]}` |

**File POST: `ajax_import_settimanale_save.php`**

| Action | Request Body | Response |
|--------|-------------|----------|
| `header_save` | `{id?, filename}` | `{success:true, data:{...testata completa}}` |
| `record_save` | `{id?, import_tracking_id, import_record_id, fields:{field_04:..., field_06:..., ...}}` | `{success:true, data:{...record completo}}` |
| `record_delete` | `{id, import_tracking_id}` | `{success:true, data:{deleted_id, updated_header:{...}}}` |

**Formato errore:** `{success:false, message:string, exception?:string}` — `exception` presente solo se `ENV_IS_DEV`.

---

### STEP 4 — Backend PHP (agent-backend) — DOPO STEP 2 E 3

**Obiettivo:** Codice PHP completo e funzionante.

**Istruzioni per l'agente:**

Leggere: `README.md`, `PIANO_ESECUZIONE.md`, `docs/API_CONTRACT.md`, `docs/QUERY_REFERENCE.md`, `example/ctl_timeline_file.php`, `example/TraitTryQuery.php`.

**File da produrre:**

1. **`ctl_import_settimanale.php`** (controller) — namespace `FirstAdvisory\FAWill\controller\settimanale`
   - `getHead()`: CDN Vue 3 + Bootstrap 5 + Bootstrap Icons + CSS custom + script JS esterni
   - `getContent()`: `<div id="app_import_settimanale" class="col-lg-12"></div>`
   - `getScript()`: costante JS con config (json_encode del payload config), init Vue app, mount

2. **`HeaderManager.php`** — namespace `FirstAdvisory\FAWill\model\Import`, `use TraitTryQuery;`
   - `getList(): array` — Q1
   - `create(string $filename): array` — Q3, ritorna record creato
   - `updateFilename(int $id, string $filename): array` — Q4 (batch transaction), ritorna record aggiornato
   - `delete(int $id): void` — pre-check + Q5
   - `updateOnRecordChange(int $id, int $delta): void` — aggiorna rows_imported e run_end_date

3. **`RecordManager.php`** — `use TraitTryQuery;`
   - `getByTracking(int $trackingId): array` — Q2
   - `create(int $trackingId, int $importRecordId, array $fields): array` — Q6 (batch transaction)
   - `update(int $id, array $fields): array` — Q7 (batch transaction)
   - `delete(int $id, int $trackingId): void` — Q8 (batch transaction con ricalcolo row_id)

4. **`BaseConfig.php`** — `use TraitTryQuery;`
   - `getConfig(): array` — legge settimanale_settings.json, aggiunge `ENV_IS_DEV`, prepara payload

5. **`FormHelper.php`** — `use TraitTryQuery;`
   - `search(string $field, string $query): array` — Q9a/Q9b/Q9c, LIMIT 20

6. **`ajax_import_settimanale_view.php`** — handler GET
   - Switch su `$_GET['action']`: config, headers, records, autocomplete
   - Try/catch globale, JSON output

7. **`ajax_import_settimanale_save.php`** — handler POST
   - Switch su action dal body JSON: header_save, record_save, record_delete
   - Try/catch globale, JSON output

8. **`settimanale_settings.json`** — import_main_id (1120), mapping tipi record, campi per form

**Vincoli PHP 7.4:** No enum (costanti), no match (switch), no readonly (private+getter), `declare(strict_types=1)` ovunque.

---

### STEP 5 — Frontend Vue.js (agent-frontend) — DOPO STEP 3

**Obiettivo:** App Vue.js completa e funzionante.

**Istruzioni per l'agente:**

Leggere: `README.md`, `PIANO_ESECUZIONE.md`, `docs/API_CONTRACT.md`, `example/ctl_timeline_file.php`.

**File da produrre:**

1. **`./assets-fa/js/settimanale/app.js`** — Vue app monolitico (root + componenti + helpers)
   - `createApp({...}).mount('#app_import_settimanale')`
   - **State** (`data()`): config, currentView, selectedTracking, headers[], records[], pagination, filters, sorting, modals state, autocomplete state, errors
   - **Computed**: filteredHeaders, paginatedHeaders, filteredRecords, paginatedRecords, pagination totals, validationWarnings, recordTypeButtons, currentFormFields, recordTypeConfig
   - **Methods**: API calls (fetch), navigazione, CRUD testate e record, autocomplete (debounce 1s), calcolo EUR real-time, generazione colori HSL, filtro/sort/paginazione client-side, validazioni warning non-bloccanti
   - **Template**: stringa backtick con vista testate, vista record, modale record (3 varianti form), modale testata, modale conferma cancellazione
   - `mounted()`: carica config, poi carica headers

2. **`./assets-fa/css/settimanale/main.css`** — Stili custom (minimo, Bootstrap fa il grosso)

**Pattern Vue (da seguire come `ctl_timeline_file.php`):**
- Options API: `data()`, `computed`, `methods`, `mounted`
- Template come stringa backtick inline (no SFC, no componenti separati)
- Chiamate Ajax con `fetch()` + `async/await`
- Nessun router, nessun Pinia — stato locale nell'app root

**UI specifiche:**
- Label colonne testate: italiano (da README)
- Label colonne record: nomi tecnici inglesi
- Colonne con "/": mostrare field appropriato per tipo, vuoto se non applicabile
- Paginazione: select con opzioni 10/20/50/100
- Sort: click header cicla nessuno→asc→desc (icona freccia o assenza)
- Filtro: `<input type="text">` sopra tabella, filtra client-side
- Bottoni tipo record: generati da config backend, label 3 lettere maiuscole

---

### STEP 6 — Integrazione e Testing (agent-integrazione) — DOPO STEP 4 E 5

**Obiettivo:** Integrare e verificare il sistema completo.

**Istruzioni per l'agente:**

1. Produrre `docs/DEPLOY.md` con istruzioni per:
   - Posizionamento file nell'app padre
   - Creazione settimanale_settings.json con dati reali
   - Registrazione controller nel routing dell'app padre
   - Verifica permessi file Ajax (view=GET only, save=POST only)

2. Checklist test manuali per tutti i flussi:
   - CRUD testata (crea → modifica filename → verifica propagazione → cancella)
   - CRUD record per ogni tipo (ASV, EMP, PSR come rappresentativi dei 3 gruppi)
   - Duplicazione record
   - Cancellazione record → verifica ricalcolo row_id e rows_imported
   - Autocomplete (company, policy_number, fund_code con auto-fill description)
   - Validazioni warning per ciascun tipo
   - Paginazione (cambia page size, naviga pagine)
   - Filtro (digita testo, verifica filtraggio su tutte le colonne)
   - Sort 3 stati su almeno 3 colonne diverse
   - Gestione errori (simulare errore backend, verificare DEV vs PROD)
   - Condizioni cancellazione testata (verificare che il cestino appaia/scompaia)

---

## Diagramma Dipendenze Finale

```
     ┌─────────┐ ┌─────────┐
     │ STEP 1  │ │ STEP 2  │  ← PARALLELO, AVVIABILI ORA
     │ (ears)  │ │ (schema) │
     └────┬────┘ └────┬────┘
          └─────┬─────┘
                ▼
          ┌─────────┐
          │ STEP 3  │
          │  (api)  │
          └────┬────┘
          ┌────┴────┐
          ▼         ▼
    ┌─────────┐ ┌──────────┐
    │ STEP 4  │ │ STEP 5   │  ← PARALLELO
    │(backend)│ │(frontend)│
    └────┬────┘ └────┬─────┘
         └─────┬─────┘
               ▼
         ┌──────────┐
         │ STEP 6   │
         │(integr.) │
         └──────────┘
```

---

## Stato di Avanzamento

| Step | Stato | Note |
|------|-------|------|
| 1 — Requisiti EARS | COMPLETATO | 3 documenti prodotti |
| 2 — Schema e Query | COMPLETATO | 2 documenti prodotti |
| 3 — Contratto API | COMPLETATO | API_CONTRACT.md v2.0 |
| 4 — Backend PHP | COMPLETATO | 8 file prodotti |
| 5 — Frontend Vue.js | COMPLETATO | File unico monolitico (app.js + main.css) anziché 3 file separati |
| 6 — Integrazione | IN CORSO | DEPLOY.md + strategia testing automatico |

### Nota su Step 5 — Decisione architetturale

Il piano originale prevedeva 3 file JS (`app.js`, `components.js`, `utils.js`). In fase di implementazione si è scelto di consolidare tutto in un unico `app.js` monolitico (~1200 righe). Motivazione: trattandosi di Vue 3 CDN senza build system, la separazione in file multipli non offre vantaggi significativi (no tree-shaking, no module bundling) e aggiunge complessità di caricamento.

# Iterazione Domande & Risposte

Questo file traccia tutte le iterazioni di domande e risposte tra l'analisi e l'utente.

---

## Iterazione 1 — Analisi iniziale (22 punti)

### AREA A — Stack Tecnologico

| ID | Domanda | Risposta | Stato |
|----|---------|----------|-------|
| A1 | PHP 7.2 è EOL. Confermiamo PHP 7.2 o aggiorniamo a PHP 8.2+? | Retrocompatibilità necessaria, possiamo usare **PHP 7.4** | RISOLTO |
| A2 | Vue 2 o Vue 3? Composition API + `<script setup>`? | Confermata **Vue 3** | RISOLTO |
| A3 | Build system: Vite, Webpack, o CDN senza build step? | **Senza build step** (CDN) | RISOLTO |
| A4 | Bootstrap 4 o 5? | **Bootstrap 5** | RISOLTO |
| A5 | Ambiente di deploy: Apache, Nginx, Docker? | Integrato in app più ampia, esposta con **Apache** | RISOLTO |

### AREA B — Database e Schema

| ID | Domanda | Risposta | Stato |
|----|---------|----------|-------|
| B1 | Campi field_03, field_05, field_07–10, field_42–48: inutilizzati? | **Inutilizzati** in questo contesto | RISOLTO |
| B2 | param_import_status_id: esiste tabella lookup? | Sì: `SELECT id, description_2 FROM data.param_import_status`. Backend imposta il valore, frontend riceve il testo | RISOLTO |
| B3 | rows_rejected, rows_recovered: come vengono popolati? | Gestiti da **altri componenti**, qui sono **sola lettura** | RISOLTO |
| B4 | last_check_start/end, last_post_start/end: come vengono popolati? | Gestiti da **altri componenti**, qui sono **sola lettura** | RISOLTO |
| B5 | row_id dopo eliminazione: buchi o ricalcolo? | **Ricalcolati** per non lasciare buchi | RISOLTO |
| B6 | Schema DB pre-esistente o da creare? | **DB pre-esistente**, fuori dal dominio dell'app | RISOLTO |

### AREA C — Logica di Business

| ID | Domanda | Risposta | Stato |
|----|---------|----------|-------|
| C1 | Formula conversione valuta? | `valore_eur = valore_cur * exchange_rate` | RISOLTO |
| C2 | Riga 165: field_36 vs field_37 nelle operazioni negative | **Refuso** confermato, README corretto a field_37 | RISOLTO |
| C3 | Modifica testata: quali campi sono modificabili? | Solo **filename**. Se esistono record, propagare la modifica a `source_filename` di ogni record | RISOLTO |
| C4 | Ordinamento "nan": cosa significa? | **Nessun ordinamento** (ordine naturale/di default) | RISOLTO |

### AREA D — Interfaccia Utente

| ID | Domanda | Risposta | Stato |
|----|---------|----------|-------|
| D1 | Colonne tabella record (dettaglio testata) | README aggiornato con sezione "Campi da mostrare" (righe 167-172) | RISOLTO |
| D2 | Colori bottoni tipo record: da backend o frontend? | Frontend decide i colori. Backend indica solo tipo operazione: `+` (positiva), `-` (negativa), `NULL` (neutra). Colori freddi per positive, caldi per negative, verde per neutre. Generare dinamicamente le tonalità. | RISOLTO |
| D3 | Autocomplete: parametri di query e soglia? | Parametri: campo + testo parziale. Soglia minima **2 caratteri**. Debounce **1 secondo**. Risultati **globali**, max **20 risultati**. | RISOLTO |
| D4 | Filtro tabella: client-side o server-side? | **Client-side**, su tutte le colonne visibili | RISOLTO |

### AREA E — Sicurezza e Infrastruttura

| ID | Domanda | Risposta | Stato |
|----|---------|----------|-------|
| E1 | Autenticazione necessaria? | **No**, l'auth è gestita dall'app padre | RISOLTO |
| E2 | Contenuto del file di configurazione JSON? | Configurazioni specifiche dell'app. Connessione DB via `use TraitTryQuery;` + `$this->tryQuery($statement, $arrayVarToBind)`. Contenuto config da definire in progettazione. | RISOLTO (vedi F6) |
| E3 | Gestione concorrenza? | **Nessun controllo** aggiuntivo, sufficienti i lock transazionali di PostgreSQL | RISOLTO |

---

## Iterazione 2 — Impatti architetturali (7 punti)

### AREA F — Impatti architetturali delle scelte stack

| ID | Domanda | Dettaglio | Risposta | Stato |
|----|---------|-----------|----------|-------|
| F1 | **Vue 3 senza build step** | Conferma architettura senza SFC/TS | Riferimento a `ctl_timeline_file.php`: Vue 3 CDN, Options API, template inline | RISOLTO |
| F2 | **Struttura file frontend** | Organizzazione file JS | Deve essere compatibile con il pattern getHead/getContent/getScript del controller. File JS esterni ammessi. | RISOLTO |
| F3 | **TraitTryQuery: interfaccia** | Return type, transazioni, autoloader | PDOStatement. Transazioni: `tryQuery($s,$v,false)` + begin/commit manuali, oppure `addQueryInStack()`+`tryQueryStack()`. Autoloader gestito dall'app padre. | RISOLTO |
| F4 | **Namespace e struttura classi PHP** | PSR-4, prefisso, caricamento | PSR-4, namespace `FirstAdvisory\FAWill\model\Import` | RISOLTO |
| F5 | **Percorso di integrazione** | Come si integra nell'app padre | Controller con `getHead()`, `getContent()`, `getScript()`. Ajax via `/model/ajax/` | RISOLTO |
| F6 | **Config JSON: contenuto** | Contenuto proposto | Approvato come base, aperto ad estensioni future. `ENV_IS_DEV` già disponibile come costante PHP. | RISOLTO |

---

## Iterazione 3 — Dettagli implementativi emersi dall'analisi dei file di esempio

### Cosa ho appreso dai file di esempio

**Da `ctl_timeline_file.php` (pattern di integrazione):**
- Classe controller nel namespace `FirstAdvisory\FAWill\controller\settimanale`
- 4 metodi obbligatori: `getHead()` (CSS/CDN), `getSubTool()` (toolbar), `getContent()` (div mount point), `getScript()` (JS + Vue app)
- Vue 3 via CDN globale (`const { createApp } = Vue;`), Options API (`data()`, `computed`, `methods`, `mounted`)
- Template come stringa backtick inline nel `getScript()`
- Dati iniziali iniettati da PHP via `json_encode()` in una costante JS
- Chiamate AJAX verso `/model/ajax/ajax_<nome>.php?action=<azione>`
- `ENV_IS_DEV` è una costante PHP già disponibile per la modalità debug

**Da `TraitTryQuery.php` (accesso DB):**
- `tryQuery($stmt, $values, $transaction=true)` → `?PDOStatement`
- Con `$transaction=true` (default): auto-begin + auto-commit per ogni singola query
- Per transazioni multi-query: passare `$transaction=false` e gestire manualmente `beginTransaction()` / commit / rollback
- Alternativa batch: `addQueryInStack()` + `tryQueryStack(true)` — esegue tutto in una transazione
- Helper: `getQueryRecord($stmt)` → fetch singolo, `getQueryRecords($stmt)` → fetchAll, `getQueryAffectedRows($stmt)` → rowCount
- Connessione lazy-loaded tramite classe `Database`

### AREA G — Nuovi punti da chiarire

| ID | Domanda | Dettaglio                                                                                                                                                                                                         | Risposta |
|----|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| G1 | **Nome e namespace del controller** | Seguendo il pattern dell'esempio (`ctl_timeline_file` in `FirstAdvisory\FAWill\controller\settimanale`), propongo: classe `ctl_import_settimanale` nello stesso namespace. Va bene? O preferisci un nome diverso? | va bene | RISOLTO |
| G2 | **File e path Ajax** | Il README dice "2 pagine distinte GET/POST". Seguendo il pattern (`/model/ajax/ajax_time_line_action.php?action=...`), propongo un singolo file. Oppure preferisci 2 file separati?                               | **Due file separati** per gestire le autorizzazioni di accesso (GET-only / POST-only) | RISOLTO |
| G3 | **Posizione file JS esterni** | Qual è il path corretto per i file JS/CSS statici nell'app padre?                                                                                                                                                 | CSS: `./assets-fa/css/settimanale/main.css`. JS: `./assets-fa/js/settimanale.js`. Granularità importante. | RISOLTO |
| G4 | **Tabelle sorgente per autocomplete** | Da quali tabelle vengono i dati autocomplete?                                                                                                                                                                     | `company.name`, `contract.code_company`, `fund.code`. Tutti con ILIKE + LIMIT 15. | RISOLTO |
| G5 | **Colonne record: campi esclusivi per tipo** | Celle vuote dove non applicabile?                                                                                                                                                                                 | **Sì**, celle vuote per campi non applicabili al tipo | RISOLTO |
| G6 | **Label colonne tabella record** | Tecnici (inglese) o tradotti (italiano)?                                                                                                                                                                          | **Nomi tecnici** (operatori abituati a vederli) | RISOLTO |

---

## Iterazione 4 — Ultimi dettagli implementativi

Dalle risposte G1–G6 emergono **4 punti di dettaglio finale**.

### AREA H — Dettagli finali

| ID | Domanda | Dettaglio | Risposta |
|----|---------|-----------|----------|
| H1 | **Nomi dei 2 file Ajax** | Confermati 2 file separati (GET/POST). Propongo nomi. | `ajax_import_settimanale_view.php` (GET) e `ajax_import_settimanale_save.php` (POST) | RISOLTO |
| H2 | **Fund description per autocomplete** | Nome colonna descrizione nella tabella `fund` | `SELECT code, description FROM fund WHERE code ILIKE '%' \|\| :subText \|\| '%' LIMIT 20` | RISOLTO |
| H3 | **Struttura file JS** | Unico file o multipli? | **File multipli** sotto `./assets-fa/js/settimanale/` | RISOLTO |
| H4 | **Autocomplete LIMIT** | 15 o 20? | **20** | RISOLTO |

---

## Riepilogo Finale

**Tutte le 38 domande (A1–H4) sono state risolte.** Il piano di esecuzione e completo e pronto per l'implementazione.

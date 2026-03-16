# QUERY_REFERENCE.md

Catalogo completo delle query SQL per l'applicazione Settimanale.

**Convenzioni:**
- Tutte le query usano **NAMED PARAMETERS** (`:param_name`)
- Indicazione del metodo `TraitTryQuery` da utilizzare
- Specifiche sulle transazioni (auto-commit vs batch)

---

## Q1 - Lista Testate

**Descrizione:** Recupera l'elenco di tutte le testate con informazioni di stato.

**Metodo TraitTryQuery:** `tryQuery()` singola (auto-commit)

**Transazione:** Auto-commit

**SQL:**
```sql
SELECT
    t.id,
    t.run_start_date,
    t.run_end_date,
    t.filename,
    ps.description_2 AS status_text,
    t.param_import_status_id,
    t.rows_imported,
    t.rows_rejected,
    t.rows_recovered,
    t.last_check_start,
    t.last_check_end,
    t.last_post_start,
    t.last_post_end
FROM data.import_tracking t
LEFT JOIN data.param_import_status ps
    ON ps.id = t.param_import_status_id
WHERE t.import_main_id = 1120
ORDER BY t.run_start_date DESC
LIMIT 1000
```

**Parametri:**
- Nessuno (import_main_id è hardcoded a 1120)

**Esempio utilizzo PHP:**
```php
$stmt = $this->tryQuery($sql);
$headers = $this->getQueryRecords($stmt);
```

**Response:** Array di testate con campi joined.

---

## Q2 - Record per Testata

**Descrizione:** Recupera tutti i record associati a una specifica testata.

**Metodo TraitTryQuery:** `tryQuery()` singola (auto-commit)

**Transazione:** Auto-commit

**SQL:**
```sql
SELECT *
FROM data.import_data_flat
WHERE import_tracking_id = :tracking_id
ORDER BY row_id ASC
```

**Parametri:**
- `:tracking_id` (INTEGER) - ID della testata

**Esempio utilizzo PHP:**
```php
$sql = "SELECT * FROM data.import_data_flat WHERE import_tracking_id = :tracking_id ORDER BY row_id ASC";
$bindings = [':tracking_id' => $trackingId];
$stmt = $this->tryQuery($sql, $bindings);
$records = $this->getQueryRecords($stmt);
```

**Response:** Array di record ordinati per row_id.

---

## Q3 - Inserisci Testata

**Descrizione:** Crea una nuova testata con valori di default.

**Metodo TraitTryQuery:** `tryQuery()` singola (auto-commit)

**Transazione:** Auto-commit

**SQL:**
```sql
INSERT INTO data.import_tracking (
    import_main_id,
    param_import_status_id,
    rows_imported,
    run_start_date,
    run_end_date,
    filename
) VALUES (
    1120,
    1,
    0,
    now(),
    NULL,
    :filename
)
RETURNING *
```

**Parametri:**
- `:filename` (TEXT) - Descrizione libera della testata

**Esempio utilizzo PHP:**
```php
$sql = "INSERT INTO data.import_tracking (import_main_id, param_import_status_id, rows_imported, run_start_date, run_end_date, filename)
        VALUES (1120, 1, 0, now(), NULL, :filename)
        RETURNING *";
$bindings = [':filename' => $filename];
$stmt = $this->tryQuery($sql, $bindings);
$newHeader = $this->getQueryRecord($stmt);
```

**Response:** Record testata appena creato con ID generato.

---

## Q4 - Aggiorna Filename Testata + Propaga source_filename

**Descrizione:** Aggiorna il filename della testata e propaga il valore a tutti i record figli in una transazione atomica.

**Metodo TraitTryQuery:** `addQueryInStack()` + `tryQueryStack(true)` (batch transaction)

**Transazione:** Batch transaction (2 query)

**SQL Query 1 - Aggiorna testata:**
```sql
UPDATE data.import_tracking
SET filename = :filename
WHERE id = :id
```

**SQL Query 2 - Propaga a record:**
```sql
UPDATE data.import_data_flat
SET source_filename = :filename
WHERE import_tracking_id = :id
```

**Parametri:**
- `:id` (INTEGER) - ID della testata
- `:filename` (TEXT) - Nuovo filename

**Esempio utilizzo PHP:**
```php
$sql1 = "UPDATE data.import_tracking SET filename = :filename WHERE id = :id";
$sql2 = "UPDATE data.import_data_flat SET source_filename = :filename WHERE import_tracking_id = :id";
$bindings = [':id' => $id, ':filename' => $filename];

$this->addQueryInStack($sql1, $bindings);
$this->addQueryInStack($sql2, $bindings);
$this->tryQueryStack(true); // Transazione atomica

// Recupera testata aggiornata
$sqlGet = "SELECT * FROM data.import_tracking WHERE id = :id";
$stmt = $this->tryQuery($sqlGet, [':id' => $id]);
$updatedHeader = $this->getQueryRecord($stmt);
```

**Response:** Testata aggiornata (recuperata dopo commit).

**Note:** Le due query devono essere eseguite atomicamente. Se una fallisce, entrambe vengono rollback.

---

## Q5 - Cancella Testata

**Descrizione:** Cancella una testata solo se sono soddisfatte le condizioni (rows_imported=0 AND param_import_status_id=1).

**Metodo TraitTryQuery:** `tryQuery()` singola (auto-commit) per pre-check, poi altra `tryQuery()` per DELETE

**Transazione:** Due transazioni separate (pre-check + delete)

**SQL Pre-check:**
```sql
SELECT rows_imported, param_import_status_id
FROM data.import_tracking
WHERE id = :id
```

**SQL Delete (solo se pre-check OK):**
```sql
DELETE FROM data.import_tracking
WHERE id = :id
```

**Parametri:**
- `:id` (INTEGER) - ID della testata

**Esempio utilizzo PHP:**
```php
// Pre-check
$sqlCheck = "SELECT rows_imported, param_import_status_id FROM data.import_tracking WHERE id = :id";
$stmt = $this->tryQuery($sqlCheck, [':id' => $id]);
$header = $this->getQueryRecord($stmt);

if (!$header) {
    throw new Exception("Testata non trovata");
}

if ($header['rows_imported'] != 0 || $header['param_import_status_id'] != 1) {
    throw new Exception("Impossibile cancellare: testata contiene record o non è in stato iniziale");
}

// Delete
$sqlDelete = "DELETE FROM data.import_tracking WHERE id = :id";
$this->tryQuery($sqlDelete, [':id' => $id]);
```

**Response:** Nessuna (void), oppure Exception se condizioni non soddisfatte.

---

## Q6 - Inserisci Record + Aggiorna Testata

**Descrizione:** Inserisce un nuovo record, calcolando il prossimo row_id, e aggiorna la testata (rows_imported +1, run_end_date=now()) in transazione atomica.

**Metodo TraitTryQuery:** `addQueryInStack()` + `tryQueryStack(true)` (batch transaction)

**Transazione:** Batch transaction (3 query: calcolo row_id, INSERT, UPDATE testata)

**SQL Query 1 - Calcola prossimo row_id:**
```sql
SELECT COALESCE(MAX(row_id), 0) + 1 AS next_row_id
FROM data.import_data_flat
WHERE import_tracking_id = :tracking_id
```

**SQL Query 2 - Inserisci record:**
```sql
INSERT INTO data.import_data_flat (
    import_tracking_id,
    row_id,
    import_record_id,
    source_filename,
    field_01,
    field_02,
    field_04,
    field_06,
    field_11,
    field_12,
    field_13,
    field_14,
    field_15,
    field_16,
    field_17,
    field_18,
    field_19,
    field_20,
    field_21,
    field_22,
    field_23,
    field_24,
    field_25,
    field_26,
    field_27,
    field_28,
    field_29,
    field_30,
    field_31,
    field_32,
    field_33,
    field_34,
    field_35,
    field_36,
    field_37,
    field_38,
    field_39,
    field_40,
    field_41,
    field_49,
    field_50
) VALUES (
    :import_tracking_id,
    :row_id,
    :import_record_id,
    :source_filename,
    :field_01,
    :field_02,
    :field_04,
    :field_06,
    :field_11,
    :field_12,
    :field_13,
    :field_14,
    :field_15,
    :field_16,
    :field_17,
    :field_18,
    :field_19,
    :field_20,
    :field_21,
    :field_22,
    :field_23,
    :field_24,
    :field_25,
    :field_26,
    :field_27,
    :field_28,
    :field_29,
    :field_30,
    :field_31,
    :field_32,
    :field_33,
    :field_34,
    :field_35,
    :field_36,
    :field_37,
    :field_38,
    :field_39,
    :field_40,
    :field_41,
    :field_49,
    :field_50
)
RETURNING *
```

**SQL Query 3 - Aggiorna testata:**
```sql
UPDATE data.import_tracking
SET
    rows_imported = rows_imported + 1,
    run_end_date = now()
WHERE id = :tracking_id
```

**Parametri:**
- `:tracking_id` / `:import_tracking_id` (INTEGER) - ID della testata
- `:row_id` (INTEGER) - Calcolato dalla Query 1
- `:import_record_id` (INTEGER) - Tipo record (112005-112015)
- `:source_filename` (TEXT) - Copia del filename della testata
- `:field_01` ... `:field_50` (TEXT) - Tutti i campi del record

**Esempio utilizzo PHP:**
```php
// Query 1: Calcola next row_id
$sqlRowId = "SELECT COALESCE(MAX(row_id), 0) + 1 AS next_row_id FROM data.import_data_flat WHERE import_tracking_id = :tracking_id";
$stmt = $this->tryQuery($sqlRowId, [':tracking_id' => $trackingId]);
$result = $this->getQueryRecord($stmt);
$nextRowId = $result['next_row_id'];

// Prepara bindings per INSERT
$bindings = [
    ':import_tracking_id' => $trackingId,
    ':row_id' => $nextRowId,
    ':import_record_id' => $importRecordId,
    ':source_filename' => $sourceFilename,
    ':field_01' => $fields['field_01'] ?? '',
    ':field_02' => $fields['field_02'] ?? '',
    // ... tutti i field fino a field_50
];

// Query 2: INSERT record
$sqlInsert = "INSERT INTO data.import_data_flat (...) VALUES (...) RETURNING *";

// Query 3: UPDATE testata
$sqlUpdate = "UPDATE data.import_tracking SET rows_imported = rows_imported + 1, run_end_date = now() WHERE id = :tracking_id";
$bindingsUpdate = [':tracking_id' => $trackingId];

// Esegui in transazione
$this->addQueryInStack($sqlInsert, $bindings);
$this->addQueryInStack($sqlUpdate, $bindingsUpdate);
$this->tryQueryStack(true);

// Recupera record inserito (RETURNING nella Query 2)
// Nota: tryQueryStack non restituisce result set, serve query aggiuntiva
$sqlGet = "SELECT * FROM data.import_data_flat WHERE import_tracking_id = :tracking_id AND row_id = :row_id";
$stmt = $this->tryQuery($sqlGet, [':tracking_id' => $trackingId, ':row_id' => $nextRowId]);
$newRecord = $this->getQueryRecord($stmt);
```

**Response:** Record appena inserito (recuperato dopo commit).

**Note:** La sequenza deve essere atomica. Il RETURNING * dell'INSERT non è accessibile direttamente con `tryQueryStack`, quindi il record va recuperato con una query aggiuntiva dopo il commit.

---

## Q7 - Aggiorna Record + Aggiorna Testata

**Descrizione:** Modifica i campi di un record esistente e aggiorna run_end_date della testata in transazione atomica.

**Metodo TraitTryQuery:** `addQueryInStack()` + `tryQueryStack(true)` (batch transaction)

**Transazione:** Batch transaction (2 query)

**SQL Query 1 - Aggiorna record:**
```sql
UPDATE data.import_data_flat
SET
    field_04 = :field_04,
    field_06 = :field_06,
    field_11 = :field_11,
    field_12 = :field_12,
    field_13 = :field_13,
    field_14 = :field_14,
    field_15 = :field_15,
    field_16 = :field_16,
    field_17 = :field_17,
    field_18 = :field_18,
    field_19 = :field_19,
    field_20 = :field_20,
    field_21 = :field_21,
    field_22 = :field_22,
    field_23 = :field_23,
    field_24 = :field_24,
    field_25 = :field_25,
    field_26 = :field_26,
    field_27 = :field_27,
    field_28 = :field_28,
    field_29 = :field_29,
    field_30 = :field_30,
    field_31 = :field_31,
    field_32 = :field_32,
    field_33 = :field_33,
    field_34 = :field_34,
    field_35 = :field_35,
    field_36 = :field_36,
    field_37 = :field_37,
    field_38 = :field_38,
    field_39 = :field_39,
    field_40 = :field_40,
    field_41 = :field_41,
    field_49 = :field_49,
    field_50 = :field_50
WHERE id = :id
```

**SQL Query 2 - Aggiorna testata:**
```sql
UPDATE data.import_tracking
SET run_end_date = now()
WHERE id = :tracking_id
```

**Parametri:**
- `:id` (INTEGER) - ID del record da modificare
- `:tracking_id` (INTEGER) - ID della testata parent
- `:field_04` ... `:field_50` (TEXT) - Campi da aggiornare

**Esempio utilizzo PHP:**
```php
$sqlUpdateRecord = "UPDATE data.import_data_flat SET field_04 = :field_04, ... WHERE id = :id";
$bindingsRecord = [
    ':id' => $recordId,
    ':field_04' => $fields['field_04'],
    // ... tutti i field
];

$sqlUpdateHeader = "UPDATE data.import_tracking SET run_end_date = now() WHERE id = :tracking_id";
$bindingsHeader = [':tracking_id' => $trackingId];

$this->addQueryInStack($sqlUpdateRecord, $bindingsRecord);
$this->addQueryInStack($sqlUpdateHeader, $bindingsHeader);
$this->tryQueryStack(true);

// Recupera record aggiornato
$sqlGet = "SELECT * FROM data.import_data_flat WHERE id = :id";
$stmt = $this->tryQuery($sqlGet, [':id' => $recordId]);
$updatedRecord = $this->getQueryRecord($stmt);
```

**Response:** Record aggiornato (recuperato dopo commit).

**Note:** Solo i campi modificabili vengono aggiornati (field_01, field_02 sono auto, import_tracking_id, row_id, import_record_id non cambiano).

---

## Q8 - Cancella Record + Ricalcola row_id + Aggiorna Testata

**Descrizione:** Cancella un record, ricalcola tutti i row_id eliminando i buchi, decrementa rows_imported e aggiorna run_end_date in transazione atomica.

**Metodo TraitTryQuery:** `addQueryInStack()` + `tryQueryStack(true)` (batch transaction)

**Transazione:** Batch transaction (3 query)

**SQL Query 1 - Cancella record:**
```sql
DELETE FROM data.import_data_flat
WHERE id = :id
```

**SQL Query 2 - Ricalcola row_id (window function):**
```sql
UPDATE data.import_data_flat AS t
SET row_id = sub.new_row_id
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY row_id) AS new_row_id
    FROM data.import_data_flat
    WHERE import_tracking_id = :tracking_id
) AS sub
WHERE t.id = sub.id
  AND t.row_id != sub.new_row_id
```

**SQL Query 3 - Aggiorna testata:**
```sql
UPDATE data.import_tracking
SET
    rows_imported = rows_imported - 1,
    run_end_date = now()
WHERE id = :tracking_id
```

**Parametri:**
- `:id` (INTEGER) - ID del record da cancellare
- `:tracking_id` (INTEGER) - ID della testata parent

**Esempio utilizzo PHP:**
```php
$sqlDelete = "DELETE FROM data.import_data_flat WHERE id = :id";
$bindingsDelete = [':id' => $recordId];

$sqlReindex = "UPDATE data.import_data_flat AS t
               SET row_id = sub.new_row_id
               FROM (
                   SELECT id, ROW_NUMBER() OVER (ORDER BY row_id) AS new_row_id
                   FROM data.import_data_flat
                   WHERE import_tracking_id = :tracking_id
               ) AS sub
               WHERE t.id = sub.id AND t.row_id != sub.new_row_id";
$bindingsReindex = [':tracking_id' => $trackingId];

$sqlUpdateHeader = "UPDATE data.import_tracking
                    SET rows_imported = rows_imported - 1, run_end_date = now()
                    WHERE id = :tracking_id";
$bindingsHeader = [':tracking_id' => $trackingId];

$this->addQueryInStack($sqlDelete, $bindingsDelete);
$this->addQueryInStack($sqlReindex, $bindingsReindex);
$this->addQueryInStack($sqlUpdateHeader, $bindingsHeader);
$this->tryQueryStack(true);
```

**Response:** Nessuna (void), oppure testata aggiornata se recuperata dopo commit.

**Note:**
- La window function `ROW_NUMBER() OVER (ORDER BY row_id)` rinumera tutti i record da 1 senza buchi
- La condizione `t.row_id != sub.new_row_id` ottimizza l'UPDATE aggiornando solo i record che necessitano rinumerazione
- Tutta la sequenza deve essere atomica per mantenere consistenza

---

## Q9a - Autocomplete Company

**Descrizione:** Ricerca aziende per autocomplete del campo field_04 (company).

**Metodo TraitTryQuery:** `tryQuery()` singola (auto-commit)

**Transazione:** Auto-commit

**SQL:**
```sql
SELECT name
FROM company
WHERE name ILIKE '%' || :subText || '%'
ORDER BY name ASC
LIMIT 20
```

**Parametri:**
- `:subText` (TEXT) - Testo digitato dall'utente (min 2 caratteri)

**Esempio utilizzo PHP:**
```php
$sql = "SELECT name FROM company WHERE name ILIKE '%' || :subText || '%' ORDER BY name ASC LIMIT 20";
$bindings = [':subText' => $searchText];
$stmt = $this->tryQuery($sql, $bindings);
$results = $this->getQueryRecords($stmt);
```

**Response:** Array di oggetti con campo `name`.

**Note:**
- ILIKE = case-insensitive
- LIMIT 20 per evitare result set troppo grandi
- Frontend dovrebbe chiamare solo dopo 2+ caratteri digitati
- Debounce di 1 secondo raccomandato

---

## Q9b - Autocomplete Policy Number

**Descrizione:** Ricerca numeri polizza per autocomplete del campo field_06 (policy_number).

**Metodo TraitTryQuery:** `tryQuery()` singola (auto-commit)

**Transazione:** Auto-commit

**SQL:**
```sql
SELECT code_company
FROM contract
WHERE code_company ILIKE '%' || :subText || '%'
ORDER BY code_company ASC
LIMIT 20
```

**Parametri:**
- `:subText` (TEXT) - Testo digitato dall'utente (min 2 caratteri)

**Esempio utilizzo PHP:**
```php
$sql = "SELECT code_company FROM contract WHERE code_company ILIKE '%' || :subText || '%' ORDER BY code_company ASC LIMIT 20";
$bindings = [':subText' => $searchText];
$stmt = $this->tryQuery($sql, $bindings);
$results = $this->getQueryRecords($stmt);
```

**Response:** Array di oggetti con campo `code_company`.

**Note:**
- ILIKE = case-insensitive
- LIMIT 20 per evitare result set troppo grandi
- Frontend dovrebbe chiamare solo dopo 2+ caratteri digitati
- Debounce di 1 secondo raccomandato

---

## Q9c - Autocomplete Fund

**Descrizione:** Ricerca fondi per autocomplete del campo field_12 (fund_code), restituendo anche description per auto-compilare field_13.

**Metodo TraitTryQuery:** `tryQuery()` singola (auto-commit)

**Transazione:** Auto-commit

**SQL:**
```sql
SELECT code, description
FROM fund
WHERE code ILIKE '%' || :subText || '%'
ORDER BY code ASC
LIMIT 20
```

**Parametri:**
- `:subText` (TEXT) - Testo digitato dall'utente (min 2 caratteri)

**Esempio utilizzo PHP:**
```php
$sql = "SELECT code, description FROM fund WHERE code ILIKE '%' || :subText || '%' ORDER BY code ASC LIMIT 20";
$bindings = [':subText' => $searchText];
$stmt = $this->tryQuery($sql, $bindings);
$results = $this->getQueryRecords($stmt);
```

**Response:** Array di oggetti con campi `code` e `description`.

**Note:**
- ILIKE = case-insensitive
- LIMIT 20 per evitare result set troppo grandi
- Frontend dovrebbe chiamare solo dopo 2+ caratteri digitati
- Debounce di 1 secondo raccomandato
- **Importante:** Quando l'utente seleziona un fund_code, il frontend deve auto-compilare field_13 con il valore di `description` restituito

---

## Riepilogo Query per Operazione

| Operazione | Query Coinvolte | Metodo | Transazione |
|------------|----------------|--------|-------------|
| Lista testate | Q1 | `tryQuery()` | Auto |
| Visualizza record testata | Q2 | `tryQuery()` | Auto |
| Crea testata | Q3 | `tryQuery()` | Auto |
| Modifica filename testata | Q4 (2 query) | `addQueryInStack()` + `tryQueryStack()` | Batch |
| Cancella testata | Q5 (pre-check + delete) | 2× `tryQuery()` | 2× Auto |
| Inserisci record | Q6 (calcolo + INSERT + UPDATE) | `tryQuery()` + `addQueryInStack()` + `tryQueryStack()` | Mixed |
| Modifica record | Q7 (2 query) | `addQueryInStack()` + `tryQueryStack()` | Batch |
| Cancella record | Q8 (3 query) | `addQueryInStack()` + `tryQueryStack()` | Batch |
| Autocomplete company | Q9a | `tryQuery()` | Auto |
| Autocomplete policy | Q9b | `tryQuery()` | Auto |
| Autocomplete fund | Q9c | `tryQuery()` | Auto |

---

## Note sulle Transazioni

### Auto-commit (tryQuery singola)
```php
$stmt = $this->tryQuery($sql, $bindings);
// Commit automatico al termine
```

### Batch Transaction (multi-query)
```php
$this->addQueryInStack($sql1, $bindings1);
$this->addQueryInStack($sql2, $bindings2);
$this->addQueryInStack($sql3, $bindings3);
$this->tryQueryStack(true); // true = transaction
// Se una query fallisce, tutte vengono rollback
```

### Transazione Manuale (raramente necessaria)
```php
$this->beginTransaction();
$this->tryQuery($sql1, $bindings1, false); // false = no auto-commit
$this->tryQuery($sql2, $bindings2, false);
$this->tryQuery('commit'); // Commit esplicito
```

---

## Named Parameters - Best Practices

✅ **CORRETTO:**
```sql
WHERE id = :id
WHERE name ILIKE '%' || :subText || '%'
```

```php
$bindings = [':id' => 123, ':subText' => 'test'];
```

❌ **ERRATO:**
```sql
WHERE id = ?  -- NO posizionali
WHERE name ILIKE :subText  -- NO, mancano wildcards
```

---

## Gestione Errori

Tutte le query possono lanciare `Throwable` in caso di errore SQL o violazione constraint.

**Nel codice PHP:**
```php
try {
    $stmt = $this->tryQuery($sql, $bindings);
    $result = $this->getQueryRecords($stmt);
} catch (Throwable $e) {
    // TraitTryQuery già fa rollback automatico
    // Loggare e propagare o trasformare in risposta JSON errore
    throw new Exception("Errore query: " . $e->getMessage());
}
```

**Per l'API JSON:**
- Catturare eccezioni nel controller Ajax
- Restituire `{success: false, message: "...", exception: "..." (solo se ENV_IS_DEV)}`

---

## Ottimizzazioni

1. **Indici raccomandati:**
   - `data.import_tracking.import_main_id` (già presente presumibilmente)
   - `data.import_data_flat.import_tracking_id` (FK, dovrebbe avere indice)
   - `company.name` (per autocomplete veloce)
   - `contract.code_company` (per autocomplete veloce)
   - `fund.code` (per autocomplete veloce)

2. **LIMIT nelle autocomplete:** Sempre 20 risultati max per evitare overhead.

3. **Window function Q8:** Efficiente per ricalcolo row_id, evita loop applicativi.

4. **RETURNING *:** Utile per ottenere record con campi auto-generati (id, timestamp) senza query aggiuntiva. Purtroppo `tryQueryStack()` non restituisce result set, quindi serve query GET dopo commit per Q6.

---

## Q-NEW-1 — Toggle Stato Testata

**Descrizione:** Alterna lo stato della testata tra 1 e 2.

**Metodo TraitTryQuery:** `tryQuery()` singola (auto-commit)

**SQL:**
```sql
UPDATE data.import_tracking
SET param_import_status_id = :new_status
WHERE id = :id
```

**Parametri:**
- `:new_status` — Nuovo stato (1 o 2)
- `:id` — ID testata

**Pre-check:** Verifica che lo stato corrente sia 1 o 2, altrimenti eccezione.

---

## Q-NEW-2 — Riordinamento Record (Reorder)

**Descrizione:** Aggiorna row_id e field_02 per ogni record secondo il nuovo ordine specificato.

**Metodo TraitTryQuery:** `addQueryInStack()` + `tryQueryStack()` (transazione batch)

**SQL (per ogni ID nell'array):**
```sql
UPDATE data.import_data_flat
SET row_id = :pos, field_02 = :pos_text
WHERE id = :id
```

**Seguito da aggiornamento testata:**
```sql
UPDATE data.import_tracking
SET run_end_date = now()
WHERE id = :tracking_id
```

**Parametri:**
- `:pos` — Nuova posizione (1-based)
- `:pos_text` — Posizione come testo (= :pos::text)
- `:id` — ID del record
- `:tracking_id` — ID testata

---

## Q-NEW-3 — Verifica Testata Modificabile (assertHeaderEditable)

**Descrizione:** Verifica che la testata sia in stato modificabile (param_import_status_id = 1) prima di consentire operazioni CRUD sui record.

**SQL:**
```sql
SELECT param_import_status_id
FROM data.import_tracking
WHERE id = :id
```

**Parametri:**
- `:id` — ID testata

**Logica:** Se `param_import_status_id != 1`, lancia eccezione "Operazione non consentita: la testata non è in stato modificabile".

**Chiamata da:** `RecordManager::create()`, `RecordManager::update()`, `RecordManager::delete()`, `RecordManager::reorder()`, `HeaderManager::updateFilename()`

---

**Fine QUERY_REFERENCE.md**

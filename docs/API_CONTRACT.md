# API Contract — Settimanale

> **Versione:** 3.0
> **Data:** 2026-02-24
> **Progetto:** Import Settimanale — Gestione testate e record operazioni assicurative

---

## Architettura API

Il progetto espone due file Ajax separati per autorizzazioni:

| File | Metodo HTTP | Routing | Autenticazione |
|------|------------|---------|----------------|
| `ajax_import_settimanale_view.php` | **GET** | `?action=<comando>` | Gestita dall'app padre |
| `ajax_import_settimanale_save.php` | **POST** | body JSON `{"action":"<comando>"}` | Gestita dall'app padre |

### Formato Standard Risposte

Tutte le risposte sono in formato JSON con la seguente struttura:

**Successo:**
```json
{
  "success": true,
  "data": <payload>
}
```

**Errore:**
```json
{
  "success": false,
  "message": "<descrizione errore leggibile dall'utente>",
  "exception": "<stack trace completo dell'eccezione>"
}
```

**Note:**
- Il campo `exception` è presente **SOLO** se la costante PHP `ENV_IS_DEV` è `true`.
- In produzione (`ENV_IS_DEV = false`), il campo `exception` viene omesso.

### Codici HTTP

| Codice | Significato |
|--------|-------------|
| 200 | Successo |
| 400 | Parametri mancanti o non validi |
| 404 | Record o testata non trovata |
| 409 | Condizione non soddisfatta (es. cancellazione testata con record) |
| 500 | Errore interno del server |

---

## File GET: ajax_import_settimanale_view.php

### 1. GET ?action=config

**Descrizione:** Restituisce la configurazione completa dell'applicazione, inclusi tipi di record, campi per gruppo e metadati colonne.

**Nota architetturale:** `import_main_id` (1120) e la risoluzione `code → import_record_id` tramite tabella `data.import_record` sono gestiti esclusivamente dal backend. Il frontend lavora solo con i codici stringa (es. `"EMP"`, `"ASV"`).

**Parametri:** Nessuno

**Response Success:**
```json
{
  "success": true,
  "data": {
    "is_dev": true,
    "record_types": [
      {
        "code": "ASV",
        "sign": null,
        "label": "ASV",
        "form_type": "valuation"
      },
      {
        "code": "EMP",
        "sign": "+",
        "label": "EMP",
        "form_type": "positive"
      },
      {
        "code": "VAI",
        "sign": "+",
        "label": "VAI",
        "form_type": "positive"
      },
      {
        "code": "SWI",
        "sign": "+",
        "label": "SWI",
        "form_type": "positive"
      },
      {
        "code": "PSR",
        "sign": "-",
        "label": "PSR",
        "form_type": "negative"
      },
      {
        "code": "TSR",
        "sign": "-",
        "label": "TSR",
        "form_type": "negative"
      },
      {
        "code": "CLM",
        "sign": "-",
        "label": "CLM",
        "form_type": "negative"
      },
      {
        "code": "TRU",
        "sign": "-",
        "label": "TRU",
        "form_type": "negative"
      },
      {
        "code": "DMF",
        "sign": "-",
        "label": "DMF",
        "form_type": "negative"
      },
      {
        "code": "DDC",
        "sign": "-",
        "label": "DDC",
        "form_type": "negative"
      },
      {
        "code": "SWO",
        "sign": "-",
        "label": "SWO",
        "form_type": "negative"
      }
    ],
    "common_fields": [
      {
        "field": "field_01",
        "name": "operation_type",
        "type": "text",
        "input": "automatic"
      },
      {
        "field": "field_02",
        "name": "operation_id",
        "type": "text",
        "input": "automatic"
      },
      {
        "field": "field_04",
        "name": "company",
        "type": "text",
        "input": "autocomplete"
      },
      {
        "field": "field_06",
        "name": "policy_number",
        "type": "text",
        "input": "autocomplete"
      },
      {
        "field": "field_11",
        "name": "fund_type",
        "type": "select",
        "options": ["FD", "FI", "GS"],
        "input": "user"
      },
      {
        "field": "field_12",
        "name": "fund_code",
        "type": "text",
        "input": "autocomplete"
      },
      {
        "field": "field_13",
        "name": "fund_description",
        "type": "text",
        "input": "automatic"
      },
      {
        "field": "field_14",
        "name": "currency",
        "type": "select",
        "options": ["EUR", "CHF", "GBP", "JPY", "USD", "SEK"],
        "default": "EUR",
        "input": "user"
      },
      {
        "field": "field_15",
        "name": "exchange_rate",
        "type": "float",
        "default": "1",
        "input": "user"
      },
      {
        "field": "field_49",
        "name": "operation_date",
        "type": "date",
        "input": "user"
      },
      {
        "field": "field_50",
        "name": "effect_date",
        "type": "date",
        "input": "user"
      }
    ],
    "valuation_fields": [
      {
        "field": "field_36",
        "name": "units_invested",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_38",
        "name": "unit_quotation_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_39",
        "name": "unit_quotation_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_40",
        "name": "asset_value_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_41",
        "name": "asset_value_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      }
    ],
    "positive_fields": [
      {
        "field": "field_16",
        "name": "gross_premium_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_17",
        "name": "gross_premium_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_18",
        "name": "invested_premium_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_19",
        "name": "invested_premium_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_20",
        "name": "entry_fee_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_21",
        "name": "entry_fee_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_22",
        "name": "entry_expenses_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_23",
        "name": "entry_expenses_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_36",
        "name": "units_invested",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_38",
        "name": "unit_quotation_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_39",
        "name": "unit_quotation_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_40",
        "name": "asset_value_cur",
        "type": "float",
        "default": "0",
        "input": "auto_copy",
        "copy_from": "field_18"
      },
      {
        "field": "field_41",
        "name": "asset_value_eur",
        "type": "float",
        "default": "0",
        "input": "auto_copy",
        "copy_from": "field_19"
      }
    ],
    "negative_fields": [
      {
        "field": "field_24",
        "name": "gross_outgoing_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_25",
        "name": "gross_outgoing_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_26",
        "name": "net_outgoing_payment_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_27",
        "name": "net_outgoing_payment_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_28",
        "name": "operation_cost_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_29",
        "name": "operation_cost_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_30",
        "name": "tax_liq_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_31",
        "name": "tax_liq_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_32",
        "name": "bonus_liq_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_33",
        "name": "bonus_liq_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_34",
        "name": "duty_liq_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_35",
        "name": "duty_liq_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_37",
        "name": "units_disinvested",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_38",
        "name": "unit_quotation_cur",
        "type": "float",
        "default": "0",
        "input": "user"
      },
      {
        "field": "field_39",
        "name": "unit_quotation_eur",
        "type": "float",
        "default": "0",
        "input": "calculated"
      },
      {
        "field": "field_40",
        "name": "asset_value_cur",
        "type": "float",
        "default": "0",
        "input": "auto_copy",
        "copy_from": "field_24"
      },
      {
        "field": "field_41",
        "name": "asset_value_eur",
        "type": "float",
        "default": "0",
        "input": "auto_copy",
        "copy_from": "field_25"
      }
    ],
    "header_columns": [
      {
        "field": "run_start_date",
        "label": "Data inserimento",
        "format": "YYYY-MM-DD HH:mm"
      },
      {
        "field": "run_end_date",
        "label": "Data ultima modifica",
        "format": "YYYY-MM-DD HH:mm"
      },
      {
        "field": "filename",
        "label": "Descrizione"
      },
      {
        "field": "status_text",
        "label": "Stato"
      },
      {
        "field": "rows_imported",
        "label": "Inseriti"
      },
      {
        "field": "rows_rejected",
        "label": "Scartati"
      },
      {
        "field": "rows_recovered",
        "label": "Recuperati"
      },
      {
        "field": "last_check_start",
        "label": "Inizio Check",
        "format": "YYYY-MM-DD HH:mm"
      },
      {
        "field": "last_check_end",
        "label": "Fine Check",
        "format": "YYYY-MM-DD HH:mm"
      },
      {
        "field": "last_post_start",
        "label": "Inizio Post",
        "format": "YYYY-MM-DD HH:mm"
      },
      {
        "field": "last_post_end",
        "label": "Fine Post",
        "format": "YYYY-MM-DD HH:mm"
      }
    ]
  }
}
```

**Note sui campi:**
- `is_dev`: booleano che indica se siamo in modalità sviluppo (per mostrare stack trace)
- `record_types`: elenco dei tipi operazione. **Nessun `import_record_id`** — il frontend usa solo il `code` (stringa). Il backend risolve internamente `code → import_record_id` tramite: `SELECT id, code FROM data.import_record WHERE import_main_id = 1120`
  - `sign`: `null` per ASV, `"+"` per operazioni positive (EMP, VAI, SWI), `"-"` per operazioni negative (PSR, TSR, CLM, TRU, DMF, DDC, SWO)
  - `form_type`: `"valuation"` per ASV, `"positive"` per EMP/VAI/SWI, `"negative"` per le altre
- **Campi raggruppati per segno** (non per tipo operazione):
  - `common_fields`: campi presenti in tutti i tipi operazione
  - `valuation_fields`: campi specifici per ASV (form_type = "valuation")
  - `positive_fields`: campi specifici per EMP, VAI, SWI (form_type = "positive")
  - `negative_fields`: campi specifici per PSR, TSR, CLM, TRU, DMF, DDC, SWO (form_type = "negative")
  - `input`: `"user"` (inserito dall'utente), `"calculated"` (calcolato dal backend usando exchange_rate), `"automatic"` (generato automaticamente), `"autocomplete"` (con suggerimenti), `"auto_copy"` (copiato da altro campo)
- `header_columns`: metadati per la visualizzazione tabella testate

---

### 2. GET ?action=headers

**Descrizione:** Restituisce l'elenco di tutte le testate inserite, ordinate per data inserimento decrescente (la più recente prima).

**Parametri:** Nessuno

**Response Success:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "run_start_date": "2024-01-15 10:30",
      "run_end_date": "2024-01-15 14:22",
      "filename": "Import gennaio 2024",
      "status_text": "Iniziale",
      "param_import_status_id": 1,
      "rows_imported": 5,
      "rows_rejected": 0,
      "rows_recovered": 0,
      "last_check_start": null,
      "last_check_end": null,
      "last_post_start": null,
      "last_post_end": null
    }
  ]
}
```

**Note:**
- Massimo 1000 record restituiti
- `status_text` è il testo leggibile dello stato (join con `data.param_import_status`)
- `param_import_status_id` è l'ID numerico dello stato (usato per logica di cancellazione)
- I campi `last_*` sono null se non ancora valorizzati

---

### 3. GET ?action=records&tracking_id=123

**Descrizione:** Restituisce l'elenco di tutti i record associati a una specifica testata, ordinati per `row_id` crescente.

**Parametri:**
- `tracking_id` (integer, required): ID della testata

**Response Success:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "row_id": 1,
      "import_tracking_id": 123,
      "record_type": "EMP",
      "source_filename": "Import gennaio 2024",
      "field_01": "EMP",
      "field_02": "1",
      "field_04": "ABC Insurance",
      "field_06": "POL001",
      "field_11": "FD",
      "field_12": "FND001",
      "field_13": "Global Equity Fund",
      "field_14": "EUR",
      "field_15": "1",
      "field_16": "1000.00",
      "field_17": "1000.00",
      "field_18": "950.00",
      "field_19": "950.00",
      "field_20": "30.00",
      "field_21": "30.00",
      "field_22": "20.00",
      "field_23": "20.00",
      "field_24": null,
      "field_25": null,
      "field_26": null,
      "field_27": null,
      "field_28": null,
      "field_29": null,
      "field_30": null,
      "field_31": null,
      "field_32": null,
      "field_33": null,
      "field_34": null,
      "field_35": null,
      "field_36": "100",
      "field_37": null,
      "field_38": "9.50",
      "field_39": "9.50",
      "field_40": "950.00",
      "field_41": "950.00",
      "field_49": "15/01/2024",
      "field_50": "15/01/2024"
    }
  ]
}
```

**Note:**
- Tutti i campi `field_01` to `field_50` sono di tipo TEXT nel database
- I campi non utilizzati per un tipo operazione sono `null`
- `field_01` contiene il codice tipo operazione (ASV, EMP, etc.)
- `field_02` contiene il `row_id` come testo (progressivo)
- `record_type` è il codice tipo operazione derivato da `field_01` (per comodità frontend)
- I field inutilizzati (field_03, field_05, field_07-10, field_42-48) non vengono restituiti

**Response Error (testata non trovata):**
```json
{
  "success": false,
  "message": "Testata non trovata"
}
```
HTTP Status: 404

---

### 4. GET ?action=autocomplete&field=company&query=abc

**Descrizione:** Fornisce suggerimenti di completamento automatico per i campi che lo supportano (company, policy_number, fund_code).

**Parametri:**
- `field` (string, required): nome del campo (`company`, `policy_number`, `fund_code`)
- `query` (string, required): testo digitato dall'utente (minimo 2 caratteri)

**Response Success (company, policy_number):**
```json
{
  "success": true,
  "data": [
    {
      "value": "ABC Insurance",
      "label": "ABC Insurance"
    }
  ]
}
```

**Response Success (fund_code):**
```json
{
  "success": true,
  "data": [
    {
      "value": "FND001",
      "label": "FND001",
      "description": "Global Equity Fund"
    }
  ]
}
```

**Note:**
- Massimo 20 risultati
- Query minima: 2 caratteri
- Per `fund_code`, il campo `description` viene usato per auto-compilare `field_13` (fund_description)
- La ricerca è case-insensitive e con pattern `ILIKE '%query%'`

**Response Error (query troppo corta):**
```json
{
  "success": false,
  "message": "La query deve contenere almeno 2 caratteri"
}
```
HTTP Status: 400

**Response Error (campo non valido):**
```json
{
  "success": false,
  "message": "Campo non supportato per autocomplete"
}
```
HTTP Status: 400

---

## File POST: ajax_import_settimanale_save.php

Il body della richiesta è in formato JSON. Il campo `action` nel body determina l'operazione.

**Headers richiesti:**
- `Content-Type: application/json`

---

### 5. POST action=header_save

**Descrizione:** Crea una nuova testata o modifica il campo `filename` di una testata esistente.

**Request Body (creazione):**
```json
{
  "action": "header_save",
  "id": null,
  "filename": "Nuovo import febbraio 2024"
}
```

**Request Body (modifica):**
```json
{
  "action": "header_save",
  "id": 123,
  "filename": "Import febbraio 2024 - aggiornato"
}
```

**Response Success (creazione):**
```json
{
  "success": true,
  "data": {
    "id": 124,
    "run_start_date": "2024-02-20 15:30",
    "run_end_date": null,
    "filename": "Nuovo import febbraio 2024",
    "status_text": "Iniziale",
    "param_import_status_id": 1,
    "rows_imported": 0,
    "rows_rejected": 0,
    "rows_recovered": 0,
    "last_check_start": null,
    "last_check_end": null,
    "last_post_start": null,
    "last_post_end": null
  }
}
```

**Note sulla creazione:**
- `import_main_id`: valorizzato a 1120 (fisso, backend-only)
- `param_import_status_id`: valorizzato a 1 (stato "Iniziale")
- `rows_imported`: valorizzato a 0
- `run_start_date`: valorizzato a `NOW()`
- `run_end_date`: valorizzato a `NULL`

**Note sulla modifica:**
- La modifica del `filename` è consentita **solo** se `param_import_status_id = 1`. Il backend verifica questa condizione e restituisce errore 409 se non soddisfatta.
- La modifica del `filename` viene **propagata** a tutti i record figli nel campo `source_filename`
- L'operazione è transazionale (batch): se fallisce l'aggiornamento dei record figli, viene fatto rollback della modifica della testata

---

### 6. POST action=record_save

**Descrizione:** Crea un nuovo record, modifica un record esistente, o duplica un record (possibilmente con cambio tipo).

**Request Body (creazione operazione positiva - EMP):**
```json
{
  "action": "record_save",
  "id": null,
  "import_tracking_id": 123,
  "record_type": "EMP",
  "fields": {
    "field_04": "ABC Insurance",
    "field_06": "POL001",
    "field_11": "FD",
    "field_12": "FND001",
    "field_13": "Global Equity Fund",
    "field_14": "EUR",
    "field_15": "1",
    "field_16": "1000.00",
    "field_18": "950.00",
    "field_20": "30.00",
    "field_22": "20.00",
    "field_36": "100",
    "field_38": "9.50",
    "field_49": "15/01/2024",
    "field_50": "15/01/2024"
  }
}
```

**Request Body (creazione operazione negativa - PSR):**
```json
{
  "action": "record_save",
  "id": null,
  "import_tracking_id": 123,
  "record_type": "PSR",
  "fields": {
    "field_04": "XYZ Insurance",
    "field_06": "POL002",
    "field_11": "FI",
    "field_12": "FND002",
    "field_13": "Fixed Income Fund",
    "field_14": "USD",
    "field_15": "1.1",
    "field_24": "500.00",
    "field_26": "480.00",
    "field_28": "10.00",
    "field_30": "5.00",
    "field_32": "0.00",
    "field_34": "5.00",
    "field_37": "50",
    "field_38": "10.00",
    "field_49": "20/01/2024",
    "field_50": "20/01/2024"
  }
}
```

**Request Body (modifica):**
```json
{
  "action": "record_save",
  "id": 456,
  "import_tracking_id": 123,
  "record_type": "EMP",
  "fields": {
    "field_04": "ABC Insurance Ltd",
    "field_06": "POL001",
    "field_11": "FD",
    "field_12": "FND001",
    "field_13": "Global Equity Fund",
    "field_14": "EUR",
    "field_15": "1",
    "field_16": "1200.00",
    "field_18": "1150.00",
    "field_20": "30.00",
    "field_22": "20.00",
    "field_36": "120",
    "field_38": "9.58",
    "field_49": "15/01/2024",
    "field_50": "15/01/2024"
  }
}
```

**Note:**
- Il frontend passa `record_type` come codice stringa (es. `"EMP"`, `"PSR"`, `"ASV"`)
- Il backend risolve il codice in `import_record_id` tramite la tabella `data.import_record`

**Guardia stato testata:**
- Le operazioni di creazione e modifica record sono consentite **solo** se la testata ha `param_import_status_id = 1`. Il backend verifica questa condizione e restituisce errore 409 se non soddisfatta.

**Response Success:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "row_id": 1,
    "import_tracking_id": 123,
    "record_type": "EMP",
    "source_filename": "Import gennaio 2024",
    "field_01": "EMP",
    "field_02": "1",
    "field_04": "ABC Insurance Ltd",
    "field_06": "POL001",
    "field_11": "FD",
    "field_12": "FND001",
    "field_13": "Global Equity Fund",
    "field_14": "EUR",
    "field_15": "1",
    "field_16": "1200.00",
    "field_17": "1200.00",
    "field_18": "1150.00",
    "field_19": "1150.00",
    "field_20": "30.00",
    "field_21": "30.00",
    "field_22": "20.00",
    "field_23": "20.00",
    "field_36": "120",
    "field_38": "9.58",
    "field_39": "9.58",
    "field_40": "1150.00",
    "field_41": "1150.00",
    "field_49": "15/01/2024",
    "field_50": "15/01/2024"
  }
}
```

**Note sulla creazione:**
- `row_id`: calcolato come `MAX(row_id) + 1` per la testata specifica
- `field_01` (operation_type): popolato automaticamente dal backend in base a `record_type`
- `field_02` (operation_id): uguale a `row_id` (come testo)
- `source_filename`: copiato dal campo `filename` della testata
- I campi `*_eur` (field_17, field_19, field_21, field_23, field_25, field_27, field_29, field_31, field_33, field_35, field_39, field_41) sono **calcolati dal backend** con la formula: `valore_cur * exchange_rate`
- I campi `auto_copy`:
  - Positive (EMP, VAI, SWI): `field_40 = field_18`, `field_41 = field_19`
  - Negative (PSR, TSR, CLM, TRU, DMF, DDC, SWO): `field_40 = field_24`, `field_41 = field_25`
- Nella testata viene aggiornato atomicamente:
  - `rows_imported` incrementato di 1
  - `run_end_date` valorizzato a `NOW()`

**Note sulla modifica:**
- `row_id` e `field_02` non cambiano
- I campi `*_eur` vengono ricalcolati
- I campi `auto_copy` vengono ricalcolati
- Nella testata viene aggiornato atomicamente:
  - `run_end_date` valorizzato a `NOW()`
  - `rows_imported` non cambia

**L'operazione è transazionale:**
- Insert/update record + update testata in un'unica transazione
- Se fallisce l'aggiornamento della testata, viene fatto rollback dell'insert/update del record

**Response Error (testata non trovata):**
```json
{
  "success": false,
  "message": "Testata non trovata"
}
```
HTTP Status: 404

**Response Error (tipo record non valido):**
```json
{
  "success": false,
  "message": "Tipo record non valido"
}
```
HTTP Status: 400

**Response Error (campi obbligatori mancanti):**
```json
{
  "success": false,
  "message": "Campi obbligatori mancanti: field_04, field_06"
}
```
HTTP Status: 400

---

### 7. POST action=record_delete

**Descrizione:** Cancella un record esistente, ricalcola i `row_id` dei record rimanenti (senza buchi) e aggiorna la testata.

**Request Body:**
```json
{
  "action": "record_delete",
  "id": 456,
  "import_tracking_id": 123
}
```

**Guardia stato testata:**
- Le operazioni di creazione e modifica record sono consentite **solo** se la testata ha `param_import_status_id = 1`. Il backend verifica questa condizione e restituisce errore 409 se non soddisfatta.

**Response Success:**
```json
{
  "success": true,
  "data": {
    "deleted_id": 456,
    "updated_header": {
      "id": 123,
      "run_start_date": "2024-01-15 10:30",
      "run_end_date": "2024-02-20 16:45",
      "filename": "Import gennaio 2024",
      "status_text": "Iniziale",
      "param_import_status_id": 1,
      "rows_imported": 4,
      "rows_rejected": 0,
      "rows_recovered": 0,
      "last_check_start": null,
      "last_check_end": null,
      "last_post_start": null,
      "last_post_end": null
    }
  }
}
```

**Note:**
- Dopo la cancellazione del record, i `row_id` dei record rimanenti vengono **ricalcolati senza buchi** usando una window function PostgreSQL
- Anche il campo `field_02` (operation_id) viene aggiornato per rispecchiare il nuovo `row_id`
- Nella testata viene aggiornato atomicamente:
  - `rows_imported` decrementato di 1
  - `run_end_date` valorizzato a `NOW()`

**L'operazione è transazionale (batch):**
1. DELETE del record
2. UPDATE dei `row_id` e `field_02` dei record rimanenti (con window function)
3. UPDATE della testata

Se fallisce uno step, viene fatto rollback di tutta l'operazione.

---

### 8. POST action=record_reorder

**Descrizione:** Riordina i record di una testata secondo un ordine specificato, aggiornando `row_id` e `field_02`.

**Request Body:**
```json
{
  "action": "record_reorder",
  "import_tracking_id": 123,
  "ordered_ids": [456, 459, 457, 458]
}
```

**Response Success:**
```json
{
  "success": true,
  "data": {
    "reordered": true
  }
}
```

**Note:**
- L'ordine dei record viene aggiornato in base all'ordine degli ID nell'array `ordered_ids`
- `row_id` e `field_02` vengono aggiornati per riflettere la nuova posizione
- La testata `run_end_date` viene aggiornata a `NOW()`
- Consentito **solo** se `param_import_status_id = 1`
- L'operazione è transazionale

---

### 9. POST action=header_toggle_status

**Descrizione:** Alterna lo stato della testata tra 1 (aperta/modificabile) e 2 (chiusa/bloccata).

**Request Body:**
```json
{
  "action": "header_toggle_status",
  "id": 123
}
```

**Response Success:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "run_start_date": "2024-01-15 10:30",
    "run_end_date": "2024-02-20 16:45",
    "filename": "Import gennaio 2024",
    "status_text": "Validato",
    "param_import_status_id": 2,
    "rows_imported": 5,
    "rows_rejected": 0,
    "rows_recovered": 0,
    "last_check_start": null,
    "last_check_end": null,
    "last_post_start": null,
    "last_post_end": null
  }
}
```

**Note:**
- Alterna tra stato 1 → 2 e 2 → 1
- Per stati diversi da 1 e 2, restituisce errore

**Response Error (stato non modificabile):**
```json
{
  "success": false,
  "message": "Cambio stato non consentito: lo stato corrente (3) non è modificabile"
}
```
HTTP Status: 409

---

## Duplicazione con Cambio Tipo Record

### Comportamento Frontend

Nella modale di duplicazione, l'utente può **cambiare il tipo di record** prima di salvare.

**Regole di comportamento:**

1. **Stesso gruppo (form_type):** Se il tipo viene cambiato all'interno dello stesso gruppo (es. da EMP a VAI, entrambi `positive`), tutti i campi vengono mantenuti. Cambia solo `field_01` (operation_type).

2. **Gruppo diverso (form_type diverso):** Se si passa a un gruppo diverso (es. da EMP `positive` a PSR `negative`, oppure da ASV `valuation` a EMP `positive`):
   - I **campi comuni** (`common_fields`) vengono mantenuti con i valori precedenti
   - I **campi specifici** del vecchio gruppo vengono rimossi
   - I **campi specifici** del nuovo gruppo vengono inizializzati ai loro valori di default

**Nota:** La duplicazione è implementata interamente nel frontend. Al backend arriva una normale `record_save` con `id: null` e il `record_type` scelto.

### Gruppi di Appartenenza

| form_type | Tipi Record | Campi Specifici |
|-----------|-------------|-----------------|
| valuation | ASV | `valuation_fields` |
| positive | EMP, VAI, SWI | `positive_fields` |
| negative | PSR, TSR, CLM, TRU, DMF, DDC, SWO | `negative_fields` |

---

## Validazioni Warning (Frontend)

Le validazioni sono **calcolate dal frontend** e mostrate come warning all'utente. **NON bloccano il salvataggio**: l'utente può comunque procedere anche se i warning sono presenti.

Il backend **salva sempre** i dati ricevuti senza applicare queste validazioni.

### Formule di Validazione

**1. ASV (Valorizzazione):**
```
field_36 x field_38 != field_40
```
Warning: "Il prodotto units_invested x unit_quotation_cur non corrisponde ad asset_value_cur"

**2. Positive (EMP, VAI, SWI):**

Formula 1:
```
field_16 - field_18 != field_20 + field_22
```
Warning: "La differenza gross_premium_cur - invested_premium_cur non corrisponde alla somma entry_fee_cur + entry_expenses_cur"

Formula 2:
```
field_36 x field_38 != field_18
```
Warning: "Il prodotto units_invested x unit_quotation_cur non corrisponde a invested_premium_cur"

**3. Negative (PSR, TSR, CLM, TRU, DMF, DDC, SWO):**

Formula 1:
```
field_24 - field_26 != field_28 + field_30 + field_34 - field_32
```
Warning: "La differenza gross_outgoing_cur - net_outgoing_payment_cur non corrisponde alla somma operation_cost_cur + tax_liq_cur + duty_liq_cur - bonus_liq_cur"

Formula 2:
```
field_37 x field_38 != field_24
```
Warning: "Il prodotto units_disinvested x unit_quotation_cur non corrisponde a gross_outgoing_cur"

---

## Condizioni di Cancellazione Testata

Una testata può essere cancellata **SOLO** se entrambe le condizioni sono soddisfatte:

1. `rows_imported = 0` (nessun record associato)
2. `param_import_status_id = 1` (stato "Iniziale")

Il frontend deve mostrare l'icona cestino **sempre visibile**. Se entrambe le condizioni sono vere, l'icona e' attiva (rossa, cliccabile); altrimenti e' disabilitata (grigia) e al click mostra un toast "Impossibile eliminare un'importazione bloccata o contenente delle righe".

Il backend deve verificare le condizioni prima di procedere con la cancellazione:

**Response Error (condizioni non soddisfatte):**
```json
{
  "success": false,
  "message": "La testata può essere cancellata solo se è vuota (rows_imported=0) e in stato Iniziale (param_import_status_id=1)"
}
```
HTTP Status: 409 (Conflict)

---

## Risoluzione Backend: code -> import_record_id

Il backend mantiene internamente la mappatura tra codice tipo e ID record, caricata da:
```sql
SELECT id, code FROM data.import_record WHERE import_main_id = 1120
```

| code | import_record_id |
|------|------------------|
| ASV | 112006 |
| EMP | 112005 |
| VAI | 112007 |
| SWI | 112009 |
| PSR | 112010 |
| TSR | 112011 |
| CLM | 112012 |
| TRU | 112013 |
| DMF | 112014 |
| DDC | 112015 |
| SWO | 112008 |

---

## Note Implementative

### Calcolo Campi EUR

Formula applicata dal backend per tutti i campi `*_eur`:
```
valore_eur = valore_cur * exchange_rate
```

### Campi Auto-Copy

**Positive (EMP, VAI, SWI):**
- `field_40 = field_18` (asset_value_cur = invested_premium_cur)
- `field_41 = field_19` (asset_value_eur = invested_premium_eur)

**Negative (PSR, TSR, CLM, TRU, DMF, DDC, SWO):**
- `field_40 = field_24` (asset_value_cur = gross_outgoing_cur)
- `field_41 = field_25` (asset_value_eur = gross_outgoing_eur)

### Ricalcolo row_id con Window Function

```sql
UPDATE data.import_data_flat AS t
SET
  row_id = sub.new_row_id,
  field_02 = sub.new_row_id::text
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY row_id) AS new_row_id
  FROM data.import_data_flat
  WHERE import_tracking_id = :tracking_id
) AS sub
WHERE t.id = sub.id AND t.row_id != sub.new_row_id;
```

### Formato Date DD/MM/YYYY

Le date `field_49` (operation_date) e `field_50` (effect_date) sono memorizzate nel database come testo in formato DD/MM/YYYY.

Il frontend usa Flatpickr con `dateFormat: "d/m/Y"` per l'input date.

Il backend valida il formato con regex `^\d{2}/\d{2}/\d{4}$` e restituisce errore se non conforme.

### Formattazione Numeri

I campi float (field_15, field_16-field_41) vengono formattati con 2 decimali nella risposta API con `number_format($val, 2, '.', '')`.

### Guardia Stato Testata (Backend)

Il metodo `assertHeaderEditable()` in `RecordManager` verifica che la testata abbia `param_import_status_id = 1` prima di consentire operazioni di:
- Creazione record (`create`)
- Modifica record (`update`)
- Cancellazione record (`delete`)
- Riordinamento record (`reorder`)

Il metodo `updateFilename()` in `HeaderManager` effettua lo stesso controllo.

---

## Glossario Campi

### Campi Comuni (tutti i tipi)

| Field | Name | Tipo | Input | Note |
|-------|------|------|-------|------|
| field_01 | operation_type | text | automatic | Codice tipo (ASV, EMP, etc.) |
| field_02 | operation_id | text | automatic | = row_id come testo |
| field_04 | company | text | autocomplete | Nome compagnia assicurativa |
| field_06 | policy_number | text | autocomplete | Numero polizza |
| field_11 | fund_type | select | user | FD, FI, GS |
| field_12 | fund_code | text | autocomplete | Codice fondo |
| field_13 | fund_description | text | automatic | Descrizione fondo (da autocomplete) |
| field_14 | currency | select | user | EUR, CHF, GBP, JPY, USD, SEK |
| field_15 | exchange_rate | float | user | Tasso di cambio (default 1) |
| field_49 | operation_date | date | user | Data operazione |
| field_50 | effect_date | date | user | Data effetto |

### Campi Valuation (ASV)

| Field | Name | Tipo | Input | Note |
|-------|------|------|-------|------|
| field_36 | units_invested | float | user | Quote investite |
| field_38 | unit_quotation_cur | float | user | Quotazione quota (valuta) |
| field_39 | unit_quotation_eur | float | calculated | Quotazione quota (EUR) |
| field_40 | asset_value_cur | float | user | Valore asset (valuta) |
| field_41 | asset_value_eur | float | calculated | Valore asset (EUR) |

### Campi Positive (EMP, VAI, SWI)

| Field | Name | Tipo | Input | Note |
|-------|------|------|-------|------|
| field_16 | gross_premium_cur | float | user | Premio lordo (valuta) |
| field_17 | gross_premium_eur | float | calculated | Premio lordo (EUR) |
| field_18 | invested_premium_cur | float | user | Premio investito (valuta) |
| field_19 | invested_premium_eur | float | calculated | Premio investito (EUR) |
| field_20 | entry_fee_cur | float | user | Commissioni ingresso (valuta) |
| field_21 | entry_fee_eur | float | calculated | Commissioni ingresso (EUR) |
| field_22 | entry_expenses_cur | float | user | Spese ingresso (valuta) |
| field_23 | entry_expenses_eur | float | calculated | Spese ingresso (EUR) |
| field_36 | units_invested | float | user | Quote investite |
| field_38 | unit_quotation_cur | float | user | Quotazione quota (valuta) |
| field_39 | unit_quotation_eur | float | calculated | Quotazione quota (EUR) |
| field_40 | asset_value_cur | float | auto_copy | = field_18 |
| field_41 | asset_value_eur | float | auto_copy | = field_19 |

### Campi Negative (PSR, TSR, CLM, TRU, DMF, DDC, SWO)

| Field | Name | Tipo | Input | Note |
|-------|------|------|-------|------|
| field_24 | gross_outgoing_cur | float | user | Uscita lorda (valuta) |
| field_25 | gross_outgoing_eur | float | calculated | Uscita lorda (EUR) |
| field_26 | net_outgoing_payment_cur | float | user | Pagamento netto (valuta) |
| field_27 | net_outgoing_payment_eur | float | calculated | Pagamento netto (EUR) |
| field_28 | operation_cost_cur | float | user | Costi operazione (valuta) |
| field_29 | operation_cost_eur | float | calculated | Costi operazione (EUR) |
| field_30 | tax_liq_cur | float | user | Tasse liquidazione (valuta) |
| field_31 | tax_liq_eur | float | calculated | Tasse liquidazione (EUR) |
| field_32 | bonus_liq_cur | float | user | Bonus liquidazione (valuta) |
| field_33 | bonus_liq_eur | float | calculated | Bonus liquidazione (EUR) |
| field_34 | duty_liq_cur | float | user | Imposte liquidazione (valuta) |
| field_35 | duty_liq_eur | float | calculated | Imposte liquidazione (EUR) |
| field_37 | units_disinvested | float | user | Quote disinvestite |
| field_38 | unit_quotation_cur | float | user | Quotazione quota (valuta) |
| field_39 | unit_quotation_eur | float | calculated | Quotazione quota (EUR) |
| field_40 | asset_value_cur | float | auto_copy | = field_24 |
| field_41 | asset_value_eur | float | auto_copy | = field_25 |

---

## Dipendenze CDN Aggiuntive

| Risorsa | URL | Versione | Uso |
|---------|-----|----------|-----|
| Flatpickr CSS | `cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css` | latest | Stile date picker |
| Flatpickr JS | `cdn.jsdelivr.net/npm/flatpickr` | latest | Date picker DD/MM/YYYY |
| SortableJS | `cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js` | 1.15.0 | Drag-and-drop record |

---

## Changelog

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0 | 2024-02-20 | Versione iniziale completa |
| 2.0 | 2026-02-20 | Rimosso import_main_id e import_record_id dal frontend. Campi raggruppati per segno. Aggiunta duplicazione con cambio tipo. Backend risolve code→id via data.import_record |
| 3.0 | 2026-02-24 | Aggiunti endpoint record_reorder e header_toggle_status. Aggiunta guardia stato testata. Format date DD/MM/YYYY. Formattazione numeri 2 decimali. Dipendenze Flatpickr e SortableJS |

---

**Fine Documento**

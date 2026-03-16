# SCHEMA_REFERENCE.md

Documentazione completa dello schema database per l'applicazione Settimanale.

---

## Tabelle Principali

### data.import_tracking (Testate)

Tabella che memorizza le testate degli import settimanali.

| Colonna | Tipo | Constraint | Descrizione | Gestione |
|---------|------|------------|-------------|----------|
| `id` | SERIAL | PRIMARY KEY | Chiave primaria autogenerata | Auto |
| `import_main_id` | INTEGER | NOT NULL | Identificatore fisso per questo tipo di import | Fisso = 1120 |
| `param_import_status_id` | INTEGER | FK → data.param_import_status.id | Stato dell'import | Default = 1 |
| `rows_imported` | INTEGER | NOT NULL | Numero di record inseriti | Default = 0, ±1 per insert/delete record |
| `rows_rejected` | INTEGER | | Numero di record scartati dal check | **Sola lettura** (gestito esternamente) |
| `rows_recovered` | INTEGER | | Numero di record recuperati | **Sola lettura** (gestito esternamente) |
| `run_start_date` | TIMESTAMP | NOT NULL | Data di creazione della testata | now() alla creazione |
| `run_end_date` | TIMESTAMP | | Data di ultima modifica | null alla creazione, now() ad ogni modifica record |
| `filename` | TEXT | | Descrizione libera (ex nome file) | **Modificabile dall'utente** |
| `last_check_start` | TIMESTAMP | | Inizio elaborazione check | **Sola lettura** (gestito esternamente) |
| `last_check_end` | TIMESTAMP | | Fine elaborazione check | **Sola lettura** (gestito esternamente) |
| `last_post_start` | TIMESTAMP | | Inizio elaborazione post | **Sola lettura** (gestito esternamente) |
| `last_post_end` | TIMESTAMP | | Fine elaborazione post | **Sola lettura** (gestito esternamente) |

**Regole di business:**
- Alla creazione: `import_main_id=1120`, `param_import_status_id=1`, `rows_imported=0`, `run_start_date=now()`, `run_end_date=null`
- Ad ogni inserimento/modifica/cancellazione record: `run_end_date=now()`
- Ad ogni inserimento record: `rows_imported += 1`
- Ad ogni cancellazione record: `rows_imported -= 1`
- Modifica `filename`: propagare a `source_filename` di tutti i record figli
- Cancellazione permessa solo se `rows_imported=0` AND `param_import_status_id=1`

---

### data.import_data_flat (Record)

Tabella che memorizza i record di dettaglio per ogni testata.

| Colonna | Tipo | Constraint | Descrizione | Gestione |
|---------|------|------------|-------------|----------|
| `id` | SERIAL | PRIMARY KEY | Chiave primaria autogenerata | Auto |
| `import_tracking_id` | INTEGER | FK → data.import_tracking.id | Riferimento alla testata | Impostato all'inserimento |
| `row_id` | INTEGER | NOT NULL | Progressivo del record (da 1) | Calcolato, ricalcolato dopo delete |
| `import_record_id` | INTEGER | NOT NULL | Tipo di record (112005-112015) | Scelto dall'utente |
| `source_filename` | TEXT | | Copia del filename dalla testata | Uguale a `import_tracking.filename` |
| `field_01` | TEXT | | operation_type | Vedi mapping sotto |
| `field_02` | TEXT | | operation_id | Vedi mapping sotto |
| `field_03` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_04` | TEXT | | company | Vedi mapping sotto |
| `field_05` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_06` | TEXT | | policy_number | Vedi mapping sotto |
| `field_07` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_08` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_09` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_10` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_11` | TEXT | | fund_type | Vedi mapping sotto |
| `field_12` | TEXT | | fund_code | Vedi mapping sotto |
| `field_13` | TEXT | | fund_description | Vedi mapping sotto |
| `field_14` | TEXT | | currency | Vedi mapping sotto |
| `field_15` | TEXT | | exchange_rate | Vedi mapping sotto |
| `field_16` | TEXT | | gross_premium_cur | Vedi mapping sotto |
| `field_17` | TEXT | | gross_premium_eur | Vedi mapping sotto |
| `field_18` | TEXT | | invested_premium_cur | Vedi mapping sotto |
| `field_19` | TEXT | | invested_premium_eur | Vedi mapping sotto |
| `field_20` | TEXT | | entry_fee_cur | Vedi mapping sotto |
| `field_21` | TEXT | | entry_fee_eur | Vedi mapping sotto |
| `field_22` | TEXT | | entry_expenses_cur | Vedi mapping sotto |
| `field_23` | TEXT | | entry_expenses_eur | Vedi mapping sotto |
| `field_24` | TEXT | | gross_outgoing_cur | Vedi mapping sotto |
| `field_25` | TEXT | | gross_outgoing_eur | Vedi mapping sotto |
| `field_26` | TEXT | | net_outgoing_payment_cur | Vedi mapping sotto |
| `field_27` | TEXT | | net_outgoing_payment_eur | Vedi mapping sotto |
| `field_28` | TEXT | | operation_cost_cur | Vedi mapping sotto |
| `field_29` | TEXT | | operation_cost_eur | Vedi mapping sotto |
| `field_30` | TEXT | | tax_liq_cur | Vedi mapping sotto |
| `field_31` | TEXT | | tax_liq_eur | Vedi mapping sotto |
| `field_32` | TEXT | | bonus_liq_cur | Vedi mapping sotto |
| `field_33` | TEXT | | bonus_liq_eur | Vedi mapping sotto |
| `field_34` | TEXT | | duty_liq_cur | Vedi mapping sotto |
| `field_35` | TEXT | | duty_liq_eur | Vedi mapping sotto |
| `field_36` | TEXT | | units_invested | Vedi mapping sotto |
| `field_37` | TEXT | | units_disinvested | Vedi mapping sotto |
| `field_38` | TEXT | | unit_quotation_cur | Vedi mapping sotto |
| `field_39` | TEXT | | unit_quotation_eur | Vedi mapping sotto |
| `field_40` | TEXT | | asset_value_cur | Vedi mapping sotto |
| `field_41` | TEXT | | asset_value_eur | Vedi mapping sotto |
| `field_42` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_43` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_44` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_45` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_46` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_47` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_48` | TEXT | | *Inutilizzato in questo contesto* | |
| `field_49` | TEXT | | operation_date | Vedi mapping sotto |
| `field_50` | TEXT | | effect_date | Vedi mapping sotto |

**Regole di business:**
- `row_id` parte da 1 e viene calcolato come `MAX(row_id) + 1` all'inserimento
- Dopo una cancellazione, tutti i `row_id` vengono ricalcolati senza buchi usando `ROW_NUMBER() OVER (ORDER BY row_id)`
- `source_filename` deve sempre corrispondere a `import_tracking.filename`

---

### data.param_import_status (Lookup Stati)

Tabella di lookup per gli stati dell'import.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | INTEGER | Chiave primaria |
| `description_2` | TEXT | Descrizione testuale dello stato |

**Nota:** Valore iniziale per nuove testate = 1

---

### Tabelle Autocomplete

#### company (Autocomplete Azienda)

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `name` | TEXT | Nome dell'azienda |

**Utilizzo:** Autocomplete per `field_04` (company)

---

#### contract (Autocomplete Polizza)

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `code_company` | TEXT | Numero polizza |

**Utilizzo:** Autocomplete per `field_06` (policy_number)

---

#### fund (Autocomplete Fondo)

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `code` | TEXT | Codice del fondo |
| `description` | TEXT | Descrizione del fondo |

**Utilizzo:** Autocomplete per `field_12` (fund_code), con auto-compilazione di `field_13` (fund_description)

---

## MAPPING COMPLETO field_01–field_50

### Tabella di Mapping Tipi Record

| import_record_id | Codice | Descrizione | Categoria |
|------------------|--------|-------------|-----------|
| 112005 | EMP | Employer Premium | Positivo |
| 112006 | ASV | Asset Value | Valorizzazione |
| 112007 | VAI | Voluntary Additional Investment | Positivo |
| 112008 | SWO | Switch Out | Negativo |
| 112009 | SWI | Switch In | Positivo |
| 112010 | PSR | Partial Surrender | Negativo |
| 112011 | TSR | Total Surrender | Negativo |
| 112012 | CLM | Claim | Negativo |
| 112013 | TRU | Transfer Out | Negativo |
| 112014 | DMF | Death Management Fee | Negativo |
| 112015 | DDC | Death Duty Claim | Negativo |

---

### Campi Comuni a TUTTI i Tipi Record

| Field | Nome Logico | Tipo Input | Default | Validazione | Note |
|-------|-------------|------------|---------|-------------|------|
| `field_01` | operation_type | Auto | Codice tipo record | - | Corrisponde al tipo record scelto (EMP, ASV, etc.) |
| `field_02` | operation_id | Auto | = row_id | - | Coincide con row_id |
| `field_04` | company | Autocomplete | - | Obbligatorio | Suggerimenti da tabella `company` |
| `field_06` | policy_number | Autocomplete | - | Obbligatorio | Suggerimenti da tabella `contract` |
| `field_11` | fund_type | Dropdown | - | Obbligatorio | Valori: FD, FI, GS |
| `field_12` | fund_code | Autocomplete | - | Obbligatorio | Suggerimenti da tabella `fund` |
| `field_13` | fund_description | Auto | Da fund_code | - | Auto-compilato dalla selezione fund_code |
| `field_14` | currency | Dropdown | EUR | Obbligatorio | Valori: EUR, CHF, GBP, JPY, USD, SEK |
| `field_15` | exchange_rate | Float | 1 | > 0 | Tasso di cambio |
| `field_49` | operation_date | Date | - | DD/MM/YYYY | Data operazione (Flatpickr) |
| `field_50` | effect_date | Date | - | DD/MM/YYYY | Data effetto (Flatpickr) |

**Formula conversione valuta:**
```
valore_eur = valore_cur × exchange_rate
```

---

### Campi Specifici ASV (Valorizzazione) - import_record_id = 112006

| Field | Nome Logico | Tipo Input | Default | Calcolo | Note |
|-------|-------------|------------|---------|---------|------|
| `field_36` | units_invested | Float | 0 | - | Quote investite |
| `field_38` | unit_quotation_cur | Float | 0 | - | Quotazione unitaria in valuta |
| `field_39` | unit_quotation_eur | Auto | - | = field_38 × field_15 | Quotazione unitaria in EUR |
| `field_40` | asset_value_cur | Float | 0 | - | Valore asset in valuta |
| `field_41` | asset_value_eur | Auto | - | = field_40 × field_15 | Valore asset in EUR |

**Validazione (Warning non bloccante):**
- Se `field_36 × field_38 ≠ field_40`: segnalare errore ma permettere salvataggio

---

### Campi Specifici Operazioni POSITIVE - import_record_id = 112005, 112007, 112009 (EMP, VAI, SWI)

| Field | Nome Logico | Tipo Input | Default | Calcolo | Note |
|-------|-------------|------------|---------|---------|------|
| `field_16` | gross_premium_cur | Float | 0 | - | Premio lordo in valuta |
| `field_17` | gross_premium_eur | Auto | - | = field_16 × field_15 | Premio lordo in EUR |
| `field_18` | invested_premium_cur | Float | 0 | - | Premio investito in valuta |
| `field_19` | invested_premium_eur | Auto | - | = field_18 × field_15 | Premio investito in EUR |
| `field_20` | entry_fee_cur | Float | 0 | - | Commissione di ingresso in valuta |
| `field_21` | entry_fee_eur | Auto | - | = field_20 × field_15 | Commissione di ingresso in EUR |
| `field_22` | entry_expenses_cur | Float | 0 | - | Spese di ingresso in valuta |
| `field_23` | entry_expenses_eur | Auto | - | = field_22 × field_15 | Spese di ingresso in EUR |
| `field_36` | units_invested | Float | 0 | - | Quote investite |
| `field_38` | unit_quotation_cur | Float | 0 | - | Quotazione unitaria in valuta |
| `field_39` | unit_quotation_eur | Auto | - | = field_38 × field_15 | Quotazione unitaria in EUR |
| `field_40` | asset_value_cur | Auto | - | = field_18 | Valore asset = premio investito |
| `field_41` | asset_value_eur | Auto | - | = field_19 | Valore asset EUR = premio investito EUR |

**Validazioni (Warning non bloccanti):**
- Se `(field_16 - field_18) ≠ (field_20 + field_22)`: differenza tra lordo e investito non corrisponde alle spese
- Se `field_36 × field_38 ≠ field_18`: prodotto quote × quotazione non corrisponde al premio investito

---

### Campi Specifici Operazioni NEGATIVE - import_record_id = 112008, 112010, 112011, 112012, 112013, 112014, 112015

(SWO, PSR, TSR, CLM, TRU, DMF, DDC)

| Field | Nome Logico | Tipo Input | Default | Calcolo | Note |
|-------|-------------|------------|---------|---------|------|
| `field_24` | gross_outgoing_cur | Float | 0 | - | Uscita lorda in valuta |
| `field_25` | gross_outgoing_eur | Auto | - | = field_24 × field_15 | Uscita lorda in EUR |
| `field_26` | net_outgoing_payment_cur | Float | 0 | - | Pagamento netto in uscita in valuta |
| `field_27` | net_outgoing_payment_eur | Auto | - | = field_26 × field_15 | Pagamento netto in uscita in EUR |
| `field_28` | operation_cost_cur | Float | 0 | - | Costo operazione in valuta |
| `field_29` | operation_cost_eur | Auto | - | = field_28 × field_15 | Costo operazione in EUR |
| `field_30` | tax_liq_cur | Float | 0 | - | Tasse liquidazione in valuta |
| `field_31` | tax_liq_eur | Auto | - | = field_30 × field_15 | Tasse liquidazione in EUR |
| `field_32` | bonus_liq_cur | Float | 0 | - | Bonus liquidazione in valuta |
| `field_33` | bonus_liq_eur | Auto | - | = field_32 × field_15 | Bonus liquidazione in EUR |
| `field_34` | duty_liq_cur | Float | 0 | - | Imposta liquidazione in valuta |
| `field_35` | duty_liq_eur | Auto | - | = field_34 × field_15 | Imposta liquidazione in EUR |
| `field_37` | units_disinvested | Float | 0 | - | Quote disinvestite |
| `field_38` | unit_quotation_cur | Float | 0 | - | Quotazione unitaria in valuta |
| `field_39` | unit_quotation_eur | Auto | - | = field_38 × field_15 | Quotazione unitaria in EUR |
| `field_40` | asset_value_cur | Auto | - | = field_24 | Valore asset = uscita lorda |
| `field_41` | asset_value_eur | Auto | - | = field_25 | Valore asset EUR = uscita lorda EUR |

**Validazioni (Warning non bloccanti):**
- Se `(field_24 - field_26) ≠ (field_28 + field_30 + field_34 - field_32)`: differenza non corrisponde a spese meno bonus
- Se `field_37 × field_38 ≠ field_24`: prodotto quote × quotazione non corrisponde all'uscita lorda

---

### Campi Inutilizzati

I seguenti field **NON sono utilizzati** in questo contesto:

`field_03`, `field_05`, `field_07`, `field_08`, `field_09`, `field_10`, `field_42`, `field_43`, `field_44`, `field_45`, `field_46`, `field_47`, `field_48`

---

## Colonne da Visualizzare (Ordine di Presentazione)

Ordine di visualizzazione nella tabella dei record. Per le colonne con notazione `fieldX/fieldY`, mostrare:
- `fieldX` per operazioni positive e ASV
- `fieldY` per operazioni negative
- Cella vuota se non applicabile

**Ordine colonne:**
```
field_02  (operation_id)
field_01  (operation_type)
field_04  (company)
field_06  (policy_number)
field_11  (fund_type)
field_12  (fund_code)
field_13  (fund_description)
field_14  (currency)
field_15  (exchange_rate)
field_49  (operation_date)
field_50  (effect_date)
field_36/field_37  (units_invested / units_disinvested)
field_38  (unit_quotation_cur)
field_39  (unit_quotation_eur)
field_40  (asset_value_cur)
field_41  (asset_value_eur)
field_16/field_24  (gross_premium_cur / gross_outgoing_cur)
field_17/field_25  (gross_premium_eur / gross_outgoing_eur)
field_18/field_26  (invested_premium_cur / net_outgoing_payment_cur)
field_19/field_27  (invested_premium_eur / net_outgoing_payment_eur)
field_20/field_28  (entry_fee_cur / operation_cost_cur)
field_21/field_29  (entry_fee_eur / operation_cost_eur)
field_22/field_30  (entry_expenses_cur / tax_liq_cur)
field_23/field_31  (entry_expenses_eur / tax_liq_eur)
field_34  (duty_liq_cur)
field_35  (duty_liq_eur)
field_32  (bonus_liq_cur)
field_33  (bonus_liq_eur)
```

**Note:**
- Le label delle colonne devono utilizzare i **nomi tecnici inglesi** (es. "operation_id", "company", "fund_code", etc.)
- Gli operatori sono abituati a questa nomenclatura tecnica

---

## Riepilogo Relazioni

```
data.import_tracking (1)
    ↓ FK: import_tracking_id
data.import_data_flat (N)

data.import_tracking (N)
    ← FK: param_import_status_id
data.param_import_status (1)

data.import_data_flat.field_04 → company.name (autocomplete)
data.import_data_flat.field_06 → contract.code_company (autocomplete)
data.import_data_flat.field_12 → fund.code (autocomplete)
data.import_data_flat.field_13 ← fund.description (auto-fill)
```

---

## Note Implementative

1. **Tutti i field_XX sono di tipo TEXT** anche se contengono numeri o date. La conversione di tipo avviene a livello applicativo.

2. **Named Parameters nelle Query:** Usare sempre `:param_name` per i binding, mai `?` posizionali.

3. **Gestione Transazioni:**
   - Query singole: auto-commit tramite `tryQuery($sql, $bindings)`
   - Query multiple atomiche: `addQueryInStack()` + `tryQueryStack(true)`

4. **Ricalcolo row_id:** Deve avvenire in una singola query UPDATE con window function, all'interno della stessa transazione della DELETE.

5. **Propagazione filename:** Richiede transazione con 2 query (UPDATE testata + UPDATE tutti i record).

---

**Fine SCHEMA_REFERENCE.md**

# Glossario — Settimanale

> **Versione:** 2.0
> **Data:** 2026-02-24
> **Stato:** APPROVATO

---

## Termini di Dominio

### Testata (Header)
**Italiano:** Testata di importazione
**Tabella:** `data.import_tracking`
**Descrizione:** Rappresenta una sessione di importazione di operazioni finanziarie. Contiene metadati sull'importazione (date, stato, conteggio record) e funge da contenitore per i record operativi.

### Record
**Italiano:** Record di operazione
**Tabella:** `data.import_data_flat`
**Descrizione:** Singola operazione finanziaria (valorizzazione, operazione positiva o negativa) associata a una testata. Contiene fino a 50 campi che descrivono l'operazione.

### Tipo Operazione
**Italiano:** Tipo di operazione finanziaria
**Campi:** `import_record_id`, `field_01` (codice)
**Descrizione:** Classificazione dell'operazione in tre categorie: ASV (valorizzazione), operazioni positive (aggiunta capitale), operazioni negative (riduzione capitale).

### Valorizzazione (ASV)
**Italiano:** Valorizzazione della polizza
**Codice:** ASV
**Segno:** neutro (null)
**Descrizione:** Operazione che registra il valore corrente di una polizza assicurativa basato sulle quote investite e la loro quotazione.

### Operazione Positiva
**Italiano:** Operazione di aggiunta capitale
**Codici:** EMP, VAI, SWI
**Segno:** + (positivo)
**Descrizione:** Operazione che aggiunge capitale ai fondi di investimento, registrando premi lordi/netti, commissioni di ingresso e quote investite.

### Operazione Negativa
**Italiano:** Operazione di riduzione capitale
**Codici:** PSR, TSR, CLM, TRU, DMF, DDC, SWO
**Segno:** - (negativo)
**Descrizione:** Operazione che riduce il capitale dei fondi di investimento, registrando uscite lorde/nette, costi, tasse, bonus e quote disinvestite.

---

## Campi Testata (`data.import_tracking`)

| Campo | Tipo | Label Italiano | Nome Tecnico | Gestione | Descrizione |
|-------|------|----------------|--------------|----------|-------------|
| `id` | INT | ID | id | Automatico (PK) | Identificatore univoco testata |
| `import_main_id` | INT | ID Import Principale | import_main_id | Automatico (1120) | Identificatore tipo import |
| `param_import_status_id` | INT | ID Stato | param_import_status_id | Automatico (1 iniziale) | Chiave esterna a stato import |
| `status_text` | TEXT | Stato | status_text | Automatico (JOIN) | Descrizione testuale stato (da `param_import_status.description_2`) |
| `rows_imported` | INT | Inseriti | rows_imported | Automatico | Conteggio record associati (incrementato/decrementato su insert/delete) |
| `rows_rejected` | INT | Scartati | rows_rejected | Sola lettura | Conteggio record scartati (gestito da processi esterni) |
| `rows_recovered` | INT | Recuperati | rows_recovered | Sola lettura | Conteggio record recuperati (gestito da processi esterni) |
| `run_start_date` | TIMESTAMP | Data Inserimento | run_start_date | Automatico (now() su create) | Timestamp creazione testata |
| `run_end_date` | TIMESTAMP | Data Ultima Modifica | run_end_date | Automatico (now() su update/insert/delete record) | Timestamp ultima modifica record |
| `filename` | TEXT | Descrizione | filename | Input utente | Descrizione libera dell'importazione (storico: era nome file) |
| `last_check_start` | TIMESTAMP | Inizio Check | last_check_start | Sola lettura | Timestamp inizio processo check (gestito esternamente) |
| `last_check_end` | TIMESTAMP | Fine Check | last_check_end | Sola lettura | Timestamp fine processo check (gestito esternamente) |
| `last_post_start` | TIMESTAMP | Inizio Post | last_post_start | Sola lettura | Timestamp inizio processo posting (gestito esternamente) |
| `last_post_end` | TIMESTAMP | Fine Post | last_post_end | Sola lettura | Timestamp fine processo posting (gestito esternamente) |

---

## Campi Record (`data.import_data_flat`)

### Campi Comuni (Tutti i Tipi)

| Field | Nome Logico | Label Italiano | Nome Tecnico | Input | Default | Descrizione |
|-------|-------------|----------------|--------------|-------|---------|-------------|
| `field_01` | operation_type | Tipo Operazione | operation_type | Automatico | Codice tipo | Codice tipo operazione (ASV, EMP, VAI, SWI, PSR, TSR, CLM, TRU, DMF, DDC, SWO) |
| `field_02` | operation_id | Indice Progressivo | operation_id | Automatico | = row_id | Numero progressivo operazione (uguale a row_id) |
| `field_04` | company | Compagnia | company | Autocomplete | - | Nome compagnia assicurativa |
| `field_06` | policy_number | Numero Polizza | policy_number | Autocomplete | - | Codice identificativo polizza |
| `field_11` | fund_type | Tipo Fondo | fund_type | Dropdown | - | Tipo fondo investimento (FD=Fondo, FI=Fondo Interno, GS=Gestione Separata) |
| `field_12` | fund_code | Codice Fondo | fund_code | Autocomplete | - | Codice identificativo fondo |
| `field_13` | fund_description | Descrizione Fondo | fund_description | Automatico | - | Nome esteso fondo (auto-compilato da fund_code) |
| `field_14` | currency | Valuta | currency | Dropdown | EUR | Valuta operazione (EUR, CHF, GBP, JPY, USD, SEK) |
| `field_15` | exchange_rate | Tasso di Cambio | exchange_rate | Input numerico | 1 | Tasso conversione valuta (default 1 per EUR) |
| `field_49` | operation_date | Data Operazione | operation_date | Date picker (Flatpickr) | - | Data esecuzione operazione (DD/MM/YYYY, Flatpickr) |
| `field_50` | effect_date | Data Effetto | effect_date | Date picker (Flatpickr) | - | Data valuta operazione (DD/MM/YYYY, Flatpickr) |

### Campi Specifici ASV (Valorizzazione)

| Field | Nome Logico | Label Italiano | Nome Tecnico | Input | Default | Descrizione |
|-------|-------------|----------------|--------------|-------|---------|-------------|
| `field_36` | units_invested | Quote Investite | units_invested | Float | 0 | Numero quote del fondo possedute |
| `field_38` | unit_quotation_cur | Quotazione Quota (Valuta) | unit_quotation_cur | Float | 0 | Valore unitario quota in valuta originale |
| `field_39` | unit_quotation_eur | Quotazione Quota (EUR) | unit_quotation_eur | Calcolato | - | Valore unitario quota convertito in EUR (field_38 * field_15) |
| `field_40` | asset_value_cur | Valore Patrimonio (Valuta) | asset_value_cur | Float | 0 | Valore totale patrimonio in valuta originale |
| `field_41` | asset_value_eur | Valore Patrimonio (EUR) | asset_value_eur | Calcolato | - | Valore totale patrimonio convertito in EUR (field_40 * field_15) |

### Campi Specifici Operazioni Positive (EMP, VAI, SWI)

| Field | Nome Logico | Label Italiano | Nome Tecnico | Input | Default | Descrizione |
|-------|-------------|----------------|--------------|-------|---------|-------------|
| `field_16` | gross_premium_cur | Premio Lordo (Valuta) | gross_premium_cur | Float | 0 | Premio versato lordo in valuta originale |
| `field_17` | gross_premium_eur | Premio Lordo (EUR) | gross_premium_eur | Calcolato | - | Premio lordo convertito in EUR (field_16 * field_15) |
| `field_18` | invested_premium_cur | Premio Investito (Valuta) | invested_premium_cur | Float | 0 | Premio effettivamente investito (al netto commissioni) in valuta originale |
| `field_19` | invested_premium_eur | Premio Investito (EUR) | invested_premium_eur | Calcolato | - | Premio investito convertito in EUR (field_18 * field_15) |
| `field_20` | entry_fee_cur | Commissione Ingresso (Valuta) | entry_fee_cur | Float | 0 | Commissioni di ingresso in valuta originale |
| `field_21` | entry_fee_eur | Commissione Ingresso (EUR) | entry_fee_eur | Calcolato | - | Commissioni ingresso convertite in EUR (field_20 * field_15) |
| `field_22` | entry_expenses_cur | Spese Ingresso (Valuta) | entry_expenses_cur | Float | 0 | Altre spese di ingresso in valuta originale |
| `field_23` | entry_expenses_eur | Spese Ingresso (EUR) | entry_expenses_eur | Calcolato | - | Spese ingresso convertite in EUR (field_22 * field_15) |
| `field_36` | units_invested | Quote Investite | units_invested | Float | 0 | Numero quote acquistate con il premio |
| `field_38` | unit_quotation_cur | Quotazione Quota (Valuta) | unit_quotation_cur | Float | 0 | Valore unitario quota al momento acquisto (valuta originale) |
| `field_39` | unit_quotation_eur | Quotazione Quota (EUR) | unit_quotation_eur | Calcolato | - | Quotazione quota convertita in EUR (field_38 * field_15) |
| `field_40` | asset_value_cur | Valore Investito (Valuta) | asset_value_cur | Automatico | = field_18 | Valore investito (uguale a invested_premium_cur) |
| `field_41` | asset_value_eur | Valore Investito (EUR) | asset_value_eur | Automatico | = field_19 | Valore investito in EUR (uguale a invested_premium_eur) |

### Campi Specifici Operazioni Negative (PSR, TSR, CLM, TRU, DMF, DDC, SWO)

| Field | Nome Logico | Label Italiano | Nome Tecnico | Input | Default | Descrizione |
|-------|-------------|----------------|--------------|-------|---------|-------------|
| `field_24` | gross_outgoing_cur | Uscita Lorda (Valuta) | gross_outgoing_cur | Float | 0 | Importo lordo prelevato in valuta originale |
| `field_25` | gross_outgoing_eur | Uscita Lorda (EUR) | gross_outgoing_eur | Calcolato | - | Uscita lorda convertita in EUR (field_24 * field_15) |
| `field_26` | net_outgoing_payment_cur | Uscita Netta (Valuta) | net_outgoing_payment_cur | Float | 0 | Importo netto effettivamente erogato (al netto costi/tasse) in valuta originale |
| `field_27` | net_outgoing_payment_eur | Uscita Netta (EUR) | net_outgoing_payment_eur | Calcolato | - | Uscita netta convertita in EUR (field_26 * field_15) |
| `field_28` | operation_cost_cur | Costi Operazione (Valuta) | operation_cost_cur | Float | 0 | Costi amministrativi operazione in valuta originale |
| `field_29` | operation_cost_eur | Costi Operazione (EUR) | operation_cost_eur | Calcolato | - | Costi operazione convertiti in EUR (field_28 * field_15) |
| `field_30` | tax_liq_cur | Tasse Liquidazione (Valuta) | tax_liq_cur | Float | 0 | Imposte sulla liquidazione in valuta originale |
| `field_31` | tax_liq_eur | Tasse Liquidazione (EUR) | tax_liq_eur | Calcolato | - | Tasse convertite in EUR (field_30 * field_15) |
| `field_32` | bonus_liq_cur | Bonus Liquidazione (Valuta) | bonus_liq_cur | Float | 0 | Bonus/premi aggiunti alla liquidazione in valuta originale |
| `field_33` | bonus_liq_eur | Bonus Liquidazione (EUR) | bonus_liq_eur | Calcolato | - | Bonus convertiti in EUR (field_32 * field_15) |
| `field_34` | duty_liq_cur | Imposta di Bollo (Valuta) | duty_liq_cur | Float | 0 | Imposta bollo sulla liquidazione in valuta originale |
| `field_35` | duty_liq_eur | Imposta di Bollo (EUR) | duty_liq_eur | Calcolato | - | Imposta bollo convertita in EUR (field_34 * field_15) |
| `field_37` | units_disinvested | Quote Disinvestite | units_disinvested | Float | 0 | Numero quote vendute |
| `field_38` | unit_quotation_cur | Quotazione Quota (Valuta) | unit_quotation_cur | Float | 0 | Valore unitario quota al momento vendita (valuta originale) |
| `field_39` | unit_quotation_eur | Quotazione Quota (EUR) | unit_quotation_eur | Calcolato | - | Quotazione quota convertita in EUR (field_38 * field_15) |
| `field_40` | asset_value_cur | Valore Disinvestito (Valuta) | asset_value_cur | Automatico | = field_24 | Valore disinvestito (uguale a gross_outgoing_cur) |
| `field_41` | asset_value_eur | Valore Disinvestito (EUR) | asset_value_eur | Automatico | = field_25 | Valore disinvestito in EUR (uguale a gross_outgoing_eur) |

### Campi Metadati Record

| Campo | Nome Logico | Label Italiano | Nome Tecnico | Gestione | Descrizione |
|-------|-------------|----------------|--------------|----------|-------------|
| `id` | - | ID | id | Automatico (PK) | Identificatore univoco record |
| `import_tracking_id` | - | ID Testata | import_tracking_id | Automatico (FK) | Chiave esterna a testata |
| `row_id` | - | Indice Riga | row_id | Automatico | Numero progressivo record all'interno testata (senza buchi) |
| `import_record_id` | - | ID Tipo Record | import_record_id | Automatico | Chiave esterna a tipo operazione |
| `source_filename` | - | Filename Origine | source_filename | Automatico | Copia di filename della testata (tracciabilità) |

---

## Mapping Tipi Record

### Tabella import_record_id → Codice → Segno

| import_record_id | Codice | Segno | Categoria | Descrizione Estesa |
|------------------|--------|-------|-----------|-------------------|
| 112005 | EMP | + | Operazione Positiva | Employee contribution (versamento dipendente) |
| 112006 | ASV | null | Valorizzazione | Asset valuation (valorizzazione patrimonio) |
| 112007 | VAI | + | Operazione Positiva | Voluntary additional investment (versamento volontario aggiuntivo) |
| 112008 | SWO | - | Operazione Negativa | Switch out (disinvestimento per switch) |
| 112009 | SWI | + | Operazione Positiva | Switch in (investimento da switch) |
| 112010 | PSR | - | Operazione Negativa | Partial surrender (riscatto parziale) |
| 112011 | TSR | - | Operazione Negativa | Total surrender (riscatto totale) |
| 112012 | CLM | - | Operazione Negativa | Claim (liquidazione sinistro) |
| 112013 | TRU | - | Operazione Negativa | Transfer out (trasferimento uscente) |
| 112014 | DMF | - | Operazione Negativa | Death management fee (spese gestione decesso) |
| 112015 | DDC | - | Operazione Negativa | Death claim (liquidazione per decesso) |

---

## Colonne Visualizzate Tabella Record (con "/" per tipo-specifici)

L'ordine di visualizzazione nella tabella record segue questa sequenza, dove "/" indica che vengono mostrati campi diversi in base al tipo operazione:

1. **field_02** — operation_id (indice)
2. **field_01** — operation_type (tipo)
3. **field_04** — company
4. **field_06** — policy_number
5. **field_11** — fund_type
6. **field_12** — fund_code
7. **field_13** — fund_description
8. **field_14** — currency
9. **field_15** — exchange_rate
10. **field_49** — operation_date
11. **field_50** — effect_date
12. **field_36/field_37** — units_invested (ASV, Positivo) / units_disinvested (Negativo)
13. **field_38** — unit_quotation_cur
14. **field_39** — unit_quotation_eur
15. **field_40** — asset_value_cur
16. **field_41** — asset_value_eur
17. **field_16/field_24** — gross_premium_cur (Positivo) / gross_outgoing_cur (Negativo)
18. **field_17/field_25** — gross_premium_eur (Positivo) / gross_outgoing_eur (Negativo)
19. **field_18/field_26** — invested_premium_cur (Positivo) / net_outgoing_payment_cur (Negativo)
20. **field_19/field_27** — invested_premium_eur (Positivo) / net_outgoing_payment_eur (Negativo)
21. **field_20/field_28** — entry_fee_cur (Positivo) / operation_cost_cur (Negativo)
22. **field_21/field_29** — entry_fee_eur (Positivo) / operation_cost_eur (Negativo)
23. **field_22/field_30** — entry_expenses_cur (Positivo) / tax_liq_cur (Negativo)
24. **field_23/field_31** — entry_expenses_eur (Positivo) / tax_liq_eur (Negativo)
25. **field_34** — duty_liq_cur (solo Negativo)
26. **field_35** — duty_liq_eur (solo Negativo)
27. **field_32** — bonus_liq_cur (solo Negativo)
28. **field_33** — bonus_liq_eur (solo Negativo)

**Nota:** Le celle vengono lasciate vuote quando il campo non è applicabile al tipo operazione (es. field_34 per ASV o Positivo).

---

## Formule di Validazione (Warning Non-Bloccanti)

### ASV
- **Unità × Quotazione = Valore:** `field_36 * field_38 = field_40`

### Operazioni Positive (EMP, VAI, SWI)
- **Premio Lordo - Investito = Commissioni:** `field_16 - field_18 = field_20 + field_22`
- **Unità × Quotazione = Premio Investito:** `field_36 * field_38 = field_18`

### Operazioni Negative (PSR, TSR, CLM, TRU, DMF, DDC, SWO)
- **Uscita Lorda - Netta = Costi + Tasse + Bollo - Bonus:** `field_24 - field_26 = field_28 + field_30 + field_34 - field_32`
- **Unità × Quotazione = Uscita Lorda:** `field_37 * field_38 = field_24`

---

## Dropdown e Autocomplete

### Dropdown fund_type (field_11)
| Valore | Descrizione |
|--------|-------------|
| FD | Fondo (Fund) |
| FI | Fondo Interno (Internal Fund) |
| GS | Gestione Separata (Separate Account) |

### Dropdown currency (field_14)
| Valore | Descrizione |
|--------|-------------|
| EUR | Euro |
| CHF | Franco Svizzero |
| GBP | Sterlina Inglese |
| JPY | Yen Giapponese |
| USD | Dollaro USA |
| SEK | Corona Svedese |

### Autocomplete company (field_04)
**Query:** `SELECT name FROM company WHERE name ILIKE '%' || :subText || '%' LIMIT 20`
**Min caratteri:** 2
**Debounce:** 1 secondo

### Autocomplete policy_number (field_06)
**Query:** `SELECT code_company FROM contract WHERE code_company ILIKE '%' || :subText || '%' LIMIT 20`
**Min caratteri:** 2
**Debounce:** 1 secondo

### Autocomplete fund_code (field_12)
**Query:** `SELECT code, description FROM fund WHERE code ILIKE '%' || :subText || '%' LIMIT 20`
**Min caratteri:** 2
**Debounce:** 1 secondo
**Auto-fill:** Quando selezionato, popola automaticamente field_13 (fund_description) con il valore `description` restituito

---

## Stati Testata (param_import_status)

| param_import_status_id | description_2 | Significato |
|------------------------|---------------|-------------|
| 1 | Iniziale | Testata aperta e modificabile. Lucchetto aperto (verde). Link esterno disabilitato (grigio). Cestino attivo se rows_imported=0, altrimenti disabilitato con toast |
| 2 | Validato | Testata chiusa e bloccata. Lucchetto chiuso (rosso). Link esterno attivo (apre nuova scheda). Cestino disabilitato con toast. Nessuna modifica consentita ai record o al filename |
| ... | Altri stati | Gestiti da processi esterni (check, posting) — NON gestiti dall'applicazione Settimanale. Lucchetto chiuso e non cliccabile. Link esterno attivo. Cestino disabilitato con toast |

### Icone Azioni Testata (ordine colonne)

Le icone azioni sono presenti sia nella tabella testate che nella vista dettaglio righe, nello stesso ordine:

| Icona | Bootstrap Icon | Attiva quando | Disabilitata quando | Click su disabilitata |
|-------|---------------|--------------|--------------------|--------------------|
| Link esterno | bi-box-arrow-up-right | status_id != 1 | status_id = 1 | nessuna azione |
| Lucchetto | bi-unlock-fill / bi-lock-fill | status_id = 1 o 2 | status_id >= 3 | nessuna azione |
| Cestino | bi-trash-fill | rows_imported = 0 AND status_id = 1 | altrimenti | toast di avviso |

**Nota:** La colonna Descrizione (filename) e' sempre testo semplice senza link. L'accesso alla vista esterna avviene esclusivamente tramite l'icona Link esterno.

---

## Changelog

| Versione | Data | Autore | Modifiche |
|----------|------|--------|-----------|
| 1.0 | 2026-02-20 | agent-ears | Creazione iniziale glossario completo |
| 2.0 | 2026-02-24 | Claude | Aggiornamento stati testata, formato date DD/MM/YYYY |

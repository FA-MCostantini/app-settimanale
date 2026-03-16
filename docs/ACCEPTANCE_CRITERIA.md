# Criteri di Accettazione BDD — Settimanale

> **Versione:** 2.0
> **Data:** 2026-02-24
> **Stato:** APPROVATO

---

## Formato

Tutti i criteri seguono il formato **BDD** (Behavior-Driven Development):

```
Given [contesto iniziale]
When [azione/evento]
Then [risultato atteso]
```

Dove necessario vengono usate varianti:
- **And** per condizioni/azioni multiple
- **But** per eccezioni

---

## AC-TST: Accettazione Testate

### AC-TST-001: Visualizzazione Iniziale Elenco Testate

**Scenario:** Apertura applicazione con database popolato

```gherkin
Given il database contiene 15 testate
  And le testate hanno run_start_date da '2026-01-01 10:00' a '2026-02-15 16:30'
When l'utente accede all'applicazione per la prima volta
Then viene mostrata la vista testate (non la vista record)
  And la tabella mostra tutte le 15 testate
  And le testate sono ordinate per run_start_date DESC (più recenti in alto)
  And la paginazione è impostata su 20 record per pagina
  And vengono visualizzate le colonne: Data inserimento, Data ultima modifica, Descrizione, Stato, Inseriti, Scartati, Recuperati, Inizio Check, Fine Check, Inizio Post, Fine Post
```

### AC-TST-002: Creazione Nuova Testata

**Scenario:** Inserimento testata con descrizione valida

```gherkin
Given l'utente è nella vista testate
  And il database ha 5 testate esistenti
When l'utente clicca sull'icona "+" nell'header della prima colonna
Then si apre una modale con titolo "Nuova Testata"
  And la modale contiene un campo "Descrizione" vuoto
  And la modale contiene i bottoni "Salva" e "Annulla"
When l'utente inserisce "Importazione Gennaio 2026" nel campo Descrizione
  And l'utente clicca sul bottone "Salva"
Then viene eseguita una chiamata POST a ajax_import_settimanale_save.php con action=header_save
  And il backend crea un nuovo record con:
    - id: autogenerato (es. 101)
    - import_main_id: 1120
    - param_import_status_id: 1
    - rows_imported: 0
    - run_start_date: timestamp corrente
    - run_end_date: null
    - filename: "Importazione Gennaio 2026"
  And la modale si chiude
  And la tabella testate viene ricaricata
  And il nuovo record appare in cima alla tabella
```

### AC-TST-003: Modifica Filename Testata

**Scenario:** Modifica descrizione testata esistente con propagazione

```gherkin
Given la testata con id=42 ha:
    - filename: "Vecchia descrizione"
    - rows_imported: 3
  And la testata ha 3 record figli con source_filename: "Vecchia descrizione"
When l'utente clicca sull'icona modifica per la testata id=42
Then si apre una modale con campo Descrizione pre-compilato "Vecchia descrizione"
When l'utente modifica il testo in "Nuova descrizione aggiornata"
  And l'utente clicca "Salva"
Then viene eseguita una chiamata POST con action=header_save, id=42, filename="Nuova descrizione aggiornata"
  And il backend esegue una transazione batch che:
    1. Aggiorna data.import_tracking SET filename='Nuova descrizione aggiornata' WHERE id=42
    2. Aggiorna data.import_data_flat SET source_filename='Nuova descrizione aggiornata' WHERE import_tracking_id=42
  And in caso di errore viene fatto rollback completo
  And la modale si chiude
  And la tabella mostra filename="Nuova descrizione aggiornata" per id=42
  And tutti i 3 record figli hanno source_filename="Nuova descrizione aggiornata"
```

### AC-TST-004: Cancellazione Testata Permessa

**Scenario:** Cancellazione testata vuota in stato iniziale

```gherkin
Given la testata con id=10 ha:
    - rows_imported: 0
    - param_import_status_id: 1
When l'utente visualizza l'elenco testate
Then nella riga id=10 l'icona cestino e' attiva (rossa, cliccabile)
When l'utente clicca sull'icona cestino
Then appare una modale di conferma "Sei sicuro di voler cancellare questa testata?"
When l'utente clicca "Conferma"
Then viene eseguita una chiamata POST con action=header_delete, id=10
  And il backend cancella il record con id=10
  And la tabella viene ricaricata
  And la riga id=10 non e' piu' visibile
```

### AC-TST-005: Cancellazione Testata Negata

**Scenario:** Tentativo cancellazione testata con record

```gherkin
Given la testata con id=20 ha:
    - rows_imported: 5
    - param_import_status_id: 1
When l'utente visualizza l'elenco testate
Then nella riga id=20 l'icona cestino e' disabilitata (grigia)
When l'utente clicca sull'icona cestino disabilitata
Then viene mostrato un toast di avviso "Impossibile eliminare un'importazione bloccata o contenente delle righe"
  And nessuna modale di conferma viene aperta

Scenario alternativo: tentativo via API diretta
Given la testata con id=21 ha rows_imported: 3
When viene inviata una richiesta POST diretta con action=header_delete, id=21
Then il backend restituisce {success:false, message:"Impossibile cancellare testata con record associati"}
  And il record id=21 rimane nel database
```

### AC-TST-006: Cancellazione Testata Negata per Stato

**Scenario:** Testata vuota ma non in stato iniziale

```gherkin
Given la testata con id=30 ha:
    - rows_imported: 0
    - param_import_status_id: 2 (non iniziale)
When l'utente visualizza l'elenco testate
Then nella riga id=30 l'icona cestino e' disabilitata (grigia)
When l'utente clicca sull'icona cestino disabilitata
Then viene mostrato un toast di avviso "Impossibile eliminare un'importazione bloccata o contenente delle righe"
```

### AC-TST-007: Paginazione Testate

**Scenario:** Cambio numero record per pagina

```gherkin
Given il database contiene 55 testate
  And la paginazione è impostata su 20 (default)
When l'utente visualizza la vista testate
Then vengono mostrate le prime 20 testate
  And i controlli di paginazione mostrano "Pagina 1 di 3"
When l'utente seleziona "50" dal dropdown paginazione
Then vengono mostrate 50 testate (dalla 1 alla 50)
  And i controlli mostrano "Pagina 1 di 2"
When l'utente clicca su "Pagina 2"
Then vengono mostrate le rimanenti 5 testate (dalla 51 alla 55)
  And i controlli mostrano "Pagina 2 di 2"
```

### AC-TST-008: Filtro Testate

**Scenario:** Ricerca testuale su tutte le colonne

```gherkin
Given la tabella mostra 100 testate
  And 5 testate hanno filename contenente "Gennaio"
  And 3 testate hanno status_text contenente "Gennaio"
  And nessuna sovrapposizione tra i due gruppi
When l'utente digita "Gennaio" nel campo filtro
Then vengono mostrate 8 righe (5+3)
  And tutte le righe contengono "Gennaio" in almeno una colonna visibile
  And la paginazione si applica solo alle righe filtrate
When l'utente cancella il filtro
Then tutte le 100 testate tornano visibili
```

### AC-TST-009: Sort Tri-State Testate

**Scenario:** Ordinamento colonna filename

```gherkin
Given la tabella è in ordinamento default (run_start_date DESC)
  And ci sono testate con filename: "Zeta", "Alpha", "Beta"
When l'utente clicca sulla colonna "Descrizione" (1° click)
Then la tabella viene ordinata per filename ASC
  And l'ordine diventa: "Alpha", "Beta", "Zeta"
  And appare un'icona freccia verso l'alto nell'header "Descrizione"
When l'utente clicca nuovamente su "Descrizione" (2° click)
Then la tabella viene ordinata per filename DESC
  And l'ordine diventa: "Zeta", "Beta", "Alpha"
  And l'icona diventa freccia verso il basso
When l'utente clicca una terza volta su "Descrizione" (3° click)
Then la tabella torna all'ordinamento default (run_start_date DESC)
  And l'icona scompare dall'header "Descrizione"
```

### AC-TST-010: Navigazione a Vista Record

**Scenario:** Apertura dettaglio testata

```gherkin
Given l'utente è nella vista testate
  And la testata con id=42 ha 10 record associati
When l'utente clicca sull'icona occhio nella riga id=42
Then la vista cambia da testate a record
  And viene eseguita una chiamata GET a ajax_import_settimanale_view.php?action=records&tracking_id=42
  And la tabella record mostra i 10 record ordinati per row_id ASC
  And appare un bottone "Torna a Testate" o breadcrumb visibile
When l'utente clicca "Torna a Testate"
Then la vista torna a mostrare l'elenco testate
  And lo stato precedente (filtri, paginazione, sort) viene mantenuto
```

---

## AC-REC: Accettazione Record

### AC-REC-001: Visualizzazione Elenco Record

**Scenario:** Apertura dettaglio testata con record di tipi misti

```gherkin
Given la testata con id=50 contiene 5 record:
    - record 1: row_id=1, tipo ASV, field_36=100 (units_invested)
    - record 2: row_id=2, tipo EMP, field_36=200 (units_invested)
    - record 3: row_id=3, tipo PSR, field_37=50 (units_disinvested)
    - record 4: row_id=4, tipo SWI, field_36=150
    - record 5: row_id=5, tipo CLM, field_37=75
When l'utente apre il dettaglio della testata id=50
Then viene mostrata una tabella con 5 righe
  And le colonne sono nell'ordine: field_02, field_01, field_04, field_06, ..., field_36/37, ..., field_16/24, ...
  And per il record 1 (ASV): la colonna field_36/37 mostra "100" (field_36)
  And per il record 2 (EMP): la colonna field_36/37 mostra "200" (field_36)
  And per il record 3 (PSR): la colonna field_36/37 mostra "50" (field_37)
  And per il record 1 (ASV): le colonne field_16/24, field_17/25, ... sono vuote
  And per il record 3 (PSR): le colonne field_16/24 mostrano i valori field_24, field_25, ...
```

### AC-REC-002: Inserimento Nuovo Record ASV

**Scenario:** Creazione record valorizzazione

```gherkin
Given l'utente è nella vista record della testata id=60
  And la testata ha rows_imported=2
  And l'ultimo row_id esistente è 2
When l'utente clicca sul bottone "ASV" (verde, neutro)
Then si apre una modale con titolo "Nuovo Record - ASV"
  And la modale mostra i campi comuni:
    - operation_type: "ASV" (readonly, automatico)
    - operation_id: (nascosto, automatico)
    - company: (input autocomplete, vuoto)
    - policy_number: (input autocomplete, vuoto)
    - fund_type: (dropdown FD/FI/GS, vuoto)
    - fund_code: (input autocomplete, vuoto)
    - fund_description: (readonly, vuoto)
    - currency: (dropdown, default "EUR")
    - exchange_rate: (input numerico, default "1")
    - operation_date: (date picker, vuoto)
    - effect_date: (date picker, vuoto)
  And la modale mostra i campi specifici ASV:
    - units_invested: (input numerico, default "0")
    - unit_quotation_cur: (input numerico, default "0")
    - unit_quotation_eur: (readonly, calcolato "0")
    - asset_value_cur: (input numerico, default "0")
    - asset_value_eur: (readonly, calcolato "0")
When l'utente compila i campi:
    - company: "ACME Corp" (via autocomplete)
    - policy_number: "POL123456" (via autocomplete)
    - fund_type: "FD"
    - fund_code: "FD001" → auto-compila fund_description: "Fondo Azionario Globale"
    - currency: "EUR"
    - exchange_rate: "1"
    - operation_date: "10/02/2026"
    - effect_date: "11/02/2026"
    - units_invested: "1000"
    - unit_quotation_cur: "15.50"
    - asset_value_cur: "15500"
  And l'utente clicca "Salva"
Then il sistema calcola automaticamente:
    - unit_quotation_eur: 15.50 * 1 = 15.50
    - asset_value_eur: 15500 * 1 = 15500
  And viene eseguita una chiamata POST con action=record_save contenente tutti i campi
  And il backend esegue una transazione batch:
    1. Inserisce nuovo record in data.import_data_flat con:
       - id: autogenerato
       - import_tracking_id: 60
       - row_id: 3 (MAX(row_id)+1)
       - import_record_id: 112006
       - source_filename: (copia di filename testata id=60)
       - field_01: "ASV"
       - field_02: "3"
       - field_04: "ACME Corp"
       - field_06: "POL123456"
       - field_11: "FD"
       - field_12: "FD001"
       - field_13: "Fondo Azionario Globale"
       - field_14: "EUR"
       - field_15: "1"
       - field_49: "10/02/2026"
       - field_50: "11/02/2026"
       - field_36: "1000"
       - field_38: "15.50"
       - field_39: "15.50"
       - field_40: "15500"
       - field_41: "15500"
    2. Aggiorna data.import_tracking SET rows_imported=3, run_end_date=now() WHERE id=60
  And la modale si chiude
  And la tabella record viene ricaricata
  And il nuovo record appare con row_id=3
```

### AC-REC-003: Inserimento Nuovo Record Positivo (EMP)

**Scenario:** Creazione record operazione positiva con tutti i campi

```gherkin
Given l'utente è nella vista record della testata id=70
  And la testata ha rows_imported=1, run_end_date='2026-02-19 10:00:00'
When l'utente clicca sul bottone "EMP" (tonalità fredda, es. blu)
Then si apre una modale con titolo "Nuovo Record - EMP"
  And la modale mostra campi comuni + campi specifici positivi:
    - gross_premium_cur (default 0)
    - gross_premium_eur (readonly, calcolato)
    - invested_premium_cur (default 0)
    - invested_premium_eur (readonly, calcolato)
    - entry_fee_cur (default 0)
    - entry_fee_eur (readonly, calcolato)
    - entry_expenses_cur (default 0)
    - entry_expenses_eur (readonly, calcolato)
    - units_invested (default 0)
    - unit_quotation_cur (default 0)
    - unit_quotation_eur (readonly, calcolato)
    - asset_value_cur (readonly, = invested_premium_cur)
    - asset_value_eur (readonly, = invested_premium_eur)
When l'utente compila:
    - company: "Beta Insurance"
    - policy_number: "BET789"
    - fund_type: "FI"
    - fund_code: "FI050"
    - currency: "CHF"
    - exchange_rate: "1.05"
    - operation_date: "15/02/2026"
    - effect_date: "15/02/2026"
    - gross_premium_cur: "10000"
    - invested_premium_cur: "9500"
    - entry_fee_cur: "300"
    - entry_expenses_cur: "200"
    - units_invested: "950"
    - unit_quotation_cur: "10"
  And l'utente clicca "Salva"
Then il sistema calcola automaticamente:
    - gross_premium_eur: 10000 * 1.05 = 10500
    - invested_premium_eur: 9500 * 1.05 = 9975
    - entry_fee_eur: 300 * 1.05 = 315
    - entry_expenses_eur: 200 * 1.05 = 210
    - unit_quotation_eur: 10 * 1.05 = 10.5
    - asset_value_cur: 9500 (= invested_premium_cur)
    - asset_value_eur: 9975 (= invested_premium_eur)
  And il sistema esegue le validazioni warning (vedi AC-VAL-002, AC-VAL-003)
  And il record viene salvato (anche se ci sono warning)
  And il backend aggiorna rows_imported=2, run_end_date=timestamp attuale per testata id=70
  And la modale si chiude
  And il nuovo record appare nella tabella
```

### AC-REC-004: Inserimento Nuovo Record Negativo (PSR)

**Scenario:** Creazione record operazione negativa

```gherkin
Given l'utente è nella vista record della testata id=80
When l'utente clicca sul bottone "PSR" (tonalità calda, es. rosso)
Then si apre una modale con titolo "Nuovo Record - PSR"
  And la modale mostra campi comuni + campi specifici negativi:
    - gross_outgoing_cur (default 0)
    - gross_outgoing_eur (readonly, calcolato)
    - net_outgoing_payment_cur (default 0)
    - net_outgoing_payment_eur (readonly, calcolato)
    - operation_cost_cur (default 0)
    - operation_cost_eur (readonly, calcolato)
    - tax_liq_cur (default 0)
    - tax_liq_eur (readonly, calcolato)
    - bonus_liq_cur (default 0)
    - bonus_liq_eur (readonly, calcolato)
    - duty_liq_cur (default 0)
    - duty_liq_eur (readonly, calcolato)
    - units_disinvested (default 0)
    - unit_quotation_cur (default 0)
    - unit_quotation_eur (readonly, calcolato)
    - asset_value_cur (readonly, = gross_outgoing_cur)
    - asset_value_eur (readonly, = gross_outgoing_eur)
When l'utente compila:
    - company: "Gamma Assurance"
    - policy_number: "GAM321"
    - fund_type: "GS"
    - fund_code: "GS100"
    - currency: "USD"
    - exchange_rate: "0.92"
    - operation_date: "18/02/2026"
    - effect_date: "18/02/2026"
    - gross_outgoing_cur: "5000"
    - net_outgoing_payment_cur: "4500"
    - operation_cost_cur: "100"
    - tax_liq_cur: "300"
    - bonus_liq_cur: "50"
    - duty_liq_cur: "150"
    - units_disinvested: "250"
    - unit_quotation_cur: "20"
  And l'utente clicca "Salva"
Then il sistema calcola automaticamente:
    - gross_outgoing_eur: 5000 * 0.92 = 4600
    - net_outgoing_payment_eur: 4500 * 0.92 = 4140
    - operation_cost_eur: 100 * 0.92 = 92
    - tax_liq_eur: 300 * 0.92 = 276
    - bonus_liq_eur: 50 * 0.92 = 46
    - duty_liq_eur: 150 * 0.92 = 138
    - unit_quotation_eur: 20 * 0.92 = 18.4
    - asset_value_cur: 5000 (= gross_outgoing_cur)
    - asset_value_eur: 4600 (= gross_outgoing_eur)
  And il sistema esegue le validazioni warning (vedi AC-VAL-004, AC-VAL-005)
  And il record viene salvato con nuovo row_id
  And la testata viene aggiornata (rows_imported +1, run_end_date now())
```

### AC-REC-005: Modifica Record Esistente

**Scenario:** Modifica campo esistente con ricalcolo automatico

```gherkin
Given il record con id=100 ha:
    - tipo: ASV
    - import_tracking_id: 90
    - field_04 (company): "Old Company"
    - field_36 (units_invested): 500
    - field_38 (unit_quotation_cur): 10
    - field_40 (asset_value_cur): 5000
    - field_14 (currency): EUR
    - field_15 (exchange_rate): 1
  And la testata id=90 ha run_end_date: '2026-02-10 12:00:00'
When l'utente clicca sull'icona modifica (matita) per il record id=100
Then si apre una modale con titolo "Modifica Record - ASV"
  And tutti i campi sono pre-compilati con i valori correnti
When l'utente modifica:
    - company da "Old Company" a "New Company Ltd"
    - exchange_rate da "1" a "1.1"
  And l'utente clicca "Salva"
Then il sistema ricalcola automaticamente:
    - unit_quotation_eur: 10 * 1.1 = 11
    - asset_value_eur: 5000 * 1.1 = 5500
  And viene eseguita una chiamata POST con action=record_save, id=100
  And il backend esegue una transazione batch:
    1. UPDATE data.import_data_flat SET field_04='New Company Ltd', field_15='1.1', field_39='11', field_41='5500' WHERE id=100
    2. UPDATE data.import_tracking SET run_end_date=now() WHERE id=90
  And la modale si chiude
  And il record id=100 mostra i nuovi valori nella tabella
  And la testata id=90 ha run_end_date aggiornato a timestamp corrente
```

### AC-REC-006: Duplicazione Record

**Scenario:** Duplica record esistente con modifiche prima del salvataggio

```gherkin
Given il record con id=200 (tipo EMP) ha:
    - import_tracking_id: 100
    - row_id: 5
    - field_04 (company): "Duplicate Corp"
    - field_16 (gross_premium_cur): 8000
    - field_18 (invested_premium_cur): 7600
    - field_36 (units_invested): 760
  And la testata id=100 ha rows_imported=5
When l'utente clicca sull'icona duplica (copia) per il record id=200
Then si apre una modale con titolo "Duplica Record - EMP"
  And tutti i campi sono pre-compilati con i valori del record id=200
  And il campo id NON è presente (sarà autogenerato)
  And il campo row_id NON è presente (sarà autogenerato)
When l'utente modifica:
    - gross_premium_cur da "8000" a "10000"
    - invested_premium_cur da "7600" a "9500"
    - units_invested da "760" a "950"
  And l'utente clicca "Salva"
Then viene eseguita una chiamata POST con action=record_save (senza id, quindi insert)
  And il backend crea un NUOVO record con:
    - id: autogenerato (es. 299)
    - import_tracking_id: 100
    - row_id: 6 (MAX(row_id)+1 per testata 100)
    - field_04: "Duplicate Corp" (invariato)
    - field_16: "10000" (modificato)
    - field_18: "9500" (modificato)
    - field_36: "950" (modificato)
    - field_01, field_02, source_filename: rigenerati automaticamente
  And il backend aggiorna rows_imported=6, run_end_date=now() per testata id=100
  And la modale si chiude
  And il nuovo record appare nella tabella con row_id=6
  But il record originale id=200 con row_id=5 rimane invariato
```

### AC-REC-007: Cancellazione Record con Ricalcolo row_id

**Scenario:** Cancella record intermedio e ricompatta row_id

```gherkin
Given la testata id=110 ha 5 record con row_id: 1, 2, 3, 4, 5
  And i record hanno rispettivamente id: 301, 302, 303, 304, 305
  And la testata ha rows_imported=5, run_end_date='2026-02-15 08:00:00'
When l'utente clicca sull'icona cancella (cestino) per il record id=303 (row_id=3)
Then appare una modale di conferma "Sei sicuro di voler cancellare questo record?"
When l'utente clicca "Conferma"
Then viene eseguita una chiamata POST con action=record_delete, id=303, import_tracking_id=110
  And il backend esegue una transazione batch:
    1. DELETE FROM data.import_data_flat WHERE id=303
    2. UPDATE data.import_data_flat SET row_id = sub.new_row_id
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY row_id) AS new_row_id
         FROM data.import_data_flat
         WHERE import_tracking_id = 110
       ) AS sub
       WHERE data.import_data_flat.id = sub.id
         AND data.import_data_flat.row_id != sub.new_row_id
    3. UPDATE data.import_data_flat SET field_02 = row_id::text WHERE import_tracking_id = 110
    4. UPDATE data.import_tracking SET rows_imported=4, run_end_date=now() WHERE id=110
  And la modale si chiude
  And la tabella viene ricaricata
  And ora ci sono 4 record con row_id: 1, 2, 3, 4
  And i record id=301, 302 mantengono row_id=1, 2
  And i record id=304, 305 hanno ora row_id=3, 4 (erano 4, 5)
  And la testata id=110 ha rows_imported=4 e run_end_date aggiornato
```

### AC-REC-008: Paginazione Record

**Scenario:** Navigazione tra pagine record

```gherkin
Given la testata id=120 ha 75 record
  And la paginazione è impostata su 20 (default)
When l'utente apre il dettaglio testata id=120
Then vengono mostrati i record con row_id da 1 a 20
  And i controlli paginazione mostrano "Pagina 1 di 4"
When l'utente clicca su "Pagina 3"
Then vengono mostrati i record con row_id da 41 a 60
When l'utente seleziona "100" dal dropdown paginazione
Then vengono mostrati tutti i 75 record in una sola pagina
  And i controlli mostrano "Pagina 1 di 1"
```

### AC-REC-009: Filtro Record

**Scenario:** Ricerca per company e policy_number

```gherkin
Given la vista record mostra 50 record
  And 5 record hanno field_04 (company) contenente "ACME"
  And 3 record hanno field_06 (policy_number) contenente "ACME"
  And 1 record ha entrambi i campi con "ACME" (sovrapposizione)
When l'utente digita "ACME" nel campo filtro
Then vengono mostrati 7 record unici (5+3-1)
  And tutte le righe contengono "ACME" in almeno una colonna
When l'utente digita "POL123" nel filtro (sostituisce "ACME")
Then vengono mostrati solo i record con policy_number contenente "POL123"
```

### AC-REC-010: Sort Record per Colonna Tipo-Specifica

**Scenario:** Ordinamento colonna field_36/37 (units invested/disinvested)

```gherkin
Given la vista record mostra 10 record:
    - 4 record ASV con field_36: 100, 200, 300, 400
    - 3 record EMP con field_36: 150, 250, 350
    - 3 record PSR con field_37: 50, 75, 125
  And la tabella è ordinata per row_id (default)
When l'utente clicca sull'header della colonna "field_36/37" (1° click)
Then i record vengono ordinati per il valore numerico presente in quella colonna ASC
  And l'ordine diventa: PSR(50), PSR(75), ASV(100), EMP(150), ASV(200), PSR(125), EMP(250), ASV(300), EMP(350), ASV(400)
  And appare icona freccia verso l'alto
When l'utente clicca nuovamente (2° click)
Then l'ordinamento diventa DESC
When l'utente clicca una terza volta (3° click)
Then si torna all'ordinamento default per row_id
```

---

## AC-MOD: Accettazione Modali

### AC-MOD-001: Autocomplete company con Debounce

**Scenario:** Digitazione con pausa > 1 secondo

```gherkin
Given l'utente ha aperto una modale record
  And il campo company è vuoto
When l'utente digita "A" (1 carattere)
  And attende 1.5 secondi
Then NON viene effettuata alcuna chiamata Ajax (min 2 caratteri)
When l'utente digita "C" (totale "AC", 2 caratteri)
  And attende 1.5 secondi
Then viene effettuata una chiamata GET a:
  ajax_import_settimanale_view.php?action=autocomplete&field=company&query=AC
  And il backend restituisce max 20 suggerimenti con company name ILIKE '%AC%'
  And appare un dropdown con i suggerimenti sotto il campo
When l'utente seleziona "ACME Corporation" dal dropdown
Then il campo company viene popolato con "ACME Corporation"
  And il dropdown scompare
```

### AC-MOD-002: Autocomplete company con Debounce Reset

**Scenario:** Digitazione rapida che resetta il timer

```gherkin
Given l'utente ha aperto una modale record
  And il campo company è vuoto
When l'utente digita "AC" (2 caratteri)
  And attende 0.5 secondi (< 1 secondo)
  And digita "M" (totale "ACM", 3 caratteri)
  And attende 0.5 secondi
  And digita "E" (totale "ACME", 4 caratteri)
  And attende 1.5 secondi
Then viene effettuata una SOLA chiamata Ajax con query="ACME"
  But NON vengono effettuate chiamate per "AC" o "ACM"
```

### AC-MOD-003: Autocomplete fund_code con Auto-fill fund_description

**Scenario:** Selezione fund_code popola automaticamente description

```gherkin
Given l'utente ha aperto una modale record
  And il campo fund_code è vuoto
  And il campo fund_description è vuoto (readonly)
When l'utente digita "FD" nel campo fund_code
  And attende 1.5 secondi
Then viene effettuata chiamata autocomplete per fund_code
  And il backend restituisce:
    [{value: "FD001", label: "FD001", description: "Fondo Azionario Globale"},
     {value: "FD002", label: "FD002", description: "Fondo Obbligazionario Europa"}]
When l'utente seleziona "FD001" dal dropdown
Then il campo fund_code viene impostato a "FD001"
  And il campo fund_description viene AUTOMATICAMENTE impostato a "Fondo Azionario Globale"
```

### AC-MOD-004: Calcolo _eur in Tempo Reale per ASV

**Scenario:** Modifica exchange_rate ricalcola tutti i campi _eur

```gherkin
Given modale ASV aperta con:
    - currency: EUR
    - exchange_rate: 1
    - unit_quotation_cur: 10
    - unit_quotation_eur: 10 (calcolato)
    - asset_value_cur: 1000
    - asset_value_eur: 1000 (calcolato)
When l'utente cambia currency da "EUR" a "CHF"
  And digita "1.05" nel campo exchange_rate
Then IMMEDIATAMENTE (senza salvare):
    - unit_quotation_eur viene ricalcolato a 10.5 (10 * 1.05)
    - asset_value_eur viene ricalcolato a 1050 (1000 * 1.05)
  And i campi readonly vengono aggiornati visivamente
```

### AC-MOD-005: Calcolo _eur in Tempo Reale per Operazione Positiva

**Scenario:** Modifica gross_premium_cur ricalcola gross_premium_eur

```gherkin
Given modale EMP aperta con:
    - currency: USD
    - exchange_rate: 0.92
    - gross_premium_cur: 5000
    - gross_premium_eur: 4600 (calcolato)
When l'utente modifica gross_premium_cur da "5000" a "10000"
Then IMMEDIATAMENTE:
    - gross_premium_eur viene ricalcolato a 9200 (10000 * 0.92)
When l'utente modifica exchange_rate da "0.92" a "0.95"
Then IMMEDIATAMENTE:
    - gross_premium_eur viene ricalcolato a 9500 (10000 * 0.95)
    - invested_premium_eur, entry_fee_eur, entry_expenses_eur vengono ricalcolati
    - unit_quotation_eur viene ricalcolato
```

### AC-MOD-006: Auto-fill asset_value per Operazione Positiva

**Scenario:** invested_premium_cur auto-popola asset_value_cur

```gherkin
Given modale VAI aperta con:
    - invested_premium_cur: vuoto
    - asset_value_cur: vuoto (readonly)
When l'utente digita "7500" in invested_premium_cur
Then IMMEDIATAMENTE:
    - asset_value_cur viene impostato a "7500" (uguale a invested_premium_cur)
When l'utente modifica invested_premium_cur a "8000"
Then asset_value_cur viene aggiornato a "8000"
```

### AC-MOD-007: Auto-fill asset_value per Operazione Negativa

**Scenario:** gross_outgoing_cur auto-popola asset_value_cur

```gherkin
Given modale CLM aperta con:
    - gross_outgoing_cur: vuoto
    - asset_value_cur: vuoto (readonly)
When l'utente digita "3000" in gross_outgoing_cur
Then IMMEDIATAMENTE:
    - asset_value_cur viene impostato a "3000" (uguale a gross_outgoing_cur)
```

---

## AC-VAL: Accettazione Validazioni Warning

### AC-VAL-001: Warning ASV - Formula Unità per Quotazione

**Scenario:** Prodotto unità × quotazione diverso da valore patrimoniale

```gherkin
Given modale ASV con:
    - units_invested: 100
    - unit_quotation_cur: 10
    - asset_value_cur: 999 (dovrebbe essere 1000)
When l'utente clicca "Salva"
Then appare un banner warning giallo con messaggio:
  "Attenzione: units_invested × unit_quotation_cur ≠ asset_value_cur (100 × 10 = 1000, ma asset_value_cur = 999)"
  And il bottone "Salva" diventa "Conferma salvataggio"
  And il bottone "Annulla" rimane disponibile
When l'utente clicca "Conferma salvataggio"
Then il record viene salvato con i valori inseriti (999)
  And la modale si chiude

Scenario alternativo: correzione utente
Given il warning è mostrato
When l'utente clicca "Annulla"
Then il warning scompare
  And la modale rimane aperta con i valori correnti
When l'utente modifica asset_value_cur da "999" a "1000"
  And clicca nuovamente "Salva"
Then NON appare alcun warning
  And il record viene salvato immediatamente
```

### AC-VAL-002: Warning Positivo - Formula Premio Lordo vs Investito

**Scenario:** Differenza premio lordo-investito diversa da somma commissioni

```gherkin
Given modale EMP con:
    - gross_premium_cur: 10000
    - invested_premium_cur: 9000
    - entry_fee_cur: 500
    - entry_expenses_cur: 400
    # Differenza: 10000 - 9000 = 1000
    # Commissioni: 500 + 400 = 900 (≠ 1000)
When l'utente clicca "Salva"
Then appare un banner warning:
  "Attenzione: gross_premium_cur - invested_premium_cur ≠ entry_fee_cur + entry_expenses_cur (10000 - 9000 = 1000, ma 500 + 400 = 900)"
  And il salvataggio è possibile cliccando "Conferma salvataggio"
```

### AC-VAL-003: Warning Positivo - Formula Unità Investite

**Scenario:** Prodotto unità × quotazione diverso da premio investito

```gherkin
Given modale SWI con:
    - units_invested: 950
    - unit_quotation_cur: 10
    - invested_premium_cur: 9400 (dovrebbe essere 9500)
When l'utente clicca "Salva"
Then appare un banner warning:
  "Attenzione: units_invested × unit_quotation_cur ≠ invested_premium_cur (950 × 10 = 9500, ma invested_premium_cur = 9400)"
  And il salvataggio è possibile dopo conferma
```

### AC-VAL-004: Warning Negativo - Formula Uscita Lorda vs Netta

**Scenario:** Differenza uscita lorda-netta diversa da somma costi/tasse/bollo-bonus

```gherkin
Given modale PSR con:
    - gross_outgoing_cur: 5000
    - net_outgoing_payment_cur: 4500
    - operation_cost_cur: 100
    - tax_liq_cur: 200
    - duty_liq_cur: 150
    - bonus_liq_cur: 50
    # Differenza: 5000 - 4500 = 500
    # Somma: 100 + 200 + 150 - 50 = 400 (≠ 500)
When l'utente clicca "Salva"
Then appare un banner warning:
  "Attenzione: gross_outgoing_cur - net_outgoing_payment_cur ≠ operation_cost_cur + tax_liq_cur + duty_liq_cur - bonus_liq_cur (5000 - 4500 = 500, ma 100 + 200 + 150 - 50 = 400)"
  And il salvataggio è possibile dopo conferma
```

### AC-VAL-005: Warning Negativo - Formula Unità Disinvestite

**Scenario:** Prodotto unità × quotazione diverso da uscita lorda

```gherkin
Given modale TSR con:
    - units_disinvested: 300
    - unit_quotation_cur: 20
    - gross_outgoing_cur: 5999 (dovrebbe essere 6000)
When l'utente clicca "Salva"
Then appare un banner warning:
  "Attenzione: units_disinvested × unit_quotation_cur ≠ gross_outgoing_cur (300 × 20 = 6000, ma gross_outgoing_cur = 5999)"
  And il salvataggio è possibile dopo conferma
```

### AC-VAL-006: Multipli Warning Simultanei

**Scenario:** Record positivo con entrambe le validazioni fallite

```gherkin
Given modale EMP con:
    - gross_premium_cur: 10000
    - invested_premium_cur: 9000
    - entry_fee_cur: 500
    - entry_expenses_cur: 400
    # Warning 1: 10000 - 9000 ≠ 500 + 400
    - units_invested: 900
    - unit_quotation_cur: 10
    # Warning 2: 900 × 10 = 9000 ma invested_premium_cur = 9000 (OK in questo caso)
When l'utente clicca "Salva"
Then appare un banner con TUTTI i warning applicabili:
  - "Attenzione: gross_premium_cur - invested_premium_cur ≠ entry_fee_cur + entry_expenses_cur (...)"
  And il banner contiene un elenco puntato se ci sono più warning
  And il salvataggio è possibile dopo conferma
```

---

## AC-API: Accettazione Endpoint

### AC-API-001: Endpoint config - Successo

**Scenario:** Richiesta configurazione in modalità DEV

```gherkin
Given ENV_IS_DEV è impostato a true
  And il file settimanale_settings.json contiene mapping tipi record validi
When il frontend effettua GET a ajax_import_settimanale_view.php?action=config
Then il backend restituisce HTTP 200 con JSON:
{
  "success": true,
  "data": {
    "is_dev": true,
    "import_main_id": 1120,
    "record_types": [
      {
        "import_record_id": 112005,
        "code": "EMP",
        "sign": "+",
        "fields": ["field_04", "field_06", ..., "field_16", "field_17", ...]
      },
      {
        "import_record_id": 112006,
        "code": "ASV",
        "sign": null,
        "fields": ["field_04", "field_06", ..., "field_36", "field_38", ...]
      },
      ...
    ]
  }
}
```

### AC-API-002: Endpoint headers - Successo

**Scenario:** Richiesta elenco testate

```gherkin
Given il database contiene 3 testate:
    - id=1, filename="Import A", run_start_date='2026-02-01 10:00', rows_imported=5
    - id=2, filename="Import B", run_start_date='2026-02-10 11:00', rows_imported=0
    - id=3, filename="Import C", run_start_date='2026-02-15 12:00', rows_imported=10
When il frontend effettua GET a ajax_import_settimanale_view.php?action=headers
Then il backend restituisce HTTP 200 con JSON:
{
  "success": true,
  "data": [
    {
      "id": 3,
      "run_start_date": "2026-02-15 12:00:00",
      "run_end_date": "2026-02-15 14:30:00",
      "filename": "Import C",
      "status_text": "Iniziale",
      "rows_imported": 10,
      "rows_rejected": 0,
      "rows_recovered": 0,
      "last_check_start": null,
      "last_check_end": null,
      "last_post_start": null,
      "last_post_end": null
    },
    {
      "id": 2,
      ...
    },
    {
      "id": 1,
      ...
    }
  ]
}
  And le testate sono ordinate per run_start_date DESC (id 3, 2, 1)
```

### AC-API-003: Endpoint records - Successo

**Scenario:** Richiesta record per testata specifica

```gherkin
Given la testata id=50 contiene 2 record:
    - id=100, row_id=1, field_01="ASV", field_04="ACME", field_36="1000"
    - id=101, row_id=2, field_01="EMP", field_04="Beta", field_16="5000"
When il frontend effettua GET a ajax_import_settimanale_view.php?action=records&tracking_id=50
Then il backend restituisce HTTP 200 con JSON:
{
  "success": true,
  "data": [
    {
      "id": 100,
      "row_id": 1,
      "import_record_id": 112006,
      "source_filename": "Testata filename",
      "field_01": "ASV",
      "field_02": "1",
      "field_04": "ACME",
      ...
      "field_36": "1000",
      ...
      "field_50": "10/02/2026"
    },
    {
      "id": 101,
      "row_id": 2,
      ...
    }
  ]
}
  And i record sono ordinati per row_id ASC
```

### AC-API-004: Endpoint autocomplete - Successo company

**Scenario:** Ricerca company con risultati multipli

```gherkin
Given la tabella company contiene:
    - "ACME Corporation"
    - "ACME Insurance"
    - "ACME Assurance"
    - "Beta Corp"
When il frontend effettua GET a ajax_import_settimanale_view.php?action=autocomplete&field=company&query=ACME
Then il backend restituisce HTTP 200 con JSON:
{
  "success": true,
  "data": [
    {"value": "ACME Assurance", "label": "ACME Assurance"},
    {"value": "ACME Corporation", "label": "ACME Corporation"},
    {"value": "ACME Insurance", "label": "ACME Insurance"}
  ]
}
  And i risultati sono ordinati alfabeticamente
  And sono limitati a max 20 elementi
```

### AC-API-005: Endpoint autocomplete - Successo fund_code con description

**Scenario:** Ricerca fund_code che restituisce anche description

```gherkin
Given la tabella fund contiene:
    - code="FD001", description="Fondo Azionario Globale"
    - code="FD002", description="Fondo Obbligazionario"
When il frontend effettua GET a ajax_import_settimanale_view.php?action=autocomplete&field=fund_code&query=FD
Then il backend restituisce HTTP 200 con JSON:
{
  "success": true,
  "data": [
    {
      "value": "FD001",
      "label": "FD001",
      "description": "Fondo Azionario Globale"
    },
    {
      "value": "FD002",
      "label": "FD002",
      "description": "Fondo Obbligazionario"
    }
  ]
}
```

### AC-API-006: Endpoint header_save - Insert Successo

**Scenario:** Creazione nuova testata via POST

```gherkin
Given il database ha import_main_id=1120 configurato
When il frontend effettua POST a ajax_import_settimanale_save.php con body:
{
  "action": "header_save",
  "filename": "Nuova Testata Test"
}
Then il backend esegue INSERT in data.import_tracking
  And restituisce HTTP 200 con JSON:
{
  "success": true,
  "data": {
    "id": 999,
    "import_main_id": 1120,
    "param_import_status_id": 1,
    "rows_imported": 0,
    "run_start_date": "2026-02-20 10:15:30",
    "run_end_date": null,
    "filename": "Nuova Testata Test",
    "status_text": "Iniziale",
    "rows_rejected": 0,
    "rows_recovered": 0,
    ...
  }
}
```

### AC-API-007: Endpoint header_save - Update Successo con Propagazione

**Scenario:** Modifica filename testata esistente

```gherkin
Given la testata id=42 ha filename="Vecchio" e 3 record figli
When il frontend effettua POST a ajax_import_settimanale_save.php con body:
{
  "action": "header_save",
  "id": 42,
  "filename": "Nuovo Aggiornato"
}
Then il backend esegue transazione batch:
    1. UPDATE data.import_tracking SET filename='Nuovo Aggiornato' WHERE id=42
    2. UPDATE data.import_data_flat SET source_filename='Nuovo Aggiornato' WHERE import_tracking_id=42
  And in caso di successo restituisce HTTP 200 con testata completa aggiornata
  And in caso di errore esegue rollback e restituisce errore
```

### AC-API-008: Endpoint record_save - Insert Successo

**Scenario:** Creazione nuovo record ASV

```gherkin
Given la testata id=60 ha rows_imported=2, ultimo row_id=2
When il frontend effettua POST a ajax_import_settimanale_save.php con body:
{
  "action": "record_save",
  "import_tracking_id": 60,
  "import_record_id": 112006,
  "fields": {
    "field_04": "ACME",
    "field_06": "POL123",
    "field_11": "FD",
    "field_12": "FD001",
    "field_13": "Fondo Test",
    "field_14": "EUR",
    "field_15": "1",
    "field_36": "1000",
    "field_38": "10",
    "field_39": "10",
    "field_40": "10000",
    "field_41": "10000",
    "field_49": "20/02/2026",
    "field_50": "20/02/2026"
  }
}
Then il backend esegue transazione batch:
    1. INSERT INTO data.import_data_flat (import_tracking_id, row_id, import_record_id, field_01, field_02, field_04, ..., source_filename)
       VALUES (60, 3, 112006, 'ASV', '3', 'ACME', ..., '<filename testata 60>')
    2. UPDATE data.import_tracking SET rows_imported=3, run_end_date=now() WHERE id=60
  And restituisce HTTP 200 con record completo appena creato
```

### AC-API-009: Endpoint record_save - Update Successo

**Scenario:** Modifica record esistente

```gherkin
Given il record id=100 esiste con field_04="Old Company"
  And il record appartiene a testata id=70
When il frontend effettua POST con body:
{
  "action": "record_save",
  "id": 100,
  "import_tracking_id": 70,
  "import_record_id": 112006,
  "fields": {
    "field_04": "New Company",
    ...
  }
}
Then il backend esegue transazione batch:
    1. UPDATE data.import_data_flat SET field_04='New Company', ... WHERE id=100
    2. UPDATE data.import_tracking SET run_end_date=now() WHERE id=70
  And restituisce HTTP 200 con record aggiornato
```

### AC-API-010: Endpoint record_delete - Successo con Ricalcolo

**Scenario:** Cancellazione record con ricalcolo row_id

```gherkin
Given la testata id=80 ha 4 record con row_id: 1,2,3,4 (id: 201,202,203,204)
  And rows_imported=4
When il frontend effettua POST con body:
{
  "action": "record_delete",
  "id": 203,
  "import_tracking_id": 80
}
Then il backend esegue transazione batch:
    1. DELETE FROM data.import_data_flat WHERE id=203
    2. UPDATE (ricalcolo row_id con window function)
    3. UPDATE (field_02 = row_id)
    4. UPDATE data.import_tracking SET rows_imported=3, run_end_date=now() WHERE id=80
  And restituisce HTTP 200 con JSON:
{
  "success": true,
  "data": {
    "deleted_id": 203,
    "updated_header": {
      "id": 80,
      "rows_imported": 3,
      "run_end_date": "2026-02-20 15:45:00"
    }
  }
}
```

---

## AC-ERR: Accettazione Gestione Errori

### AC-ERR-001: Errore Backend in Modalità DEV

**Scenario:** Eccezione database con ENV_IS_DEV=true

```gherkin
Given ENV_IS_DEV è true
  And il database è irraggiungibile (es. connessione persa)
When il frontend effettua GET a ajax_import_settimanale_view.php?action=headers
Then il backend cattura l'eccezione PDO
  And restituisce HTTP 200 con JSON:
{
  "success": false,
  "message": "Errore database: impossibile connettersi al server PostgreSQL",
  "exception": "PDOException: SQLSTATE[08006] ... at /path/to/file.php:123\nStack trace:\n#0 ..."
}
When il frontend riceve la risposta
Then viene mostrato un banner rosso con:
    - Titolo: "Errore"
    - Messaggio: "Errore database: impossibile connettersi al server PostgreSQL"
    - Sezione espandibile "Dettagli tecnici" con lo stack trace completo
```

### AC-ERR-002: Errore Backend in Modalità PROD

**Scenario:** Eccezione database con ENV_IS_DEV=false

```gherkin
Given ENV_IS_DEV è false
  And il database è irraggiungibile
When il frontend effettua GET a ajax_import_settimanale_view.php?action=headers
Then il backend cattura l'eccezione PDO
  And restituisce HTTP 200 con JSON:
{
  "success": false,
  "message": "Errore database: impossibile connettersi al server PostgreSQL"
}
  But NON include il campo "exception"
When il frontend riceve la risposta
Then viene mostrato un banner rosso con:
    - Titolo: "Errore"
    - Messaggio: "Errore database: impossibile connettersi al server PostgreSQL"
  But NON appare alcuna sezione "Dettagli tecnici"
  And lo stack trace non è visibile all'utente
```

### AC-ERR-003: Errore Validazione Backend

**Scenario:** Tentativo cancellazione testata con record (errore business logic)

```gherkin
Given ENV_IS_DEV è false
  And la testata id=99 ha rows_imported=5
When il frontend tenta POST con action=header_delete, id=99
Then il backend esegue il pre-check
  And rileva violazione regola business (rows_imported > 0)
  And restituisce HTTP 200 con JSON:
{
  "success": false,
  "message": "Impossibile cancellare testata con record associati (rows_imported=5)"
}
When il frontend riceve la risposta
Then viene mostrato un banner arancione (warning) con il messaggio
  And la testata id=99 rimane visibile nella tabella
```

### AC-ERR-004: Errore Network Frontend

**Scenario:** Timeout connessione durante chiamata Ajax

```gherkin
Given il server backend impiega più di 30 secondi a rispondere
When il frontend effettua una chiamata Ajax
Then dopo 30 secondi il browser solleva un timeout error
  And il frontend cattura l'errore nel .catch()
  And viene mostrato un banner rosso con messaggio:
    "Errore di connessione: timeout della richiesta. Verificare la connessione di rete."
```

### AC-ERR-005: Errore Transazione Rollback

**Scenario:** Fallimento batch transaction durante propagazione filename

```gherkin
Given ENV_IS_DEV è true
  And la testata id=50 ha 1000 record figli
  And il 500° record ha un vincolo di integrità che impedisce l'update (scenario forzato)
When il frontend effettua POST per modificare filename testata id=50
Then il backend inizia la transazione batch:
    1. UPDATE data.import_tracking (successo)
    2. UPDATE data.import_data_flat record 1-499 (successo)
    3. UPDATE record 500 (ERRORE: violazione vincolo)
  And il backend esegue rollback completo
  And restituisce HTTP 200 con JSON:
{
  "success": false,
  "message": "Errore durante propagazione filename ai record figli",
  "exception": "PDOException: SQLSTATE[23503] ... integrity constraint violation ..."
}
  And la testata id=50 mantiene il filename originale
  And tutti i record figli mantengono il source_filename originale (grazie al rollback)
```

### AC-ERR-006: Errore Missing Parameter

**Scenario:** Chiamata API con parametro mancante

```gherkin
Given ENV_IS_DEV è false
When il frontend effettua GET a ajax_import_settimanale_view.php?action=records
  But omette il parametro tracking_id
Then il backend rileva parametro mancante
  And restituisce HTTP 200 con JSON:
{
  "success": false,
  "message": "Parametro obbligatorio mancante: tracking_id"
}
When il frontend riceve la risposta
Then viene mostrato un banner rosso con il messaggio di errore
```

---

## AC-INT: Accettazione Integrazione e UX

### AC-INT-001: Workflow Completo Inserimento Testata + Record

**Scenario:** Happy path completo da zero a salvataggio

```gherkin
Given l'utente accede all'applicazione per la prima volta
  And il database è vuoto (0 testate)
When l'utente clicca sull'icona "+" per nuova testata
  And inserisce filename "Import Febbraio 2026"
  And clicca "Salva"
Then viene creata testata id=1 con rows_imported=0
  And l'utente visualizza la tabella testate con 1 riga
When l'utente clicca sull'icona occhio per id=1
Then la vista cambia a record
  And la tabella è vuota (0 record)
  And appaiono i bottoni tipo record (ASV, EMP, VAI, ...)
When l'utente clicca sul bottone "ASV"
  And compila tutti i campi obbligatori
  And clicca "Salva"
Then viene creato record id=1, row_id=1
  And la tabella mostra 1 record
  And la testata id=1 ora ha rows_imported=1, run_end_date popolato
When l'utente clicca "Torna a Testate"
Then la vista torna a testate
  And la riga id=1 mostra "Inseriti: 1"
```

### AC-INT-002: Workflow Modifica e Cancellazione

**Scenario:** Modifica record esistente poi cancella

```gherkin
Given la testata id=10 ha 3 record (row_id 1,2,3)
  And l'utente è nella vista record
When l'utente clicca sull'icona modifica per row_id=2
  And modifica field_04 da "ACME" a "Beta Corp"
  And clicca "Salva"
Then il record viene aggiornato
  And run_end_date testata viene aggiornato
  But rows_imported rimane 3
When l'utente clicca sull'icona cancella per row_id=2
  And conferma la cancellazione
Then il record row_id=2 viene eliminato
  And i record rimanenti diventano row_id 1,2 (ex 1,3)
  And rows_imported testata diventa 2
  And run_end_date testata viene aggiornato
```

### AC-INT-003: Workflow Duplicazione con Modifica

**Scenario:** Duplica record e modifica prima di salvare

```gherkin
Given il record id=100 (tipo EMP) ha gross_premium_cur=5000
  And l'utente è nella vista record
When l'utente clicca sull'icona duplica per id=100
Then si apre modale pre-compilata con tutti i valori di id=100
When l'utente modifica gross_premium_cur da "5000" a "7500"
  And modifica invested_premium_cur proporzionalmente
  And clicca "Salva"
Then viene creato un NUOVO record con id autogenerato, row_id incrementato
  And il nuovo record ha gross_premium_cur=7500
  But il record originale id=100 rimane con gross_premium_cur=5000
  And rows_imported testata viene incrementato
```

### AC-INT-004: Persistenza Stato Vista Testate

**Scenario:** Navigazione a record e ritorno mantiene filtri/sort/paginazione

```gherkin
Given l'utente è nella vista testate
  And ha impostato:
    - Filtro: "Febbraio"
    - Paginazione: 50 record per pagina
    - Sort: filename ASC
  And vede 15 testate filtrate
When l'utente apre il dettaglio di una testata
  And poi clicca "Torna a Testate"
Then la vista testate viene ripristinata con:
    - Filtro: ancora "Febbraio"
    - Paginazione: ancora 50 record per pagina
    - Sort: ancora filename ASC
    - Stesse 15 testate visibili
```

### AC-INT-005: Responsive Design Base

**Scenario:** Utilizzo su schermi di dimensioni diverse

```gherkin
Given l'utente accede da desktop (1920x1080)
When la pagina viene caricata
Then le tabelle sono visualizzate con tutte le colonne affiancate
  And i bottoni hanno dimensioni standard

Given l'utente accede da tablet (768x1024)
When la pagina viene caricata
Then le tabelle possono avere scroll orizzontale per colonne numerose
  And le modali sono centrate e ridimensionate
  And i controlli touch-friendly hanno area cliccabile adeguata
```

---

## Checklist Test Finale

Questa checklist deve essere verificata prima del rilascio:

### Testate
- [ ] Visualizzazione elenco completo
- [ ] Creazione nuova testata
- [ ] Modifica filename con propagazione
- [ ] Cancellazione permessa (rows_imported=0, status_id=1)
- [ ] Cancellazione negata (rows_imported>0 OR status_id≠1)
- [ ] Paginazione 20/50/100
- [ ] Filtro client-side su tutte le colonne
- [ ] Sort tri-state su almeno 3 colonne diverse
- [ ] Navigazione a vista record e ritorno

### Record
- [ ] Visualizzazione elenco per testata
- [ ] Inserimento record ASV con tutti i campi
- [ ] Inserimento record positivo (EMP, VAI, SWI)
- [ ] Inserimento record negativo (PSR, TSR, CLM, TRU, DMF, DDC, SWO)
- [ ] Modifica record esistente
- [ ] Duplicazione record con modifiche
- [ ] Cancellazione record con ricalcolo row_id
- [ ] Paginazione 20/50/100
- [ ] Filtro client-side
- [ ] Sort tri-state su colonne tipo-specifiche

### Modali
- [ ] Autocomplete company (min 2 char, debounce 1s)
- [ ] Autocomplete policy_number (min 2 char, debounce 1s)
- [ ] Autocomplete fund_code con auto-fill fund_description (min 2 char, debounce 1s)
- [ ] Calcolo _eur in tempo reale per tutti i campi *_cur
- [ ] Auto-fill asset_value per operazioni positive/negative
- [ ] Validazione warning ASV (field_36 * field_38 ≠ field_40)
- [ ] Validazione warning Positivo (formula 1 e 2)
- [ ] Validazione warning Negativo (formula 1 e 2)
- [ ] Conferma cancellazione record

### API
- [ ] GET config ritorna payload completo
- [ ] GET headers ritorna testate ordinate DESC
- [ ] GET records ritorna record per testata ordinati per row_id
- [ ] GET autocomplete company ritorna max 20 suggerimenti
- [ ] GET autocomplete policy_number ritorna max 20 suggerimenti
- [ ] GET autocomplete fund_code ritorna codice + description
- [ ] POST header_save insert crea testata corretta
- [ ] POST header_save update propaga filename in transazione
- [ ] POST record_save insert crea record e aggiorna testata
- [ ] POST record_save update modifica record e aggiorna testata
- [ ] POST record_delete cancella, ricalcola row_id, aggiorna testata

### Errori
- [ ] Errore backend in DEV mostra messaggio + stack trace
- [ ] Errore backend in PROD mostra solo messaggio
- [ ] Errore validazione business logic mostra warning
- [ ] Errore network/timeout mostra messaggio appropriato
- [ ] Rollback transazione in caso di errore batch

### Integrazione
- [ ] Workflow completo inserimento testata + record
- [ ] Workflow modifica + cancellazione
- [ ] Workflow duplicazione
- [ ] Persistenza stato vista (filtri, sort, paginazione)
- [ ] Colori bottoni tipo record generati correttamente (freddi/caldi/verde)

### Nuove Feature v2.0
- [ ] Lock/unlock testata (lucchetto aperto/chiuso)
- [ ] Guardia modifiche: nessuna operazione su testata bloccata (stato != 1)
- [ ] Drag-and-drop riordinamento record con grip handle
- [ ] Breadcrumb navigazione "Import Settimanale > {filename}"
- [ ] Toast verde dopo operazione riuscita, rosso dopo errore (scompare dopo 3s)
- [ ] Date picker Flatpickr con formato DD/MM/YYYY
- [ ] Bordo sinistro colorato per tipo record (verde/blu/rosso)
- [ ] Celle non applicabili con sfondo grigio
- [ ] Testata modale colorata per tipo record
- [ ] Icona calcolatrice cliccabile per campi calcolati
- [ ] Auto-fill campi calcolati a zero prima del salvataggio
- [ ] Loading overlay solo dopo 300ms
- [ ] Numeri formattati con 2 decimali nella tabella record

---

## Changelog

| Versione | Data | Autore | Modifiche |
|----------|------|--------|-----------|
| 1.0 | 2026-02-20 | agent-ears | Creazione iniziale con 60+ scenari BDD |
| 2.0 | 2026-02-24 | Claude | Aggiornamento paginazione, formato date DD/MM/YYYY, nuove feature v2.0 |

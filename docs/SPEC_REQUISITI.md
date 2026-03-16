# Specifica Requisiti EARS — Settimanale

> **Versione:** 2.0
> **Data:** 2026-02-24
> **Stato:** APPROVATO

---

## Pattern EARS

I requisiti seguono i pattern **EARS** (Easy Approach to Requirements Syntax):

- **Ubiquitous:** Il sistema deve...
- **Event-driven:** QUANDO [evento], il sistema deve...
- **State-driven:** MENTRE [stato], il sistema deve...
- **Optional:** DOVE [condizione], il sistema deve...
- **Unwanted:** SE [condizione indesiderata], ALLORA il sistema deve...

---

## REQ-UI-TST: Interfaccia Testate

### REQ-UI-TST-001: Visualizzazione Elenco Testate
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare l'elenco delle testate (`data.import_tracking`) in forma tabellare con le seguenti colonne: Data inserimento (run_start_date YYYY-MM-DD HH:i), Data ultima modifica (run_end_date YYYY-MM-DD HH:i), Descrizione (filename), Stato (param_import_status_id), Inseriti (rows_imported), Scartati (rows_rejected), Recuperati (rows_recovered), Inizio Check (last_check_start YYYY-MM-DD HH:i), Fine Check (last_check_end YYYY-MM-DD HH:i), Inizio Post (last_post_start YYYY-MM-DD HH:i), Fine Post (last_post_end YYYY-MM-DD HH:i).
- **Rationale:** Gli operatori devono poter visualizzare e monitorare lo stato di tutte le importazioni in un'unica vista.
- **Acceptance Criteria:**
  - **Given:** L'utente accede all'applicazione
  - **When:** La pagina si carica
  - **Then:** Viene mostrata una tabella con tutte le testate ordinate per run_start_date decrescente (i record più recenti in alto)

### REQ-UI-TST-002: Paginazione Testate
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve fornire un controllo di paginazione che permetta di scegliere il numero di record per pagina tra 20, 50 e 100.
- **Rationale:** Per migliorare le prestazioni e l'usabilità con dataset grandi.
- **Acceptance Criteria:**
  - **Given:** L'elenco testate contiene più di 10 record
  - **When:** L'utente seleziona "20" dal menu a tendina della paginazione
  - **Then:** Vengono visualizzati 20 record per pagina con controlli di navigazione (prev/next/page number)

### REQ-UI-TST-003: Filtro Client-Side Testate
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente digita testo in un campo di filtro sopra la tabella, il sistema deve filtrare le righe visualizzate cercando il testo in tutte le colonne visibili (case-insensitive).
- **Rationale:** Per permettere agli operatori di trovare rapidamente testate specifiche senza ricaricare i dati dal server.
- **Acceptance Criteria:**
  - **Given:** La tabella testate mostra 50 record
  - **When:** L'utente digita "ABC" nel campo filtro
  - **Then:** Vengono mostrate solo le righe che contengono "ABC" in almeno una colonna, mantenendo la paginazione sul risultato filtrato

### REQ-UI-TST-004: Sort Tri-State per Colonne Testate
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente clicca sull'intestazione di una colonna, il sistema deve ciclare tra tre stati di ordinamento: nessun ordinamento (default), ascendente, discendente.
- **Rationale:** Gli operatori devono poter ordinare i dati secondo diverse dimensioni per analisi ed esplorazione.
- **Acceptance Criteria:**
  - **Given:** La tabella è nello stato di default (ordinata per run_start_date desc)
  - **When:** L'utente clicca su "Descrizione" (1° click)
  - **Then:** La tabella viene ordinata per filename ascendente
  - **When:** L'utente clicca nuovamente su "Descrizione" (2° click)
  - **Then:** La tabella viene ordinata per filename discendente
  - **When:** L'utente clicca una terza volta su "Descrizione" (3° click)
  - **Then:** La tabella torna all'ordinamento di default

### REQ-UI-TST-005: Icona Dettaglio Testata
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare un'icona occhio nella prima colonna di ogni riga testata che, quando cliccata, apre la vista dettaglio record associati.
- **Rationale:** Navigazione intuitiva verso i dettagli della testata.
- **Acceptance Criteria:**
  - **Given:** L'utente visualizza l'elenco testate
  - **When:** L'utente clicca sull'icona occhio di una testata con id=42
  - **Then:** Viene mostrata la vista record con tutti i record associati a import_tracking_id=42

### REQ-UI-TST-006: Icona Inserimento Nuova Testata
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare un'icona "+" nell'header della prima colonna della tabella testate che, quando cliccata, apre una modale per l'inserimento di una nuova testata richiedendo un campo testuale libero (filename).
- **Rationale:** Permettere agli operatori di creare nuove sessioni di importazione.
- **Acceptance Criteria:**
  - **Given:** L'utente visualizza l'elenco testate
  - **When:** L'utente clicca sull'icona "+"
  - **Then:** Si apre una modale con un campo "Descrizione" vuoto e i bottoni "Salva" e "Annulla"

### REQ-UI-TST-007: Icona Cancellazione Testata
- **Pattern:** State-driven
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare un'icona cestino sempre visibile per ogni riga testata. MENTRE una testata ha rows_imported = 0 E param_import_status_id = 1, l'icona è attiva (colore rosso, cliccabile) e permette la cancellazione; ALTRIMENTI l'icona è disabilitata (colore grigio) e al click mostra un toast di avviso "Impossibile eliminare un'importazione bloccata o contenente delle righe".
- **Rationale:** Prevenire la cancellazione di testate con dati già elaborati o in stato avanzato, mantenendo l'interfaccia visivamente consistente.
- **Acceptance Criteria:**
  - **Given:** Testata con id=10 ha rows_imported=0 e param_import_status_id=1
  - **When:** L'utente visualizza l'elenco
  - **Then:** Nella riga con id=10 l'icona cestino è attiva (rossa, cliccabile)
  - **Given:** Testata con id=11 ha rows_imported=5
  - **When:** L'utente visualizza l'elenco
  - **Then:** Nella riga con id=11 l'icona cestino è disabilitata (grigia)
  - **When:** L'utente clicca sull'icona cestino disabilitata
  - **Then:** Viene mostrato un toast di avviso

### REQ-UI-TST-008: Modifica Filename Testata
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve permettere la modifica del campo filename di una testata tramite un'icona di modifica che apre una modale pre-compilata.
- **Rationale:** Consentire correzioni e aggiornamenti della descrizione testata.
- **Acceptance Criteria:**
  - **Given:** Testata con id=15 ha filename="Vecchia descrizione"
  - **When:** L'utente clicca sull'icona modifica e cambia il testo in "Nuova descrizione", poi salva
  - **Then:** Il campo filename viene aggiornato a "Nuova descrizione" e la modale si chiude

### REQ-UI-TST-009: Colonne Azioni Testata
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare per ogni riga testata, dopo le colonne dati, tre colonne azione nell'ordine: (1) Link esterno (bi-box-arrow-up-right) — attivo (colore link, apre `/import/{id}` in nuova scheda) se param_import_status_id != 1, disabilitato (grigio) se param_import_status_id = 1; (2) Lucchetto — aperto (bi-unlock-fill, verde) se param_import_status_id = 1, chiuso (bi-lock-fill, rosso) se param_import_status_id = 2, chiuso grigio non cliccabile per altri stati; (3) Cestino — come da REQ-UI-TST-007. La colonna Descrizione (filename) deve mostrare testo semplice senza link.
- **Rationale:** Permettere agli operatori di accedere alla vista esterna, bloccare/sbloccare e cancellare le testate con interfaccia chiara.
- **Acceptance Criteria:**
  - **Given:** Testata con param_import_status_id = 1
  - **When:** L'utente visualizza l'elenco
  - **Then:** Il link esterno e' disabilitato (grigio), il lucchetto e' aperto (verde), il cestino segue REQ-UI-TST-007
  - **Given:** Testata con param_import_status_id = 2
  - **When:** L'utente clicca sul lucchetto
  - **Then:** Lo stato diventa 1 (lucchetto aperto, verde)
  - **When:** L'utente clicca sul link esterno
  - **Then:** Si apre una nuova scheda con `/import/{id}`

### REQ-UI-TST-009b: Icone Azioni nella Vista Dettaglio Righe
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare nella vista dettaglio righe, sulla riga informativa "Inserimento: ... | Ultima modifica: ..." allineate a destra, le stesse tre icone della tabella testate nello stesso ordine (Link esterno, Lucchetto, Cestino) con identica logica di abilitazione/disabilitazione. Il filename nel summary della testata deve essere testo semplice senza link.
- **Rationale:** Permettere all'operatore di gestire lo stato della testata direttamente dalla vista dettaglio senza dover tornare alla tabella testate.
- **Acceptance Criteria:**
  - **Given:** L'utente e' nella vista dettaglio di una testata con param_import_status_id = 2
  - **When:** La pagina si carica
  - **Then:** Sulla riga info appaiono le tre icone: link esterno attivo, lucchetto chiuso rosso, cestino disabilitato
  - **When:** L'utente clicca sul lucchetto
  - **Then:** Lo stato diventa 1, il lucchetto diventa aperto verde, il link esterno diventa disabilitato, i bottoni tipo record appaiono

### REQ-UI-TST-010: Guardia Modifiche su Testata Bloccata
- **Pattern:** State-driven
- **Priorità:** Must
- **Statement:** MENTRE una testata ha param_import_status_id diverso da 1, il sistema deve impedire: inserimento, modifica, duplicazione e cancellazione record; modifica filename; drag-and-drop riordinamento. I bottoni tipo record e le icone azione devono essere nascosti.
- **Rationale:** Proteggere i dati delle testate in stato avanzato di elaborazione.
- **Acceptance Criteria:**
  - **Given:** Testata con param_import_status_id = 2
  - **When:** L'utente apre il dettaglio
  - **Then:** Non sono visibili i bottoni tipo record, le icone modifica/duplica/cancella e la drag handle

---

## REQ-UI-REC: Interfaccia Record

### REQ-UI-REC-001: Visualizzazione Elenco Record
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare i record (`data.import_data_flat`) associati a una testata in forma tabellare con colonne nell'ordine seguente: field_02, field_01, field_04, field_06, field_11, field_12, field_13, field_14, field_15, field_49, field_50, field_36/37, field_38, field_39, field_40, field_41, field_16/24, field_17/25, field_18/26, field_19/27, field_20/28, field_21/29, field_22/30, field_23/31, field_34, field_35, field_32, field_33, dove "/" indica colonne tipo-specifiche (positivo/negativo) che mostrano il campo appropriato o cella vuota.
- **Rationale:** Visualizzare tutti i dati rilevanti per le operazioni finanziarie in formato compatto.
- **Acceptance Criteria:**
  - **Given:** La testata con id=20 ha 3 record: 1 ASV, 1 EMP (positivo), 1 PSR (negativo)
  - **When:** L'utente apre il dettaglio
  - **Then:** Vengono mostrate 3 righe con le colonne nell'ordine specificato; per ASV la colonna field_36/37 mostra field_36, per EMP mostra field_36, per PSR mostra field_37

### REQ-UI-REC-002: Paginazione Record
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve fornire un controllo di paginazione per i record con opzioni 20, 50, 100 record per pagina.
- **Rationale:** Gestire dataset grandi con prestazioni ottimali.
- **Acceptance Criteria:**
  - **Given:** La testata contiene 55 record
  - **When:** L'utente seleziona "50" dal menu paginazione
  - **Then:** La prima pagina mostra 50 record, la seconda mostra 5 record

### REQ-UI-REC-003: Filtro Client-Side Record
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente digita testo nel campo filtro sopra la tabella record, il sistema deve filtrare le righe visualizzate cercando il testo in tutte le colonne visibili (case-insensitive).
- **Rationale:** Ricerca rapida senza ricaricamento server.
- **Acceptance Criteria:**
  - **Given:** La tabella record mostra 100 righe
  - **When:** L'utente digita "COMP123" nel filtro
  - **Then:** Vengono mostrate solo le righe che contengono "COMP123" in almeno una colonna

### REQ-UI-REC-004: Sort Tri-State per Colonne Record
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente clicca sull'intestazione di una colonna record, il sistema deve ciclare tra tre stati: nessun ordinamento (default per row_id), ascendente, discendente.
- **Rationale:** Analisi flessibile dei dati.
- **Acceptance Criteria:**
  - **Given:** Tabella ordinata per row_id (default)
  - **When:** L'utente clicca su "fund_code" (field_12) tre volte consecutive
  - **Then:** 1° click → asc per fund_code, 2° click → desc per fund_code, 3° click → ripristino ordinamento default per row_id

### REQ-UI-REC-005: Bottoni Tipo Record Colorati
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare sopra la tabella record una fila di bottoni, uno per ogni tipo record inseribile (ASV, EMP, VAI, SWI, PSR, TSR, CLM, TRU, DMF, DDC, SWO), con label in maiuscolo e colori generati dinamicamente: tonalità fredde (blu/azzurro) per operazioni positive, tonalità calde (rosso/arancio) per operazioni negative, verde per ASV (neutro).
- **Rationale:** Identificazione visiva rapida del tipo operazione e accesso immediato al form di inserimento.
- **Acceptance Criteria:**
  - **Given:** L'utente è nella vista record
  - **When:** La pagina si carica
  - **Then:** Vengono mostrati 11 bottoni (ASV verde, EMP/VAI/SWI tonalità fredde, PSR/TSR/CLM/TRU/DMF/DDC/SWO tonalità calde) con label a 3 lettere maiuscole

### REQ-UI-REC-006: Icone Azione Record
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare per ogni riga record tre icone: modifica, duplica, cancella.
- **Rationale:** Accesso rapido alle operazioni CRUD.
- **Acceptance Criteria:**
  - **Given:** L'utente visualizza un record con id=100
  - **When:** La riga viene renderizzata
  - **Then:** Appaiono tre icone cliccabili: matita (modifica), copia (duplica), cestino (cancella)

### REQ-UI-REC-007: Drag-and-Drop Riordinamento Record
- **Pattern:** Event-driven
- **Priorità:** Should
- **Statement:** QUANDO l'utente trascina un record usando la grip handle, il sistema deve riordinare i record visivamente e persistere il nuovo ordine sul backend aggiornando row_id e field_02.
- **Rationale:** Permettere riordinamento manuale dei record senza dover cancellare e reinserire.
- **Acceptance Criteria:**
  - **Given:** La testata ha 5 record con row_id 1-5
  - **When:** L'utente trascina il record 3 in posizione 1
  - **Then:** I row_id vengono ricalcolati (ex-3 diventa 1, ex-1 diventa 2, ex-2 diventa 3) e il cambiamento persiste dopo reload

### REQ-UI-REC-008: Breadcrumb Navigazione
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve mostrare un breadcrumb Bootstrap nella vista dettaglio record con due livelli: "Import Settimanale" (link per tornare alle testate) > "{filename testata}" (elemento attivo).
- **Rationale:** Navigazione chiara e coerente con pattern UI standard.

### REQ-UI-REC-009: Bordo Sinistro Colorato per Tipo
- **Pattern:** Ubiquitous
- **Priorità:** Should
- **Statement:** Il sistema deve mostrare un bordo sinistro colorato su ogni riga record: verde (#28a745) per ASV, blu (#0d6efd) per operazioni positive, rosso (#dc3545) per operazioni negative.
- **Rationale:** Identificazione visiva immediata del tipo operazione nella tabella.

### REQ-UI-REC-010: Celle Non Applicabili Evidenziate
- **Pattern:** Ubiquitous
- **Priorità:** Should
- **Statement:** Il sistema deve mostrare con sfondo grigio chiaro (#f8f9fa) e testo grigio (#adb5bd) le celle della tabella record che non sono applicabili al tipo operazione di quella riga.
- **Rationale:** Distinguere visivamente campi vuoti da campi non applicabili.

---

## REQ-UI-MOD: Modali e Form

### REQ-UI-MOD-001: Modale Inserimento Record
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente clicca su un bottone tipo record, il sistema deve aprire una modale Bootstrap 5 con un form contenente i campi comuni e i campi specifici per quel tipo (ASV/positivo/negativo), con valori di default appropriati.
- **Rationale:** Guidare l'operatore nell'inserimento con layout personalizzato per tipo.
- **Acceptance Criteria:**
  - **Given:** L'utente è nella vista record della testata id=30
  - **When:** L'utente clicca sul bottone "EMP" (operazione positiva)
  - **Then:** Si apre una modale con titolo "Nuovo Record - EMP" contenente campi comuni (company, policy_number, fund_type, fund_code, fund_description, currency, exchange_rate, operation_date, effect_date) + campi specifici positivi (gross_premium_cur, invested_premium_cur, entry_fee_cur, entry_expenses_cur, units_invested, unit_quotation_cur)

### REQ-UI-MOD-002: Modale Modifica Record
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente clicca sull'icona modifica di un record, il sistema deve aprire una modale con tutti i campi pre-compilati con i valori correnti del record.
- **Rationale:** Permettere correzioni senza perdita dati.
- **Acceptance Criteria:**
  - **Given:** Record id=200 con company="ACME", policy_number="POL123", gross_premium_cur=1000
  - **When:** L'utente clicca sull'icona modifica
  - **Then:** Si apre la modale con campi pre-compilati: company="ACME", policy_number="POL123", gross_premium_cur=1000

### REQ-UI-MOD-003: Modale Duplicazione Record
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente clicca sull'icona duplica di un record, il sistema deve aprire una modale con tutti i campi pre-compilati con i valori del record originale, permettendo modifiche prima del salvataggio.
- **Rationale:** Accelerare l'inserimento di record simili.
- **Acceptance Criteria:**
  - **Given:** Record id=300 con fund_code="FD001", units_invested=100
  - **When:** L'utente clicca sull'icona duplica, modifica units_invested a 200, e salva
  - **Then:** Viene creato un nuovo record con fund_code="FD001", units_invested=200, nuovo id e nuovo row_id

### REQ-UI-MOD-004: Campi Comuni Form
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve includere nei form di tutti i tipi record i seguenti campi comuni: operation_type (automatico), operation_id (automatico), company (autocomplete), policy_number (autocomplete), fund_type (dropdown FD/FI/GS), fund_code (autocomplete), fund_description (automatico), currency (dropdown EUR/CHF/GBP/JPY/USD/SEK, default EUR), exchange_rate (input numerico, default 1), operation_date (date picker DD/MM/YYYY con Flatpickr), effect_date (date picker DD/MM/YYYY con Flatpickr).
- **Rationale:** Standardizzare i dati comuni a tutti i tipi operazione.
- **Acceptance Criteria:**
  - **Given:** L'utente apre una qualsiasi modale di inserimento record
  - **When:** Il form viene renderizzato
  - **Then:** Sono presenti tutti i 12 campi comuni con i rispettivi controlli e valori di default

### REQ-UI-MOD-005: Campi Specifici Form ASV
- **Pattern:** State-driven
- **Priorità:** Must
- **Statement:** MENTRE il tipo record è ASV, il sistema deve mostrare i seguenti campi specifici: units_invested (float, default 0), unit_quotation_cur (float, default 0), unit_quotation_eur (calcolato automaticamente), asset_value_cur (float, default 0), asset_value_eur (calcolato automaticamente).
- **Rationale:** Valorizzazione polizza richiede dati sulle quote investite.
- **Acceptance Criteria:**
  - **Given:** Modale aperta per tipo ASV
  - **When:** Il form viene renderizzato
  - **Then:** Vengono mostrati 5 campi specifici ASV oltre ai campi comuni

### REQ-UI-MOD-006: Campi Specifici Form Operazioni Positive
- **Pattern:** State-driven
- **Priorità:** Must
- **Statement:** MENTRE il tipo record è EMP, VAI o SWI (operazione positiva), il sistema deve mostrare i seguenti campi specifici: gross_premium_cur (float, default 0), gross_premium_eur (calcolato), invested_premium_cur (float, default 0), invested_premium_eur (calcolato), entry_fee_cur (float, default 0), entry_fee_eur (calcolato), entry_expenses_cur (float, default 0), entry_expenses_eur (calcolato), units_invested (float, default 0), unit_quotation_cur (float, default 0), unit_quotation_eur (calcolato), asset_value_cur (uguale a invested_premium_cur), asset_value_eur (uguale a invested_premium_eur).
- **Rationale:** Operazioni positive registrano aggiunte di capitale con dettaglio commissioni.
- **Acceptance Criteria:**
  - **Given:** Modale aperta per tipo EMP
  - **When:** Il form viene renderizzato
  - **Then:** Vengono mostrati 13 campi specifici positivi oltre ai campi comuni

### REQ-UI-MOD-007: Campi Specifici Form Operazioni Negative
- **Pattern:** State-driven
- **Priorità:** Must
- **Statement:** MENTRE il tipo record è PSR, TSR, CLM, TRU, DMF, DDC o SWO (operazione negativa), il sistema deve mostrare i seguenti campi specifici: gross_outgoing_cur (float, default 0), gross_outgoing_eur (calcolato), net_outgoing_payment_cur (float, default 0), net_outgoing_payment_eur (calcolato), operation_cost_cur (float, default 0), operation_cost_eur (calcolato), tax_liq_cur (float, default 0), tax_liq_eur (calcolato), bonus_liq_cur (float, default 0), bonus_liq_eur (calcolato), duty_liq_cur (float, default 0), duty_liq_eur (calcolato), units_disinvested (float, default 0), unit_quotation_cur (float, default 0), unit_quotation_eur (calcolato), asset_value_cur (uguale a gross_outgoing_cur), asset_value_eur (uguale a gross_outgoing_eur).
- **Rationale:** Operazioni negative registrano riduzioni di capitale con dettaglio costi, tasse e bonus.
- **Acceptance Criteria:**
  - **Given:** Modale aperta per tipo PSR
  - **When:** Il form viene renderizzato
  - **Then:** Vengono mostrati 17 campi specifici negativi oltre ai campi comuni

### REQ-UI-MOD-008: Autocomplete con Debounce
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente digita nei campi company, policy_number o fund_code, il sistema deve attendere 1 secondo dall'ultima digitazione e, se sono stati inseriti almeno 2 caratteri, invocare una chiamata Ajax di autocomplete per mostrare suggerimenti.
- **Rationale:** Minimizzare il carico server e migliorare UX evitando suggerimenti su input troppo brevi.
- **Acceptance Criteria:**
  - **Given:** L'utente ha il focus sul campo company vuoto
  - **When:** L'utente digita "A" (1 carattere)
  - **Then:** Nessuna chiamata Ajax viene effettuata
  - **When:** L'utente aggiunge "C" (2 caratteri totali: "AC")
  - **Then:** Dopo 1 secondo viene effettuata la chiamata Ajax con query="AC"
  - **When:** Durante il secondo di attesa l'utente aggiunge "M" (3 caratteri: "ACM")
  - **Then:** Il timer viene resettato e la chiamata Ajax viene effettuata solo dopo 1 secondo dall'ultima digitazione con query="ACM"

### REQ-UI-MOD-009: Auto-fill fund_description
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente seleziona un fund_code dall'autocomplete, il sistema deve automaticamente popolare il campo fund_description con il valore description restituito dal backend.
- **Rationale:** Evitare inserimento manuale di dati già disponibili.
- **Acceptance Criteria:**
  - **Given:** L'utente ha digitato "FD" nel campo fund_code e riceve suggerimenti
  - **When:** L'utente seleziona "FD001" con description="Fondo Azionario Globale"
  - **Then:** Il campo fund_code viene impostato a "FD001" e fund_description a "Fondo Azionario Globale"

### REQ-UI-MOD-010: Calcolo _eur in Tempo Reale
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente modifica un campo *_cur o exchange_rate, il sistema deve ricalcolare automaticamente il corrispondente campo *_eur applicando la formula: valore_eur = valore_cur * exchange_rate.
- **Rationale:** Fornire feedback immediato sui valori convertiti.
- **Acceptance Criteria:**
  - **Given:** Form ASV con currency=EUR, exchange_rate=1, asset_value_cur=1000
  - **When:** L'utente cambia currency a CHF e exchange_rate a 1.05
  - **Then:** Il campo asset_value_eur viene aggiornato automaticamente a 1050 (1000 * 1.05)

### REQ-UI-MOD-011: Testata Modale Colorata per Tipo
- **Pattern:** Ubiquitous
- **Priorità:** Should
- **Statement:** Il sistema deve colorare lo sfondo dell'header della modale record con il colore del tipo operazione selezionato (verde per ASV, tonalità fredde per positivi, tonalità calde per negativi) con testo bianco.
- **Rationale:** Identificazione visiva immediata del tipo operazione nella modale.

### REQ-UI-MOD-012: Icona Calcolatrice Cliccabile
- **Pattern:** Event-driven
- **Priorità:** Should
- **Statement:** QUANDO un campo nel form ha input type "calculated", il sistema deve mostrare un'icona calcolatrice accanto alla label. Cliccando l'icona, il sistema deve calcolare e riempire il campo con il valore calcolato (valore_cur * exchange_rate).
- **Rationale:** Permettere calcolo manuale on-demand dei campi EUR.

### REQ-UI-MOD-013: Auto-fill Campi Calcolati Prima del Salvataggio
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO l'utente conferma il salvataggio, il sistema deve automaticamente riempire tutti i campi calcolati che hanno valore 0 con il valore calcolato corretto.
- **Rationale:** Evitare salvataggio di campi EUR a zero quando il valore CUR è compilato.

---

## REQ-UI-UX: Esperienza Utente

### REQ-UI-UX-001: Toast Feedback
- **Pattern:** Event-driven
- **Priorità:** Should
- **Statement:** QUANDO un'operazione CRUD viene completata con successo, il sistema deve mostrare un toast verde in alto a destra che scompare dopo 3 secondi. In caso di errore, il toast è rosso.
- **Rationale:** Feedback visivo non intrusivo sulle operazioni completate.

### REQ-UI-UX-002: Loading Ritardato
- **Pattern:** State-driven
- **Priorità:** Should
- **Statement:** MENTRE il sistema è in caricamento, il sistema deve mostrare l'overlay spinner solo dopo 300ms di attesa. Se il caricamento termina prima, l'overlay non viene mostrato.
- **Rationale:** Evitare flash visivi per operazioni rapide.

### REQ-UI-UX-003: Formattazione Numeri Server-Side
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve formattare tutti i campi float (field_15, field_16-field_41) con 2 decimali nella risposta API records.
- **Rationale:** Consistenza nella visualizzazione dei dati numerici.

---

## REQ-BIZ: Logica Business

### REQ-BIZ-001: Formula Conversione Valuta
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve calcolare tutti i campi *_eur usando la formula: valore_eur = valore_cur * exchange_rate.
- **Rationale:** Standardizzare la conversione valuta.
- **Acceptance Criteria:**
  - **Given:** Record con gross_premium_cur=500, exchange_rate=1.2
  - **When:** Il record viene salvato
  - **Then:** gross_premium_eur viene calcolato e memorizzato come 600 (500 * 1.2)

### REQ-BIZ-002: Gestione row_id Senza Buchi
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO un record viene cancellato, il sistema deve ricalcolare il campo row_id di tutti i record rimanenti della stessa testata per eliminare buchi nella numerazione progressiva.
- **Rationale:** Mantenere row_id come indice ordinale continuo per coerenza dati.
- **Acceptance Criteria:**
  - **Given:** Testata con 5 record: row_id 1,2,3,4,5
  - **When:** L'utente cancella il record con row_id=3
  - **Then:** I record rimanenti hanno row_id: 1,2,3,4 (l'ex 4 diventa 3, l'ex 5 diventa 4)

### REQ-BIZ-003: Propagazione filename a source_filename
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO il campo filename di una testata viene modificato, il sistema deve aggiornare automaticamente il campo source_filename di tutti i record figli associati con il nuovo valore in una transazione atomica.
- **Rationale:** Mantenere sincronizzazione tra testata e record per tracciabilità origine dati.
- **Acceptance Criteria:**
  - **Given:** Testata id=50 con filename="Vecchio" e 10 record figli con source_filename="Vecchio"
  - **When:** L'utente modifica filename a "Nuovo"
  - **Then:** Tutti i 10 record figli hanno source_filename="Nuovo" e l'operazione è atomica (successo totale o rollback totale)

### REQ-BIZ-004: Aggiornamento rows_imported su Insert/Delete Record
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO un record viene inserito, il sistema deve incrementare di 1 il campo rows_imported della testata associata; QUANDO un record viene cancellato, il sistema deve decrementare di 1 il campo rows_imported della testata associata.
- **Rationale:** Mantenere conteggio accurato dei record associati.
- **Acceptance Criteria:**
  - **Given:** Testata id=60 con rows_imported=5
  - **When:** L'utente inserisce un nuovo record
  - **Then:** rows_imported diventa 6
  - **When:** L'utente cancella un record
  - **Then:** rows_imported diventa 5

### REQ-BIZ-005: Aggiornamento run_end_date su Insert/Update/Delete Record
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO un record viene inserito, modificato o cancellato, il sistema deve aggiornare il campo run_end_date della testata associata con now().
- **Rationale:** Tracciare timestamp ultima modifica dati.
- **Acceptance Criteria:**
  - **Given:** Testata id=70 con run_end_date='2026-02-15 10:00:00'
  - **When:** L'utente modifica un record alle ore 12:30:45 del 2026-02-20
  - **Then:** run_end_date viene aggiornato a '2026-02-20 12:30:45'

### REQ-BIZ-006: Condizioni Cancellazione Testata
- **Pattern:** Optional
- **Priorità:** Must
- **Statement:** DOVE rows_imported = 0 E param_import_status_id = 1, il sistema deve permettere la cancellazione della testata; ALTRIMENTI il sistema deve impedire la cancellazione.
- **Rationale:** Prevenire perdita dati già elaborati.
- **Acceptance Criteria:**
  - **Given:** Testata id=80 con rows_imported=0 e param_import_status_id=1
  - **When:** L'utente tenta la cancellazione
  - **Then:** La testata viene cancellata con successo
  - **Given:** Testata id=81 con rows_imported=3
  - **When:** L'utente tenta la cancellazione
  - **Then:** Il sistema restituisce errore "Impossibile cancellare testata con record associati"

### REQ-BIZ-007: Auto-generazione Campi Testata
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO una nuova testata viene creata, il sistema deve generare automaticamente: id (PK autogenerata), import_main_id=1120, param_import_status_id=1, rows_imported=0, run_start_date=now(), run_end_date=null.
- **Rationale:** Inizializzare correttamente lo stato testata.
- **Acceptance Criteria:**
  - **Given:** L'utente inserisce filename="Test Import"
  - **When:** Salva la nuova testata
  - **Then:** Viene creato un record con id autogenerato, import_main_id=1120, param_import_status_id=1, rows_imported=0, run_start_date=timestamp corrente, run_end_date=null, filename="Test Import"

### REQ-BIZ-008: Auto-generazione Campi Record
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO un nuovo record viene inserito, il sistema deve generare automaticamente: id (PK autogenerata), row_id (MAX(row_id)+1 per quella testata, parte da 1), field_01 (uguale al tipo record selezionato), field_02 (uguale a row_id), source_filename (uguale a filename della testata).
- **Rationale:** Mantenere integrità e tracciabilità dati.
- **Acceptance Criteria:**
  - **Given:** Testata id=90 con filename="Import ABC" ha già 3 record (row_id 1,2,3)
  - **When:** L'utente inserisce un nuovo record di tipo EMP
  - **Then:** Il nuovo record ha id autogenerato, row_id=4, field_01="EMP", field_02="4", source_filename="Import ABC"

### REQ-BIZ-009: Guardia Backend Testata Modificabile
- **Pattern:** State-driven
- **Priorità:** Must
- **Statement:** MENTRE una testata ha param_import_status_id diverso da 1, il backend deve impedire qualsiasi operazione di insert, update, delete e reorder sui record e qualsiasi modifica al filename della testata.
- **Rationale:** Doppia protezione (frontend + backend) contro modifiche non autorizzate.

---

## REQ-VAL: Validazioni Warning

### REQ-VAL-001: Warning ASV - Unità per Quotazione
- **Pattern:** Unwanted
- **Priorità:** Should
- **Statement:** SE (field_36 * field_38) ≠ field_40 in un record ASV, ALLORA il sistema deve mostrare un messaggio di warning "Attenzione: units_invested × unit_quotation_cur ≠ asset_value_cur", ma permettere comunque il salvataggio.
- **Rationale:** Segnalare inconsistenze nei dati senza bloccare l'operatore che potrebbe avere casi speciali validi.
- **Acceptance Criteria:**
  - **Given:** Form ASV con units_invested=100, unit_quotation_cur=10, asset_value_cur=999
  - **When:** L'utente clicca Salva
  - **Then:** Appare un warning banner con il messaggio specificato, il record può comunque essere salvato cliccando "Conferma salvataggio"

### REQ-VAL-002: Warning Positivo - Premio Lordo vs Investito
- **Pattern:** Unwanted
- **Priorità:** Should
- **Statement:** SE (field_16 - field_18) ≠ (field_20 + field_22) in un record operazione positiva, ALLORA il sistema deve mostrare un messaggio di warning "Attenzione: gross_premium_cur - invested_premium_cur ≠ entry_fee_cur + entry_expenses_cur", ma permettere comunque il salvataggio.
- **Rationale:** Segnalare discrepanze nelle commissioni senza bloccare operazioni legittime.
- **Acceptance Criteria:**
  - **Given:** Form EMP con gross_premium=1000, invested_premium=900, entry_fee=50, entry_expenses=40
  - **When:** L'utente clicca Salva
  - **Then:** Appare un warning "Attenzione: gross_premium_cur - invested_premium_cur ≠ entry_fee_cur + entry_expenses_cur" (1000-900=100, 50+40=90), il salvataggio è comunque possibile

### REQ-VAL-003: Warning Positivo - Unità Investite
- **Pattern:** Unwanted
- **Priorità:** Should
- **Statement:** SE (field_36 * field_38) ≠ field_18 in un record operazione positiva, ALLORA il sistema deve mostrare un messaggio di warning "Attenzione: units_invested × unit_quotation_cur ≠ invested_premium_cur", ma permettere comunque il salvataggio.
- **Rationale:** Segnalare inconsistenze nel calcolo quote investite.
- **Acceptance Criteria:**
  - **Given:** Form VAI con units_invested=50, unit_quotation_cur=20, invested_premium_cur=999
  - **When:** L'utente clicca Salva
  - **Then:** Appare warning appropriato, salvataggio comunque consentito

### REQ-VAL-004: Warning Negativo - Uscita Lorda vs Netta
- **Pattern:** Unwanted
- **Priorità:** Should
- **Statement:** SE (field_24 - field_26) ≠ (field_28 + field_30 + field_34 - field_32) in un record operazione negativa, ALLORA il sistema deve mostrare un messaggio di warning "Attenzione: gross_outgoing_cur - net_outgoing_payment_cur ≠ operation_cost_cur + tax_liq_cur + duty_liq_cur - bonus_liq_cur", ma permettere comunque il salvataggio.
- **Rationale:** Segnalare discrepanze nei costi/tasse/bonus senza bloccare.
- **Acceptance Criteria:**
  - **Given:** Form PSR con gross_outgoing=2000, net_outgoing=1800, operation_cost=100, tax_liq=80, duty_liq=30, bonus_liq=5
  - **When:** L'utente clicca Salva (2000-1800=200, 100+80+30-5=205)
  - **Then:** Appare warning appropriato, salvataggio comunque consentito

### REQ-VAL-005: Warning Negativo - Unità Disinvestite
- **Pattern:** Unwanted
- **Priorità:** Should
- **Statement:** SE (field_37 * field_38) ≠ field_24 in un record operazione negativa, ALLORA il sistema deve mostrare un messaggio di warning "Attenzione: units_disinvested × unit_quotation_cur ≠ gross_outgoing_cur", ma permettere comunque il salvataggio.
- **Rationale:** Segnalare inconsistenze nel calcolo quote disinvestite.
- **Acceptance Criteria:**
  - **Given:** Form CLM con units_disinvested=30, unit_quotation_cur=40, gross_outgoing_cur=1199
  - **When:** L'utente clicca Salva
  - **Then:** Appare warning appropriato, salvataggio comunque consentito

### REQ-VAL-006: Validazione Formato Date DD/MM/YYYY
- **Pattern:** Unwanted
- **Priorità:** Must
- **Statement:** SE un campo data (field_49, field_50) non rispetta il formato DD/MM/YYYY, ALLORA il backend deve restituire un errore bloccante.
- **Rationale:** Garantire consistenza formato date in database.

---

## REQ-API: Endpoint Ajax

### REQ-API-001: Endpoint config
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve esporre un endpoint GET `ajax_import_settimanale_view.php?action=config` che restituisce un JSON con: is_dev (boolean), record_types (array con import_record_id, code, sign, fields), import_main_id.
- **Rationale:** Fornire configurazione dinamica al frontend.
- **Acceptance Criteria:**
  - **Given:** ENV_IS_DEV è true
  - **When:** Il frontend chiama l'endpoint config
  - **Then:** Riceve `{success:true, data:{is_dev:true, record_types:[...], import_main_id:1120}}`

### REQ-API-002: Endpoint headers
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve esporre un endpoint GET `ajax_import_settimanale_view.php?action=headers` che restituisce un JSON con l'array di tutte le testate (max 1000), ordinate per run_start_date DESC.
- **Rationale:** Fornire elenco testate al frontend.
- **Acceptance Criteria:**
  - **Given:** Il database contiene 50 testate
  - **When:** Il frontend chiama l'endpoint headers
  - **Then:** Riceve `{success:true, data:[{id, run_start_date, run_end_date, filename, status_text, rows_imported, ...}, ...]}` con 50 elementi

### REQ-API-003: Endpoint records
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve esporre un endpoint GET `ajax_import_settimanale_view.php?action=records&tracking_id=<id>` che restituisce un JSON con l'array di tutti i record per una specifica testata, ordinati per row_id ASC.
- **Rationale:** Fornire elenco record al frontend.
- **Acceptance Criteria:**
  - **Given:** La testata id=100 ha 20 record
  - **When:** Il frontend chiama `action=records&tracking_id=100`
  - **Then:** Riceve `{success:true, data:[{id, row_id, import_record_id, field_01, ..., field_50}, ...]}` con 20 elementi ordinati per row_id

### REQ-API-004: Endpoint autocomplete
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve esporre un endpoint GET `ajax_import_settimanale_view.php?action=autocomplete&field=<nome_campo>&query=<testo>` che restituisce un JSON con max 20 suggerimenti filtrati per il campo specificato (company, policy_number, fund_code).
- **Rationale:** Supportare autocomplete con performance accettabili.
- **Acceptance Criteria:**
  - **Given:** Database contiene 100 company con nomi che iniziano per "A"
  - **When:** Il frontend chiama `action=autocomplete&field=company&query=AC`
  - **Then:** Riceve `{success:true, data:[{value:"ACME Corp", label:"ACME Corp"}, ...]}` con max 20 risultati

### REQ-API-005: Endpoint header_save
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve esporre un endpoint POST `ajax_import_settimanale_save.php` con action=header_save che accetta un JSON con {id?, filename} e restituisce la testata completa (creata o modificata).
- **Rationale:** Gestire salvataggio testate.
- **Acceptance Criteria:**
  - **Given:** Request POST con body `{action:"header_save", filename:"Nuova testata"}`
  - **When:** Il backend processa la richiesta
  - **Then:** Viene creata una nuova testata e ritorna `{success:true, data:{id:<nuovo_id>, filename:"Nuova testata", import_main_id:1120, ...}}`

### REQ-API-006: Endpoint record_save
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve esporre un endpoint POST `ajax_import_settimanale_save.php` con action=record_save che accetta un JSON con {id?, import_tracking_id, import_record_id, fields:{...}} e restituisce il record completo (creato o modificato).
- **Rationale:** Gestire salvataggio record.
- **Acceptance Criteria:**
  - **Given:** Request POST con body `{action:"record_save", import_tracking_id:50, import_record_id:112006, fields:{field_04:"ACME", field_36:100, ...}}`
  - **When:** Il backend processa la richiesta
  - **Then:** Viene creato un nuovo record ASV e ritorna `{success:true, data:{id:<nuovo_id>, row_id:1, field_01:"ASV", field_02:"1", field_04:"ACME", field_36:"100", ...}}`

### REQ-API-007: Endpoint record_delete
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve esporre un endpoint POST `ajax_import_settimanale_save.php` con action=record_delete che accetta un JSON con {id, import_tracking_id} e restituisce conferma cancellazione con testata aggiornata.
- **Rationale:** Gestire cancellazione record con aggiornamento testata.
- **Acceptance Criteria:**
  - **Given:** Request POST con body `{action:"record_delete", id:200, import_tracking_id:50}`
  - **When:** Il backend processa la richiesta
  - **Then:** Il record viene cancellato, row_id viene ricalcolato, testata aggiornata, ritorna `{success:true, data:{deleted_id:200, updated_header:{id:50, rows_imported:4, run_end_date:"2026-02-20 15:30:00"}}}`

### REQ-API-008: Endpoint record_reorder
- **Pattern:** Event-driven
- **Priorità:** Should
- **Statement:** QUANDO il frontend invia una richiesta POST con action=record_reorder, import_tracking_id e ordered_ids (array di ID record nel nuovo ordine), il sistema deve aggiornare row_id e field_02 di ogni record in base alla nuova posizione.
- **Rationale:** Persistenza del drag-and-drop reordering.

### REQ-API-009: Endpoint header_toggle_status
- **Pattern:** Event-driven
- **Priorità:** Must
- **Statement:** QUANDO il frontend invia una richiesta POST con action=header_toggle_status e id, il sistema deve alternare param_import_status_id tra 1 e 2. Per stati diversi da 1 e 2, il sistema deve restituire errore.
- **Rationale:** Gestione lock/unlock testata.

---

## REQ-ERR: Gestione Errori

### REQ-ERR-001: Messaggio Errore Sempre Visibile
- **Pattern:** Unwanted
- **Priorità:** Must
- **Statement:** SE una chiamata Ajax al backend restituisce un errore, ALLORA il sistema deve mostrare all'utente un messaggio di errore comprensibile.
- **Rationale:** Informare l'utente sui problemi senza terminare l'applicazione.
- **Acceptance Criteria:**
  - **Given:** Il backend restituisce `{success:false, message:"Database connection failed"}`
  - **When:** Il frontend riceve la risposta
  - **Then:** Viene mostrato un banner rosso con testo "Errore: Database connection failed"

### REQ-ERR-002: Stack Trace in Modalità DEV
- **Pattern:** State-driven
- **Priorità:** Must
- **Statement:** MENTRE l'applicazione è in modalità DEV (ENV_IS_DEV=true), il sistema deve mostrare lo stack trace completo dell'eccezione insieme al messaggio di errore; MENTRE è in modalità PROD, il sistema deve mostrare solo il messaggio.
- **Rationale:** Facilitare debug in sviluppo, nascondere dettagli tecnici in produzione.
- **Acceptance Criteria:**
  - **Given:** ENV_IS_DEV=true e il backend restituisce `{success:false, message:"Query failed", exception:"PDOException at line 42..."}`
  - **When:** Il frontend riceve la risposta
  - **Then:** Viene mostrato il messaggio + stack trace in un blocco expandibile
  - **Given:** ENV_IS_DEV=false e il backend restituisce `{success:false, message:"Query failed"}`
  - **When:** Il frontend riceve la risposta
  - **Then:** Viene mostrato solo il messaggio, nessuno stack trace

### REQ-ERR-003: Formato JSON Errore Standardizzato
- **Pattern:** Ubiquitous
- **Priorità:** Must
- **Statement:** Il sistema deve restituire errori in formato JSON standardizzato: `{success:false, message:string, exception?:string}` dove exception è presente solo se ENV_IS_DEV=true.
- **Rationale:** Standardizzare il parsing errori nel frontend.
- **Acceptance Criteria:**
  - **Given:** Si verifica un'eccezione PHP durante una chiamata Ajax
  - **When:** Il backend cattura l'eccezione
  - **Then:** Restituisce JSON con success=false, message con descrizione umana, exception con stack trace solo se ENV_IS_DEV=true

---

## Prioritizzazione (MoSCoW)

| Categoria | Must | Should | Could |
|-----------|------|--------|-------|
| UI-TST | 001-008, 009, 010 | - | - |
| UI-REC | 001-006, 008 | 007, 009, 010 | - |
| UI-MOD | 001-010, 013 | 011, 012 | - |
| UI-UX | 003 | 001, 002 | - |
| BIZ | 001-009 | - | - |
| VAL | 006 | 001-005 | - |
| API | 001-007, 009 | 008 | - |
| ERR | 001-003 | - | - |

**Totale:** 49 Must, 13 Should, 0 Could

---

## Tracciabilità

Ogni requisito può essere tracciato verso:
- **PIANO_ESECUZIONE.md** — Decisioni architetturali
- **README.md** — Spec originale
- **docs/ACCEPTANCE_CRITERIA.md** — Criteri BDD (vedi file dedicato)

---

## Changelog

| Versione | Data | Autore | Modifiche |
|----------|------|--------|-----------|
| 1.0 | 2026-02-20 | agent-ears | Creazione iniziale con 40 requisiti EARS |
| 2.0 | 2026-02-24 | Claude | Aggiornamento con nuove feature: lock/unlock stato, drag-and-drop, breadcrumb, toast, Flatpickr DD/MM/YYYY, bordo colorato, celle N/A, modale colorata, calcolatrice, formattazione numeri, loading ritardato |

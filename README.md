## Attività
Sviluppare un'App vue.js per l'inserimento e la modifica di record in una tabella PostgreSql.

## Strumenti
PostgreSQL 16
PhP 7.4
Vue.js 3 CDN (Options API)
Bootstrap 5 CDN + Bootstrap Icons
Flatpickr (date picker DD/MM/YYYY)
SortableJS (drag-and-drop)

## Architettura
- Frontend: App Vue.js/Bootstrap che si occupa del rendering dei dati forniti, in formato json dal backend tramite chiamate ajax.
- Backend: 2 pagine distinte una per l'erogazione delle chiamate GET e una per le POST. Si tratta di script PhP che istanzieranno oggetti PHP per l'accesso al DB e restituiranno le informazioni in formato json.
- DB: tabelle di appoggio: data.import_tracking (testata) data.import_data_flat (record)
- file di configurazione json.

## Interfaccia utente
Accedendo all'app viene mostrato l'elenco delle testate (data.import_tracking) già inserite in forma tabellare, prevedere la paginazione (20,50,100 record) e un meccanismo filtro mediante un singolo input tupe text.
Cliccando sulla testata di ciascuna colonna sarà possibile ordinarla (nan, asc, desc).

Come prima colonna inserire l'icona di un occhio per poter aprire il dettaglio della testata.
Come ultima colonna inserire un'icona lucchetto per il passaggio di stato (1 = aperto/modificabile, 2 = chiuso/bloccato).
In testata alla prima colonna inserire l'icona + per inserire una nuova testata. L'unico dato da chiedere sarà un campo testuale libero.
Per eliminare una testata, inserire una colonna a fine tabella con un cestino. Far comparire il cestino solo se le condizioni sono soddisfatte: le testate possono essere eliminate solo se sono prive di record
(rows_imported = 0) e solo se sono nello stato iniziale (param_import_status_id = 1).

Il dettaglio della testata mostra una tabella con i record, prevedere la paginazione (20,50,100 record) e un meccanismo filtro mediante un singolo input tupe text.
Chiudendo il dettaglio si torna alla visione delle testate.
Ciascun record dovrà avere la possibilità di effettuare le seguenti 3 operazioni: modifica, duplicazione, cancellazione.
1. La cancellazione deve essere confermata
2. La duplicazione aprirà una modale con i dati precaricati in modo che l'operatore potrà fare delle modifiche prima di duplicarla
3. La modifica aprirà una modale con i dati precaricati in modo che l'operatore potrà fare delle modifiche prima di salvare

Le modali per la modifica, duplicazione ed inserimento di un record dipendono dal tipo record, nei primi due casi il tipo è determinato, nel caso di un nuovo inserimento si deve prima selezionare il tipo record che si vuole inserire, dopodichè sarà possibile aprire la modale.
A tal proposito, sopra la tabella prevedere una serie di "bottoni" in file, ciascuno di colore diverso (l'elenco di questi bottoni e le loro label sono restituite dal backend, considerare che saranno nomi di 3 lettere da mettere tutte maiuscole).
Premendo uno di questi bottoni si aprirà una modale con lo specifico form di inserimento di un nuovo record.

## Gestione degli errori
Se le chiamate al backend ristituiscono un errore viene mostrato all'operatore.
Se l'app è in modalità DEV, viene mostrato anche l'intero stack dell'eccezzione.

## Chiamate Ajax
1- [GET] Configurazione dell'app: usare questa chiamata per chiedere al backend tutte le informazioni non strettamente legate alla grafica. Una delle informazioni che verranno restituite in questa chiamata sarà l'elenco dei tipi record inseribile e quali campi chiedere per il loro inserimento. Un'altro campo restituito in questa chiamata è se siamo in modalità DEV o in modalità PROD.
2- [GET] Lista delle testate, l'ordinamento di default è per sata crescente (il primo record è il più recente). Vengo restituiti massimo 1000 record
3- [GET] Lista dei record per una specifica testata, ordinati per default per ordine di inserimento del record.
4- [POST] Nuova testata, Modifica testata. Restituisce il json del dato appena ricevuto arricchito con i dati in più che vengono generati dal backend (ad esempio l'id del record). In caso di errore restituisce un messaggio e l'eccezione.
5- [POST] Aggiunge, Modifica, Cancella un record. Restituisce il json del dato appena ricevuto arricchito con i dati in più che vengono generati dal backend (ad esempio l'id del record). In caso di errore restituisce un messaggio e l'eccezione.
6- [GET] Supporto al completamento dei campi: Quando un utente sta compilando degli specifici campi, viene invocata questa funzione per avere un elenco di possibili scelte filtrate da quello che sta inserendo l'utente.

## Dettaglio testata data.import_tracking
Quanto viene generata una testata i campi da valorizzare sono i seguenti:
	id: PK autogenerata
	import_main_id: valore fitsso = 1120
	param_import_status_id: valore fisso = 1
	rows_imported: valore fitsso = 0
	run_start_date: now()
	run_end_date: null (indica quando completo l'inserimento di tutti i record, quindi ad ogni modifica di un record viene aggiornata con now())
	filename: testo libero (è una descrizione libera, il campo si chiama filename perchè in passato aveva un'altro scopo, ma ora è solo una descrizione.)

Quando viene inserito/eliminato un record vanno modificati, nella testata i seguenti campi:
	run_end_date: now() -> Indica la data di completamento dell'inserimento quindi per ogni modifica va aggiornato.
	rows_imported: inserito +1 / eliminato -1 -> indica il totale dei record presenti, quindi ogni inserimento comporta un incremento e ogni eliminazione un decremento

Le colonne da mostrare della testa sono le seguenti
	run_start_date: YYYY-MM-DD HH:i    LABEL: Data inserimento
	run_end_date: YYYY-MM-DD HH:i      LABEL: Data ultima modifica
	filename: testo libero             LABEL: Descrizione
	param_import_status_id: testo      LABEL: Stato
	rows_imported: int                 LABEL: Inseriti
	rows_rejected: int                 LABEL: Scartati
	rows_recovered: int                LABEL: Recuperati
	last_check_start: YYYY-MM-DD HH:i  LABEL: Inizio Check
	last_check_end: YYYY-MM-DD HH:i    LABEL: Fine Check
	last_post_start: YYYY-MM-DD HH:i   LABEL: Inizio Post
	last_post_end: YYYY-MM-DD HH:i     LABEL: Fine Post

## Elenco tipi Record
Di seguito l'elenco dei tipi operazioni divide per tipologia di form di inserimento

1. 'ASV': Valorizzazione della polizza
2. 'EMP', 'VAI', 'SWI': Record di un'operazione positiva (aggiunta di capitale dei fondi di investimento)
3. 'PSR', 'TSR', 'CLM', 'TRU', 'DMF', 'DDC', 'SWO': Record di un'operazione negativa (riduzione di capitale nei fondi di investimento)

Tabella che associa import_record_id e Tipo record
Verrà restutuita tra i dati della chiamata ajax 1
112005,'EMP'
112006,'ASV', 
112007,'VAI'
112008,'SWO'
112009,'SWI'
112010,'PSR'
112011,'TSR'
112012,'CLM'
112013,'TRU'
112014,'DMF'
112015,'DDC'

## Dettaglio record data.import_data_flat
Linserimento di un nuovo record comporta la valorizzazione dei seguenti campi:
	id: PK autogenerata
	import_tracking_id: id della testata
	row_id: numero progressivo del record, comincia da 1.
	import_record_id: id del record inserito. Vedi la tabella inserita nel capitolo ## Elenco tipi Record
	source_filename: uguale al campo filename della testata
	field_01->field_50: Questa serie di campi, tutti di tipo TEXT, sono popolati come descritto di seguito per tipologia di record

### Campi da inserire in tabella per tutte le tipologie di record
field_01) operation_type: Tipo Record [automatico, corrisponde al TIPO RECORD che si sta inserendo]
field_02) operation_id: Indice progressivo del record [automatico, si parte da 1 e ogni nuova operazione avrà un numero progressimo successivo. coincide con il campo row_id]
field_04) company [chiesto all'utente che viene aiutato al completamento potendo scegliere tra le opzioni suggerite dal backend (chiamata ajax 6)]
field_06) policy_number [chiesto all'utente che viene aiutato al completamento potendo scegliere tra le opzioni suggerite dal backend (chiamata ajax 6)]
field_11) fund_type [chiesto all'utente tramite una drop down di valori fissi (FD, FI, GS)]
field_12) fund_code [chiesto all'utente che viene aiutato al completamento potendo scegliere tra le opzioni suggerite dal backend (chiamata ajax 6)]
field_13) fund_description [automatico, viene inserito in funzione di fund_code. La chiamata ajax che restituisce il fund_code restituisce anche il fund_descriptio]
field_14) currency [chiesto all'utente DEFAULT 'EUR' ma può essere cambiato tra i seguenti: EUR,CHF,GBP,JPY,USD,SEK]
field_15) exchange_rate [chiesto all'utente DEFAULT '1' ma può essere cambiato con un valore float]
field_49) operation_date [chiesto all'utente, deve essere una data 'DD/MM/YYYY' tramite Flatpickr]
field_50) effect_date [chiesto all'utente, deve essere una data 'DD/MM/YYYY' tramite Flatpickr]

### Campi per la Valorizzazione 1. 'ASV'
field_36) units_invested [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_38) unit_quotation_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_39) unit_quotation_eur [Calcolato in base al campo currency]
field_40) asset_value_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_41) asset_value_eur Calcolato in base al campo currency]

Se il prodotto tra field_36 x field_38 è diverso da field_40, segnalare l'errore, ma l'utente può comunque procedere

### Campi da inserire per le operazioni positive 2. 'EMP', 'VAI', 'SWI'
field_16) gross_premium_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_17) gross_premium_eur [Calcolato in base al campo currency]
field_18) invested_premium_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_19) invested_premium_eur [Calcolato in base al campo currency]
field_20) entry_fee_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_21) entry_fee_eur [Calcolato in base al campo currency]
field_22) entry_expenses_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_23) entry_expenses_eur [Calcolato in base al campo currency]
field_36) units_invested [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_38) unit_quotation_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_39) unit_quotation_eur [Calcolato in base al campo currency]
field_40) asset_value_cur [Ufuale a field_18]
field_41) asset_value_eur [Ufuale a field_19]

Se la differenza tra 16 e 18 non corrisponde alla somma delle spese 20+22, segnalare l'errore, ma l'utente può comunque procedere
Se il prodotto tra 36 x 38 è diverso da 18, segnalare l'errore, ma l'utente può comunque procedere

### Campi da inserire per le operazioni negative 3. 'PSR', 'TSR', 'CLM', 'TRU', 'DMF', 'DDC', 'SWO'
field_24) gross_outgoing_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_25) gross_outgoing_eur [Calcolato in base al campo currency]
field_26) net_outgoing_payment_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_27) net_outgoing_payment_eur [Calcolato in base al campo currency]
field_28) operation_cost_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_29) operation_cost_eur [Calcolato in base al campo currency]
field_30) tax_liq_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_31) tax_liq_eur [Calcolato in base al campo currency]
field_32) bonus_liq_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_33) bonus_liq_eur [Calcolato in base al campo currency]
field_34) duty_liq_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_35) duty_liq_eur [Calcolato in base al campo currency]
field_37) units_disinvested [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_38) unit_quotation_cur [richiesto all'utente, DEFAULT 0, accetta valori Float]
field_39) unit_quotation_eur [Calcolato in base al campo currency]
field_40) asset_value_cur [Ufuale a field_24]
field_41) asset_value_eur [Ufuale a field_25]

Se la differenza tra field_24 e field_26 non corrisponde alla somma delle spese meno i bonus field_28+field_30+field_34-field_32, segnalare l'errore, ma l'utente può comunque procedere
Se il prodotto tra field_37 x field_38 è diverso da 24, segnalare l'errore, ma l'utente può comunque procedere

### Campi da mostrare
Mostrare i seguenti campi per ciascun record, nell'ordine in cui li ho scritti.
Dove ho messo i due campi separati da una / vuol dire che va mostrato il campo specifico per tipologia di record. Per esempio field_36/field_37 = positive field_36 / negative field_37
field_02, field_01, field_04, field_06, field_11, field_12, field_13, field_14, field_15, field_49, field_50, field_36/field_37, field_38, field_39, field_40, field_41
, field_16 / field_24, field_17 / field_25, field_18 / field_26, field_19 / field_27, field_20 / field_28, field_21 / field_29, field_22 / field_30, field_23 / field_31
, field_34, field_35, field_32, field_33

## Feature aggiuntive implementate (v2.0)

### UX e navigazione
- Breadcrumb nella vista dettaglio: "Import Settimanale > {filename}"
- Toast feedback (verde successo, rosso errore) che scompare dopo 3 secondi
- Loading overlay ritardato: appare solo dopo 300ms di attesa
- Tabella record split: parte fissa (azioni, ID-Eff.Date) + parte scrollabile (campi finanziari)
- Larghezza tabella calcolata via JS per adattarsi al layout FA

### Lock/Unlock testata
- Colonna lucchetto nella tabella testate per alternare stato 1 (aperto) / 2 (chiuso)
- Quando la testata e' bloccata (stato != 1): nessuna modifica consentita (frontend + backend)

### Drag-and-Drop
- Grip handle su ogni riga record per riordinamento tramite SortableJS
- Persistenza ordine sul backend con aggiornamento row_id e field_02

### Modale record
- Testata modale colorata per tipo record (verde/blu/rosso)
- Icona calcolatrice cliccabile per calcolare campi EUR on-demand
- Auto-fill campi calcolati a zero prima del salvataggio
- Warning non bloccanti posizionati tra body e footer della modale
- Warning con label campi leggibili (non nomi colonne DB)

### Visualizzazione tabella record
- Bordo sinistro colorato per tipo (verde ASV, blu positivo, rosso negativo)
- Celle non applicabili con sfondo grigio chiaro
- Numeri formattati con 2 decimali lato server
- Sorting su tutte le colonne della tabella fissa
- ResizeObserver per sincronizzazione altezze righe tra le due tabelle

### Date
- Formato DD/MM/YYYY tramite Flatpickr
- Validazione formato lato backend (regex)
# Guida al Deploy — Settimanale

> Istruzioni per integrare il modulo "Import Settimanale" nell'applicazione FAWill esistente.

---

## 1. Posizionamento File

### Controller

```
{ROOT_APP}/controller/settimanale/ctl_import_settimanale.php
```

Il file deve trovarsi nel namespace `FirstAdvisory\FAWill\controller\settimanale` e l'autoloader PSR-4 dell'app padre deve risolverlo.

### Model (5 classi)

```
{ROOT_APP}/model/Import/Settimanale/AjaxResponseHelper.php
{ROOT_APP}/model/Import/Settimanale/BaseConfig.php
{ROOT_APP}/model/Import/Settimanale/FormHelper.php
{ROOT_APP}/model/Import/Settimanale/HeaderManager.php
{ROOT_APP}/model/Import/Settimanale/RecordManager.php
```

Namespace: `FirstAdvisory\FAWill\model\Import`.

### Ajax (2 handler)

```
{ROOT_APP}/model/ajax/ajax_import_settimanale_view.php   ← solo GET
{ROOT_APP}/model/ajax/ajax_import_settimanale_save.php   ← solo POST
```

Entrambi contengono `require_once` relativi:
- `__DIR__ . '/../../../vendor/autoload.php'` — autoloader Composer
- `__DIR__ . '/../../../../../fa_lib/TraitTryQuery.php'` — trait DB

Verificare che i path relativi corrispondano alla struttura dell'app padre. In caso contrario, adeguare i `require_once`.

### Frontend

```
{ROOT_APP}/assets-fa/css/settimanale/main.css
{ROOT_APP}/assets-fa/js/settimanale/app.js
```

### Configurazione

```
{ROOT_APP}/settimanale_settings.json
```

Il file viene letto da `BaseConfig.php` con path `__DIR__ . '/../../settimanale_settings.json'` (3 livelli sopra `model/Import/Settimanale`). Verificare che il path risolva correttamente nella struttura dell'app padre.

---

## 2. Configurazione `settimanale_settings.json`

Il file `settimanale_settings.json` fornito contiene configurazioni di default. Verificare e adeguare:

| Chiave | Cosa controllare |
|--------|-----------------|
| `import_main_id` | Non presente nel JSON — hardcoded come costante PHP `IMPORT_MAIN_ID = 1120` in `HeaderManager.php` e `RecordManager.php`. Modificare le costanti se l'ID reale differisce. |
| `record_types[].import_record_id` | Devono corrispondere agli ID nella tabella `data.import_record` per `import_main_id = 1120` |
| `record_types[].code` | Codici 3 lettere: ASV, EMP, VAI, SWI, PSR, TSR, CLM, TRU, DMF, DDC, SWO |
| `record_types[].sign` | `null` per ASV, `+` per positivi, `-` per negativi |

---

## 3. Registrazione nel Routing dell'App Padre

Il controller `ctl_import_settimanale` deve essere registrato nel sistema di routing di FAWill come pagina amministrativa. Il framework chiama:

1. `getHead()` — restituisce tag `<link>` e `<script>` per Bootstrap 5, Bootstrap Icons e CSS custom
2. `getSubTool()` — restituisce stringa vuota (nessun sottomenu)
3. `getContent()` — restituisce il `<div>` mount point per Vue
4. `getScript()` — restituisce tag `<script>` per Vue 3 CDN, `app.js` e inizializzazione

Seguire lo stesso pattern di registrazione usato per `ctl_timeline_file` o altri controller in `controller/settimanale/`.

---

## 4. Configurazione Ajax — Permessi e Sicurezza

### Separazione GET/POST

I due file Ajax sono separati per motivi di sicurezza:

| File | Metodo HTTP | Operazioni |
|------|-------------|-----------|
| `ajax_import_settimanale_view.php` | GET | `config`, `headers`, `records`, `autocomplete` |
| `ajax_import_settimanale_save.php` | POST | `header_save`, `header_delete`, `header_toggle_status`, `record_save`, `record_delete`, `record_reorder` |

### Verifiche necessarie

1. **Autenticazione**: i file Ajax ereditano l'autenticazione dell'app padre. Verificare che il meccanismo di sessione/auth sia attivo per i path `model/ajax/`.
2. **CSRF**: se l'app padre implementa protezione CSRF, adeguare i file Ajax per includere il token nelle richieste POST (il frontend usa `fetch()` con `Content-Type: application/json`).
3. **Apache**: verificare che i file `.php` in `model/ajax/` siano raggiungibili via HTTP. Se servono regole di rewrite, aggiungerle nella configurazione Apache.

---

## 5. Dipendenze Esterne (CDN)

Il controller carica da CDN:

| Risorsa | URL | Versione |
|---------|-----|----------|
| Bootstrap CSS | `cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css` | 5.3.0 |
| Bootstrap Icons | `cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css` | 1.11.0 |
| Bootstrap JS | `cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js` | 5.3.0 |
| Vue 3 | `unpkg.com/vue@3/dist/vue.global.prod.js` | latest 3.x |
| Flatpickr CSS | `cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css` | latest |
| Flatpickr JS | `cdn.jsdelivr.net/npm/flatpickr` | latest |
| SortableJS | `cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js` | 1.15.0 |

Se l'app padre carica già Bootstrap 5 globalmente, rimuovere i tag duplicati da `getHead()` per evitare conflitti. Lo stesso vale per Flatpickr e SortableJS.

---

## 6. Prerequisiti Database

Lo schema è **pre-esistente** — non servono DDL. Verificare:

| Tabella | Requisito |
|---------|-----------|
| `data.import_tracking` | Deve esistere con colonne: `id`, `import_main_id`, `param_import_status_id`, `rows_imported`, `rows_rejected`, `rows_recovered`, `run_start_date`, `run_end_date`, `filename`, `last_check_start`, `last_check_end`, `last_post_start`, `last_post_end` |
| `data.import_data_flat` | Deve esistere con colonne: `id`, `import_tracking_id`, `row_id`, `import_record_id`, `source_filename`, `field_01`–`field_50` (tutti TEXT) |
| `data.param_import_status` | Deve contenere almeno la riga con `id = 1` e `description_2` valorizzato |
| `data.import_record` | Deve contenere le righe con `import_main_id = 1120` e codici ASV, EMP, ecc. |
| `company` | Tabella autocomplete con colonna `name` |
| `contract` | Tabella autocomplete con colonna `code_company` |
| `fund` | Tabella autocomplete con colonne `code`, `description` |

---

## 7. Costante `ENV_IS_DEV`

Il sistema usa la costante PHP `ENV_IS_DEV` (già definita nell'app padre) per:
- Mostrare stack trace nelle risposte di errore Ajax
- Valorizzare `is_dev` nella configurazione frontend

Non è necessario definirla: deve essere già disponibile globalmente.

---

## 8. Checklist Pre-Deploy

- [ ] File posizionati nei path corretti
- [ ] `require_once` nei file Ajax verificati e funzionanti
- [ ] Path `settimanale_settings.json` raggiungibile da `BaseConfig.php`
- [ ] Costante `IMPORT_MAIN_ID` (1120) verificata su DB
- [ ] `import_record_id` nel `settimanale_settings.json` allineati con tabella `data.import_record`
- [ ] Controller registrato nel routing dell'app padre
- [ ] File Ajax raggiungibili via HTTP (GET per view, POST per save)
- [ ] Sessione/autenticazione attiva per i file Ajax
- [ ] CDN raggiungibili dall'ambiente di produzione (o sostituiti con risorse locali)
- [ ] CDN Flatpickr e SortableJS raggiungibili (o sostituiti con risorse locali)
- [ ] Tabelle DB esistenti con le colonne attese
- [ ] Test funzionale su browser: pagina carica, config arriva, CRUD funziona

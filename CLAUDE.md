# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Settimanale" — Vue.js + PHP + PostgreSQL CRUD app for managing insurance fund import records. Manages headers (`data.import_tracking`) and child records (`data.import_data_flat`) representing financial operations on investment funds. Integrates into a larger PHP application (FirstAdvisory FAWill). Comments and variable names are in Italian.

## Tech Stack

- **Frontend:** Vue 3 CDN (Options API, no SFC, no TypeScript) + Bootstrap 5 CDN + Bootstrap Icons
- **Backend:** PHP 7.4 (`declare(strict_types=1)`, no enums/match/readonly)
- **Database:** PostgreSQL 16 (pre-existing schema, no DDL)
- **DB Access:** `TraitTryQuery` trait — `$this->tryQuery($stmt, $bindings)` → `?PDOStatement`
- **Webserver:** Apache (part of parent application)

## Project Structure

```
Controller: FirstAdvisory\FAWill\controller\Settimanale\ctl_import_settimanale
  getHead() / getSubTool() / getContent() / getScript()

Model: FirstAdvisory\FAWill\model\Import\Settimanale
AjaxResponseHelper.php, BaseConfig.php, FormHelper.php, HeaderManager.php, RecordManager.php

Ajax (2 files, separated for auth):
  /model/ajax/ajax_import_settimanale_view.php  (GET only)
  /model/ajax/ajax_import_settimanale_save.php  (POST only)

Frontend:
  ./assets-fa/css/settimanale/main.css
  ./assets-fa/js/settimanale/app.js, components.js, utils.js
```

## Key Patterns

- **Controller pattern:** PHP class with `getHead()`, `getContent()`, `getScript()` — see `example/ctl_timeline_file.php`
- **DB access:** All model classes `use TraitTryQuery;` — see `example/TraitTryQuery.php`
- **Transactions:** Single query: `tryQuery($sql, $bindings)` (auto-commit). Multi-query: `tryQuery($sql, $bindings, false)` + manual begin/commit, or `addQueryInStack()` + `tryQueryStack(true)`
- **Vue pattern:** Options API, `createApp({...}).mount()`, components via `app.component()`, `fetch()` for AJAX
- **DEV mode:** `ENV_IS_DEV` PHP constant already available

## Business Rules

- Currency: `valore_eur = valore_cur * exchange_rate`
- row_id: recalculated (no gaps) after record deletion
- Header filename edit: propagates to `source_filename` of all child records (atomic transaction)
- Header deletion: only if `rows_imported = 0` AND `param_import_status_id = 1`
- Record insert/delete: atomically updates header's `rows_imported` (+1/-1) and `run_end_date`
- Validations: non-blocking warnings (user can proceed)
- Autocomplete: min 2 chars, 1s debounce, max 20 results, global scope
- Tables: `company.name`, `contract.code_company`, `fund.code + fund.description`

## Record Types (3 form categories)

1. **ASV** (neutral/null) — Policy valuation
2. **EMP, VAI, SWI** (positive/+) — Capital additions
3. **PSR, TSR, CLM, TRU, DMF, DDC, SWO** (negative/-) — Capital reductions

## Project Documentation

- `README.md` — Original spec (Italian)
- `./plane/PIANO_ESECUZIONE.md` — Multi-agent execution plan (FINAL)
- `./plane/ITERAZIONE_QA.md` — All 38 Q&A points resolved across 4 iterations
- `./docs/ACCEPTANCE_CRITERIA.md` — Criteri di accettazione
- `./docs/API_CONTRACT.md` — Specifiche API Backend
- `./docs/DEPLOY.md` — Processo di Deploy
- `./docs/GLOSSARIO.md` — Glossario
- `./docs/QUERY_REFERENCE.md` — Query
- `./docs/SCHEMA_REFERENCE.md` — Schema DB
- `./docs/SPEC_REQUISITI.md` — Requisiti sel progetto
- `./docs/TEST_ENVIRONMENT.md` — Ambiente di test

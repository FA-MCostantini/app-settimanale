# Changelog

## [1.1.1] - 2026-03-16

### Modifiche UI — Icone azioni testata

- Rimosso link cliccabile dal testo filename (tabella testate e vista dettaglio righe), ora testo semplice
- Aggiunta icona "apri in nuova scheda" (`bi-box-arrow-up-right`) con `target="_blank"` verso `/import/{id}`
- Riordinamento colonne azioni in tabella testate: Link esterno - Lucchetto - Cestino
- Aggiunta icone Link esterno, Lucchetto e Cestino nella vista dettaglio righe (riga info "Inserimento/Ultima modifica", allineate a destra)
- Icona link esterno: attiva (colore link) se `status_id !== 1`, disabilitata (grigia) se `status_id === 1`
- Lucchetto toggle disponibile anche dalla vista dettaglio righe (stesso comportamento tabella testate)
- Cestino sempre visibile in entrambe le viste; disabilitato (grigio) con toast di avviso se l'importazione e' bloccata o contiene righe

## [1.1.0]

Versione precedente.

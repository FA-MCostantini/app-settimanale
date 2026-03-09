// noinspection JSUnresolvedReference,HtmlUnknownAttribute,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

/**
 * Settimanale Import App — Vue 3 CDN (Options API)
 *
 * Applicazione frontend per la gestione dell'import operazioni assicurative.
 * Struttura logica:
 *
 *   data()         — Stato reattivo (config, headers, records, modal, autocomplete, paginazione)
 *   computed       — Proprietà derivate (campi form, filtri, paginazione, validazione warning, bottoni)
 *   methods        — Organizzati in sezioni:
 *     [API]            — apiGet / apiPost (chiamate fetch verso i 2 endpoint Ajax)
 *     [DATA LOADING]   — loadConfig / loadHeaders / loadRecords
 *     [NAVIGATION]     — openHeaderDetail / backToHeaders
 *     [SORTING]        — toggleSort / getSortIcon (tri-state: nan → asc → desc)
 *     [PAGINATION]     — changePage / changePageSize
 *     [HEADER CRUD]    — openNewHeaderModal / saveHeader / deleteHeader / canDeleteHeader
 *     [FILENAME EDIT]  — startEditFilename / saveFilename / cancelEditFilename
 *     [RECORD CRUD]    — openCreateModal / openEditModal / openDuplicateModal / changeRecordTypeInDuplicate / saveRecord / deleteRecord
 *     [AUTOCOMPLETE]   — handleAutocomplete / selectAutocomplete (debounce 1s, min 2 chars)
 *     [CALCULATED]     — getCalculatedEur / getAutoCopyValue / getEurToCurField
 *     [COLORS]         — generateColdShade / generateWarmShade / generateGreenShade (HSL per sign)
 *     [FIELD HELPERS]  — getFieldLabel / shouldShowField / getFieldValue
 *   template       — 5 sezioni visive:
 *     [HEADERS VIEW]   — Tabella testate con filtro, ordinamento, paginazione
 *     [DETAIL VIEW]    — Dettaglio testata con record, bottoni tipo, tabella record
 *     [RECORD MODAL]   — Modale creazione/modifica/duplicazione record
 *     [HEADER MODAL]   — Modale creazione testata
 *     [DELETE CONFIRM]  — Modale conferma cancellazione
 *
 * Montato dal controller PHP: createApp(ImportSettimanaleApp).mount("#app_import_settimanale")
 */

/* global Vue, bootstrap */

const ImportSettimanaleApp = {
    data() {
        return {
            // Configuration and data
            config: null,
            headers: [],
            currentView: 'headers',
            selectedHeader: null,
            records: [],

            // Loading and error states
            loading: false,
            error: null,

            // Filter and sorting
            filterText: '',
            sortColumn: null,
            sortDirection: 'nan',

            // Pagination
            pageSize: 20,
            currentPage: 1,

            // Modal state
            showRecordModal: false,
            showSaveConfirm: false,
            modalMode: null, // 'create', 'edit', 'duplicate'
            modalRecordType: null,
            modalData: {},
            modalWarnings: [],

            // Autocomplete
            autocompleteResults: {},
            autocompleteLoading: {},
            debounceTimers: {},

            // Header modal
            showHeaderModal: false,
            headerModalData: { id: null, filename: '' },

            // Delete confirmation
            showDeleteConfirm: false,
            deleteTarget: null, // { type: 'header'|'record', id: number }

            // Filename edit mode
            editingFilename: false,
            editFilenameValue: '',

            // Toast feedback
            toast: { show: false, message: '', type: 'success' },

            // Loading ritardato
            loadingTimer: null,
            loadingVisible: false,

            // Larghezza wrapper records (calcolata dal parent)
            recordsWrapperWidth: 800
        };
    },

    computed: {
        // Get field configuration for current modal type
        currentFormFields() {
            if (!this.config || !this.modalRecordType) return [];

            const recordType = this.config.record_types.find(rt => rt.code === this.modalRecordType);
            if (!recordType) return [];

            const fields = [...this.config.common_fields];

            if (recordType.form_type === 'valuation') {
                fields.push(...this.config.valuation_fields);
            } else if (recordType.form_type === 'positive') {
                fields.push(...this.config.positive_fields);
            } else if (recordType.form_type === 'negative') {
                fields.push(...this.config.negative_fields);
            }

            return fields;
        },

        // Get record type configuration
        recordTypeConfig() {
            if (!this.config || !this.modalRecordType) return null;
            return this.config.record_types.find(rt => rt.code === this.modalRecordType);
        },

        // Filtered and sorted headers
        filteredHeaders() {
            if (!this.headers) return [];

            let filtered = this.headers;

            // Apply filter
            if (this.filterText.trim()) {
                const query = this.filterText.toLowerCase();
                filtered = filtered.filter(h => {
                    return Object.values(h).some(val =>
                        val && val.toString().toLowerCase().includes(query)
                    );
                });
            }

            // Apply sorting
            if (this.sortColumn && this.sortDirection !== 'nan') {
                filtered = [...filtered].sort((a, b) => {
                    const aVal = a[this.sortColumn];
                    const bVal = b[this.sortColumn];

                    // Handle null values
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;

                    // Compare
                    if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            return filtered;
        },

        // Paginated headers
        paginatedHeaders() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredHeaders.slice(start, end);
        },

        // Total pages for headers
        totalHeaderPages() {
            return Math.ceil(this.filteredHeaders.length / this.pageSize);
        },

        // Filtered and sorted records
        filteredRecords() {
            if (!this.records) return [];

            let filtered = this.records;

            // Apply filter
            if (this.filterText.trim()) {
                const query = this.filterText.toLowerCase();
                filtered = filtered.filter(r => {
                    return Object.values(r).some(val =>
                        val && val.toString().toLowerCase().includes(query)
                    );
                });
            }

            // Apply sorting: if sort active use it, otherwise default by field_02 numeric asc
            if (this.sortColumn && this.sortDirection !== 'nan') {
                filtered = [...filtered].sort((a, b) => {
                    const aVal = a[this.sortColumn];
                    const bVal = b[this.sortColumn];
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;
                    if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
            } else {
                filtered = [...filtered].sort((a, b) => {
                    return (parseInt(a.field_02) || 0) - (parseInt(b.field_02) || 0);
                });
            }

            return filtered;
        },

        // Paginated records
        paginatedRecords() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredRecords.slice(start, end);
        },

        // Total pages for records
        totalRecordPages() {
            return Math.ceil(this.filteredRecords.length / this.pageSize);
        },

        // Validation warnings for current modal data
        validationWarnings() {
            const warnings = [];

            if (!this.recordTypeConfig || !this.modalData) return warnings;

            const data = this.modalData;
            const formType = this.recordTypeConfig.form_type;

            // Helper to parse float
            const f = (val) => parseFloat(val) || 0;

            // Helper per label in grassetto maiuscolo (HTML)
            const L = (fieldId) => '<strong class="text-uppercase">' + this.getFieldLabel(fieldId) + '</strong>';

            if (formType === 'valuation') {
                const product = f(data.field_36) * f(data.field_38);
                const assetValue = f(data.field_40);
                if (Math.abs(product - assetValue) > 0.01) {
                    warnings.push({
                        message: L('field_36') + ' x ' + L('field_38') + ' non corrisponde a ' + L('field_40'),
                        fields: ['field_36', 'field_38', 'field_40']
                    });
                }
            } else if (formType === 'positive') {
                const diff = f(data.field_16) - f(data.field_18);
                const sum = f(data.field_20) + f(data.field_22);
                if (Math.abs(diff - sum) > 0.01) {
                    warnings.push({
                        message: L('field_16') + ' - ' + L('field_18') + ' non corrisponde a ' + L('field_20') + ' + ' + L('field_22'),
                        fields: ['field_16', 'field_18', 'field_20', 'field_22']
                    });
                }

                const product = f(data.field_36) * f(data.field_38);
                const invested = f(data.field_18);
                if (Math.abs(product - invested) > 0.01) {
                    warnings.push({
                        message: L('field_36') + ' x ' + L('field_38') + ' non corrisponde a ' + L('field_18'),
                        fields: ['field_36', 'field_38', 'field_18']
                    });
                }
            } else if (formType === 'negative') {
                const diff = f(data.field_24) - f(data.field_26);
                const sum = f(data.field_28) + f(data.field_30) + f(data.field_34) - f(data.field_32);
                if (Math.abs(diff - sum) > 0.01) {
                    warnings.push({
                        message: L('field_24') + ' - ' + L('field_26') + ' non corrisponde a ' + L('field_28') + ' + ' + L('field_30') + ' + ' + L('field_34') + ' - ' + L('field_32'),
                        fields: ['field_24', 'field_26', 'field_28', 'field_30', 'field_34', 'field_32']
                    });
                }

                const product = f(data.field_37) * f(data.field_38);
                const gross = f(data.field_24);
                if (Math.abs(product - gross) > 0.01) {
                    warnings.push({
                        message: L('field_37') + ' x ' + L('field_38') + ' non corrisponde a ' + L('field_24'),
                        fields: ['field_37', 'field_38', 'field_24']
                    });
                }
            }

            return warnings;
        },

        // Set di field_id con warning attivi (per evidenziare i bordi)
        warningFieldIds() {
            const ids = new Set();
            this.validationWarnings.forEach(w => {
                w.fields.forEach(fid => ids.add(fid));
            });
            return ids;
        },

        // Button colors for record types
        recordTypeButtons() {
            if (!this.config) return [];

            const positive = this.config.record_types.filter(rt => rt.sign === '+');
            const negative = this.config.record_types.filter(rt => rt.sign === '-');
            const neutral = this.config.record_types.filter(rt => rt.sign === null);

            return [
                ...neutral.map((rt, i) => ({
                    ...rt,
                    color: this.generateGreenShade(i, neutral.length)
                })),
                ...positive.map((rt, i) => ({
                    ...rt,
                    color: this.generateColdShade(i, positive.length)
                })),
                ...negative.map((rt, i) => ({
                    ...rt,
                    color: this.generateWarmShade(i, negative.length)
                }))
            ];
        },

        // La testata selezionata è modificabile (stato = 1)
        isHeaderEditable() {
            return this.selectedHeader && this.selectedHeader.param_import_status_id === 1;
        },

        // Finestra scorrevole paginazione (max 10 pagine visibili)
        visiblePages() {
            const totalPages = this.currentView === 'headers' ? this.totalHeaderPages : this.totalRecordPages;
            if (totalPages <= 10) {
                return Array.from({ length: totalPages }, (_, i) => i + 1);
            }
            let start = Math.max(1, this.currentPage - 4);
            let end = Math.min(totalPages, start + 9);
            start = Math.max(1, end - 9);
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
    },

    methods: {
        // === API CALLS ===

        async apiGet(action, params = {}) {
            const url = new URL('/model/ajax/ajax_import_settimanale_view.php', window.location.origin);
            url.searchParams.set('action', action);
            Object.entries(params).forEach(([key, val]) => {
                url.searchParams.set(key, String(val));
            });

            const response = await fetch(url);
            const json = await response.json();

            if (!json.success) {
                throw new Error(json.message || 'Errore sconosciuto');
            }

            return json.data;
        },

        async apiPost(action, data) {
            const response = await fetch('/model/ajax/ajax_import_settimanale_save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...data })
            });

            const json = await response.json();

            if (!json.success) {
                const errorMsg = json.message || 'Errore sconosciuto';
                throw new Error(this.config?.is_dev && json.exception
                    ? `${errorMsg}\n\n${json.exception}`
                    : errorMsg);
            }

            return json.data;
        },

        // === DATA LOADING ===

        async loadConfig() {
            try {
                this.loading = true;
                this.config = await this.apiGet('config');
            } catch (e) {
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        },

        async loadHeaders() {
            try {
                this.loading = true;
                this.headers = await this.apiGet('headers');
            } catch (e) {
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        },

        async loadRecords(trackingId) {
            try {
                this.loading = true;
                this.records = await this.apiGet('records', { tracking_id: trackingId });
            } catch (e) {
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        },

        // === VIEW NAVIGATION ===

        async openHeaderDetail(header) {
            this.selectedHeader = header;
            this.currentView = 'detail';
            this.currentPage = 1;
            this.filterText = '';
            this.sortColumn = null;
            this.sortDirection = 'nan';
            await this.loadRecords(header.id);
            this.$nextTick(() => this.updateRecordsWrapperWidth());
            history.pushState({ view: 'detail', headerId: header.id }, '', '');
        },

        backToHeaders() {
            this.currentView = 'headers';
            this.selectedHeader = null;
            this.records = [];
            this.currentPage = 1;
            this.filterText = '';
            history.pushState({ view: 'headers' }, '', '');
        },

        // === SORTING ===

        toggleSort(column) {
            if (this.sortColumn === column) {
                if (this.sortDirection === 'nan') {
                    this.sortDirection = 'asc';
                } else if (this.sortDirection === 'asc') {
                    this.sortDirection = 'desc';
                } else {
                    this.sortDirection = 'nan';
                    this.sortColumn = null;
                }
            } else {
                this.sortColumn = column;
                this.sortDirection = 'asc';
            }
            this.currentPage = 1;
        },

        getSortIcon(column) {
            if (this.sortColumn !== column || this.sortDirection === 'nan') {
                return 'bi-arrow-down-up';
            }
            return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
        },

        // === PAGINATION ===

        changePage(page) {
            this.currentPage = page;
        },

        changePageSize(size) {
            this.pageSize = size;
            this.currentPage = 1;
        },

        // === HEADER OPERATIONS ===

        openNewHeaderModal() {
            this.headerModalData = { id: null, filename: '' };
            this.showHeaderModal = true;
        },

        async saveHeader() {
            try {
                this.loading = true;
                const saved = await this.apiPost('header_save', this.headerModalData);

                if (this.headerModalData.id) {
                    // Update existing
                    const idx = this.headers.findIndex(h => h.id === saved.id);
                    if (idx !== -1) {
                        this.headers[idx] = saved;
                    }
                    if (this.selectedHeader && this.selectedHeader.id === saved.id) {
                        this.selectedHeader = saved;
                    }
                } else {
                    // Add new
                    this.headers.unshift(saved);
                }

                this.showHeaderModal = false;
                this.showToast('Testata salvata con successo');
            } catch (e) {
                this.showToast(e.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        async deleteHeader(header) {
            this.deleteTarget = { type: 'header', id: header.id };
            this.showDeleteConfirm = true;
        },

        async confirmDelete() {
            if (!this.deleteTarget) return;

            try {
                this.loading = true;

                if (this.deleteTarget.type === 'header') {
                    await this.apiPost('header_delete', { id: this.deleteTarget.id });
                    this.headers = this.headers.filter(h => h.id !== this.deleteTarget.id);
                } else if (this.deleteTarget.type === 'record') {
                    const result = await this.apiPost('record_delete', {
                        id: this.deleteTarget.id,
                        import_tracking_id: this.selectedHeader.id
                    });
                    this.selectedHeader = result.updated_header;

                    // Update header in list
                    const idx = this.headers.findIndex(h => h.id === this.selectedHeader.id);
                    if (idx !== -1) {
                        this.headers[idx] = this.selectedHeader;
                    }

                    // Reload records from server (row_id ricalcolati senza buchi)
                    await this.loadRecords(this.selectedHeader.id);
                }

                this.showDeleteConfirm = false;
                this.deleteTarget = null;
                this.showToast('Eliminazione completata');
            } catch (e) {
                this.showToast(e.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        canDeleteHeader(header) {
            return header.rows_imported === 0 && header.param_import_status_id === 1;
        },

        async toggleHeaderStatus(header) {
            try {
                this.loading = true;
                const updated = await this.apiPost('header_toggle_status', { id: header.id });

                const idx = this.headers.findIndex(h => h.id === updated.id);
                if (idx !== -1) {
                    this.headers[idx] = updated;
                }
                if (this.selectedHeader && this.selectedHeader.id === updated.id) {
                    this.selectedHeader = updated;
                }
                this.showToast('Stato aggiornato');
            } catch (e) {
                this.showToast(e.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        // === FILENAME EDITING ===

        startEditFilename() {
            this.editingFilename = true;
            this.editFilenameValue = this.selectedHeader.filename;
        },

        async saveFilename() {
            try {
                this.loading = true;
                const saved = await this.apiPost('header_save', {
                    id: this.selectedHeader.id,
                    filename: this.editFilenameValue
                });

                this.selectedHeader = saved;
                this.editingFilename = false;

                // Update in headers list
                const idx = this.headers.findIndex(h => h.id === saved.id);
                if (idx !== -1) {
                    this.headers[idx] = saved;
                }
                this.showToast('Filename aggiornato');
            } catch (e) {
                this.showToast(e.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        cancelEditFilename() {
            this.editingFilename = false;
            this.editFilenameValue = '';
        },

        // === RECORD OPERATIONS ===

        openCreateModal(recordType) {
            this.modalMode = 'create';
            this.modalRecordType = recordType;
            this.modalData = this.getDefaultFieldValues();
            this.autocompleteResults = {};
            this.showRecordModal = true;
        },

        openEditModal(record) {
            this.modalMode = 'edit';
            this.modalRecordType = record.record_type;
            this.modalData = { ...record };
            this.autocompleteResults = {};
            this.showRecordModal = true;
        },

        openDuplicateModal(record) {
            this.modalMode = 'duplicate';
            this.modalRecordType = record.record_type;
            this.modalData = { ...record };
            delete this.modalData.id;
            this.autocompleteResults = {};
            this.showRecordModal = true;
        },

        closeRecordModal() {
            this.showRecordModal = false;
            this.showSaveConfirm = false;
        },

        confirmSaveRecord() {
            this.fillAllCalculatedFields();
            this.showSaveConfirm = true;
        },

        changeRecordTypeInDuplicate(newType) {
            const newTypeConfig = this.config.record_types.find(rt => rt.code === newType);

            if (this.recordTypeConfig.form_type === newTypeConfig.form_type) {
                // Same group: keep all fields, just change type
                this.modalRecordType = newType;
            } else {
                // Different group: keep common fields, reset specific fields
                const newData = {};

                // Keep common fields
                this.config.common_fields.forEach(f => {
                    if (this.modalData[f.field] !== undefined) {
                        newData[f.field] = this.modalData[f.field];
                    }
                });

                // Add default values for new specific fields
                const specificFields = newTypeConfig.form_type === 'valuation'
                    ? this.config.valuation_fields
                    : newTypeConfig.form_type === 'positive'
                        ? this.config.positive_fields
                        : this.config.negative_fields;

                specificFields.forEach(f => {
                    newData[f.field] = f.default || '';
                });

                this.modalData = newData;
                this.modalRecordType = newType;
            }
        },

        async saveRecord() {
            try {
                this.loading = true;
                this.showSaveConfirm = false;

                const payload = {
                    id: this.modalMode === 'create' || this.modalMode === 'duplicate' ? null : this.modalData.id,
                    import_tracking_id: this.selectedHeader.id,
                    record_type: this.modalRecordType,
                    fields: {}
                };

                // Collect field values
                this.currentFormFields.forEach(f => {
                    if (f.input !== 'automatic' && this.modalData[f.field] !== undefined) {
                        payload.fields[f.field] = this.modalData[f.field];
                    }
                });

                const saved = await this.apiPost('record_save', payload);

                if (this.modalMode === 'edit') {
                    const idx = this.records.findIndex(r => r.id === saved.id);
                    if (idx !== -1) {
                        this.records[idx] = saved;
                    }
                } else {
                    this.records.push(saved);

                    // Update header counters
                    this.selectedHeader.rows_imported++;
                    const hIdx = this.headers.findIndex(h => h.id === this.selectedHeader.id);
                    if (hIdx !== -1) {
                        this.headers[hIdx] = this.selectedHeader;
                    }
                }

                this.showRecordModal = false;
                this.showToast('Record salvato con successo');
            } catch (e) {
                this.showToast(e.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        deleteRecord(record) {
            this.deleteTarget = { type: 'record', id: record.id };
            this.showDeleteConfirm = true;
        },

        getDefaultFieldValues() {
            const data = {};

            this.currentFormFields.forEach(f => {
                if (f.default !== undefined) {
                    data[f.field] = f.default;
                } else if (f.type === 'float') {
                    data[f.field] = '0';
                } else {
                    data[f.field] = '';
                }
            });

            return data;
        },

        // === AUTOCOMPLETE ===

        async handleAutocomplete(fieldId, fieldName, event) {
            const query = event.target.value;

            // Parametri extra per cascata: company → policy → fund
            const extraParams = {};
            if (fieldName === 'policy_number') {
                if (this.modalData.field_04) extraParams.company = this.modalData.field_04;
            } else if (fieldName === 'fund_code') {
                if (this.modalData.field_04) extraParams.company = this.modalData.field_04;
                if (this.modalData.field_06) extraParams.policy_number = this.modalData.field_06;
            }

            // Per fund_code con contesto, accetta query vuota
            const hasContext = fieldName === 'fund_code' && (extraParams.company || extraParams.policy_number);
            if (query.length < 2 && !hasContext) {
                this.autocompleteResults[fieldId] = [];
                return;
            }

            // Clear existing timer
            if (this.debounceTimers[fieldId]) {
                clearTimeout(this.debounceTimers[fieldId]);
            }

            // Set new timer — API uses fieldName (e.g. 'company'), keys use fieldId (e.g. 'field_04')
            this.debounceTimers[fieldId] = setTimeout(async () => {
                try {
                    this.autocompleteLoading[fieldId] = true;
                    this.autocompleteResults[fieldId] = await this.apiGet('autocomplete', {
                        field: fieldName,
                        query: query,
                        ...extraParams
                    });
                } catch (e) {
                    console.error('Autocomplete error:', e);
                    this.autocompleteResults[fieldId] = [];
                } finally {
                    this.autocompleteLoading[fieldId] = false;
                }
            }, 1000);
        },

        selectAutocomplete(fieldId, item) {
            this.modalData[fieldId] = item.value;

            // Autofill fund description and fund_type when fund_code is selected
            if (fieldId === 'field_12') {
                if (item.description) {
                    this.modalData.field_13 = item.description;
                }
                if (item.fund_type) {
                    this.modalData.field_11 = item.fund_type;
                }
            }

            this.autocompleteResults[fieldId] = [];
        },

        isFieldDisabled(fieldName) {
            // policy_number disabilitato se company vuoto
            if (fieldName === 'policy_number') return !this.modalData.field_04;
            // fund_code, fund_type, fund_description disabilitati se policy_number vuoto
            if (fieldName === 'fund_code' || fieldName === 'fund_type' || fieldName === 'fund_description') return !this.modalData.field_06;
            return false;
        },

        handleAutocompleteFocus(fieldId, fieldName) {
            // Solo per fund_code con contesto (policy_number valorizzato)
            if (fieldName !== 'fund_code') return;
            if (!this.modalData.field_06 && !this.modalData.field_04) return;

            // Simula evento input con query vuota per triggerare ricerca
            this.handleAutocomplete(fieldId, fieldName, { target: { value: this.modalData[fieldId] || '' } });
        },

        // === CALCULATED FIELDS ===

        // EUR field -> corresponding CUR field mapping
        // Built from config: each calculated EUR field (odd number) pairs with the user-input CUR field (even number) before it
        getEurToCurField(eurFieldId) {
            const eurToCurMap = {
                'field_17': 'field_16',  // gross_premium_eur -> gross_premium_cur
                'field_19': 'field_18',  // invested_premium_eur -> invested_premium_cur
                'field_21': 'field_20',  // entry_fee_eur -> entry_fee_cur
                'field_23': 'field_22',  // entry_expenses_eur -> entry_expenses_cur
                'field_25': 'field_24',  // gross_outgoing_eur -> gross_outgoing_cur
                'field_27': 'field_26',  // net_outgoing_payment_eur -> net_outgoing_payment_cur
                'field_29': 'field_28',  // operation_cost_eur -> operation_cost_cur
                'field_31': 'field_30',  // tax_liq_eur -> tax_liq_cur
                'field_33': 'field_32',  // bonus_liq_eur -> bonus_liq_cur
                'field_35': 'field_34',  // duty_liq_eur -> duty_liq_cur
                'field_39': 'field_38',  // unit_quotation_eur -> unit_quotation_cur
                'field_41': 'field_40'   // asset_value_eur -> asset_value_cur
            };
            return eurToCurMap[eurFieldId] || null;
        },

        getCalculatedEur(eurFieldId) {
            const curField = this.getEurToCurField(eurFieldId);
            if (!curField) return '0';
            const curValue = parseFloat(this.modalData[curField]) || 0;
            const exchangeRate = parseFloat(this.modalData.field_15) || 1;
            return (curValue * exchangeRate).toFixed(2);
        },

        getAutoCopyValue(sourceField) {
            return this.modalData[sourceField] ?? '0';
        },

        fillCalculatedField(fieldId) {
            this.modalData[fieldId] = this.getCalculatedEur(fieldId);
        },

        fillAllCalculatedFields() {
            this.currentFormFields.forEach(f => {
                if (f.input === 'calculated') {
                    const current = parseFloat(this.modalData[f.field]) || 0;
                    if (current === 0) {
                        this.modalData[f.field] = this.getCalculatedEur(f.field);
                    }
                }
            });
        },

        // === COLOR GENERATION ===

        generateColdShade(index, total) {
            // Blue shades for positive
            const hue = 210; // Blue base
            const saturation = 60 + (index * 10);
            const lightness = 45 + (index * 5);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        },

        generateWarmShade(index, total) {
            // Red shades for negative
            const hue = 0; // Red base
            const saturation = 60 + (index * 10);
            const lightness = 45 + (index * 5);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        },

        generateGreenShade(index, total) {
            // Green for neutral
            return '#28a745';
        },

        // === FIELD HELPERS ===

        getFieldLabel(fieldName) {
            const allFields = [
                ...this.config.common_fields,
                ...this.config.valuation_fields,
                ...this.config.positive_fields,
                ...this.config.negative_fields
            ];

            const field = allFields.find(f => f.field === fieldName);
            return field ? field.name : fieldName;
        },

        shouldShowField(record, fieldName) {
            const recordType = this.config.record_types.find(rt => rt.code === record.record_type);
            if (!recordType) return false;

            // Common fields always shown
            if (this.config.common_fields.find(f => f.field === fieldName)) {
                return true;
            }

            // Type-specific fields
            if (recordType.form_type === 'valuation') {
                return this.config.valuation_fields.find(f => f.field === fieldName);
            } else if (recordType.form_type === 'positive') {
                return this.config.positive_fields.find(f => f.field === fieldName);
            } else if (recordType.form_type === 'negative') {
                return this.config.negative_fields.find(f => f.field === fieldName);
            }

            return false;
        },

        getFieldValue(record, fieldName) {
            return record[fieldName] ?? '';
        },

        // === TOAST ===

        showToast(message, type) {
            if (type === undefined) type = 'success';
            this.toast = { show: true, message: message, type: type };
            setTimeout(() => { this.toast.show = false; }, 3000);
        },

        // === FIELD APPLICABILITY ===

        isFieldApplicable(recordType, fieldId) {
            if (!this.config) return true;
            const rt = this.config.record_types.find(r => r.code === recordType);
            if (!rt) return true;

            const formType = rt.form_type;

            // Common fields always applicable
            const commonIds = ['field_01','field_02','field_04','field_06','field_11','field_12','field_13','field_14','field_15','field_49','field_50'];
            if (commonIds.indexOf(fieldId) !== -1) return true;

            // Shared: field_38, field_39, field_40, field_41 always applicable
            if (['field_38','field_39','field_40','field_41'].indexOf(fieldId) !== -1) return true;

            if (formType === 'valuation') {
                return ['field_36'].indexOf(fieldId) !== -1;
            } else if (formType === 'positive') {
                return ['field_16','field_17','field_18','field_19','field_20','field_21','field_22','field_23','field_36'].indexOf(fieldId) !== -1;
            } else if (formType === 'negative') {
                return ['field_24','field_25','field_26','field_27','field_28','field_29','field_30','field_31','field_32','field_33','field_34','field_35','field_37'].indexOf(fieldId) !== -1;
            }

            return true;
        },

        // === RECORD SIGN COLOR ===

        getRecordSignColor(recordType) {
            if (!this.config) return '#28a745';
            const rt = this.config.record_types.find(r => r.code === recordType);
            if (!rt) return '#28a745';
            if (rt.sign === '+') return '#0d6efd';
            if (rt.sign === '-') return '#dc3545';
            return '#28a745';
        },

        // === DRAG-AND-DROP ===

        destroySortable() {
            if (this._sortableInstance) {
                this._sortableInstance.destroy();
                this._sortableInstance = null;
            }
        },

        initSortable() {
            this.destroySortable();
            const container = this.$refs.recordsSplitContainer;
            if (!container) return;
            const tbody = container.querySelector('.records-fixed tbody');
            if (!tbody) return;

            const self = this;
            this._sortableInstance = Sortable.create(tbody, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: async function() {
                    const rows = tbody.querySelectorAll('tr[data-record-id]');
                    const orderedIds = [];
                    rows.forEach(function(row) { orderedIds.push(parseInt(row.dataset.recordId)); });
                    if (orderedIds.length === 0) return;
                    try {
                        await self.apiPost('record_reorder', {
                            import_tracking_id: self.selectedHeader.id,
                            ordered_ids: orderedIds
                        });
                        await self.loadRecords(self.selectedHeader.id);
                        self.showToast('Ordine aggiornato');
                    } catch (e) {
                        self.showToast(e.message, 'error');
                    }
                }
            });
        },

        // Calcola la larghezza disponibile dal card-body parent
        updateRecordsWrapperWidth() {
            const wrapper = this.$refs.recordsWrapper;
            if (!wrapper) return;
            // Nascondi temporaneamente il wrapper per non influenzare la misura
            const prevWidth = wrapper.style.width;
            wrapper.style.width = '0px';
            const cardBody = wrapper.closest('.card-body');
            if (cardBody) {
                const style = getComputedStyle(cardBody);
                const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
                this.recordsWrapperWidth = cardBody.clientWidth - padding;
            }
            wrapper.style.width = this.recordsWrapperWidth + 'px';
        },

        // Sincronizza altezze righe tra tabella fissa e scrollabile
        syncRowHeights() {
            this.$nextTick(() => {
                const container = this.$refs.recordsSplitContainer;
                if (!container) return;

                const leftRows = container.querySelector('.records-fixed tbody')?.querySelectorAll('tr') || [];
                const rightRows = container.querySelector('.records-scroll tbody')?.querySelectorAll('tr') || [];
                const leftHeadRow = container.querySelector('.records-fixed thead tr');
                const rightHeadRow = container.querySelector('.records-scroll thead tr');

                // Sync header row
                if (leftHeadRow && rightHeadRow) {
                    leftHeadRow.style.height = '';
                    rightHeadRow.style.height = '';
                    const maxH = Math.max(leftHeadRow.offsetHeight, rightHeadRow.offsetHeight);
                    leftHeadRow.style.height = maxH + 'px';
                    rightHeadRow.style.height = maxH + 'px';
                }

                // Sync body rows
                const count = Math.min(leftRows.length, rightRows.length);
                for (let i = 0; i < count; i++) {
                    leftRows[i].style.height = '';
                    rightRows[i].style.height = '';
                    const maxH = Math.max(leftRows[i].offsetHeight, rightRows[i].offsetHeight);
                    leftRows[i].style.height = maxH + 'px';
                    rightRows[i].style.height = maxH + 'px';
                }
            });
        }
    },

    watch: {
        paginatedRecords() {
            this.$nextTick(() => {
                this.syncRowHeights();
                this.initSortable();

                // ResizeObserver
                if (this._resizeObserver) {
                    this._resizeObserver.disconnect();
                }
                const container = this.$refs.recordsSplitContainer;
                if (container && this._resizeObserver) {
                    this._resizeObserver.observe(container);
                }
            });
        },
        loading(newVal) {
            if (newVal) {
                this.loadingTimer = setTimeout(() => { this.loadingVisible = true; }, 300);
            } else {
                clearTimeout(this.loadingTimer);
                this.loadingTimer = null;
                this.loadingVisible = false;
            }
        }
    },

    async mounted() {
        await this.loadConfig();
        if (this.config) {
            await this.loadHeaders();
        }

        // ResizeObserver per sincronizzare altezze righe
        this._resizeObserver = new ResizeObserver(() => this.syncRowHeights());

        // Stato iniziale browser history
        history.replaceState({ view: 'headers' }, '');

        // Click fuori dall'autocomplete chiude il dropdown
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.autocomplete-dropdown') && !event.target.closest('input[type="text"]')) {
                this.autocompleteResults = {};
            }
        });

        // Listener per ricalcolo larghezza wrapper records
        this._updateWidthBound = () => this.updateRecordsWrapperWidth();
        window.addEventListener('resize', this._updateWidthBound);

        // Listener per navigazione avanti/indietro
        window.addEventListener('popstate', (event) => {
            if (!event.state || event.state.view === 'headers') {
                this.currentView = 'headers';
                this.selectedHeader = null;
                this.records = [];
                this.currentPage = 1;
                this.filterText = '';
            } else if (event.state.view === 'detail') {
                const header = this.headers.find(h => h.id === event.state.headerId);
                if (header) {
                    this.selectedHeader = header;
                    this.currentView = 'detail';
                    this.currentPage = 1;
                    this.filterText = '';
                    this.sortColumn = null;
                    this.sortDirection = 'nan';
                    this.loadRecords(header.id).then(() => {
                        this.$nextTick(() => this.updateRecordsWrapperWidth());
                    });
                }
            }
        });
    },

    beforeUnmount() {
        if (this._updateWidthBound) {
            window.removeEventListener('resize', this._updateWidthBound);
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        this.destroySortable();
    },

    template: `
        <div class="container-fluid py-4">
            <!-- Toast Feedback -->
            <div v-if="toast.show" class="toast-container-custom">
                <div class="toast-custom" :class="toast.type === 'error' ? 'toast-error' : 'toast-success'">
                    <i class="bi me-2" :class="toast.type === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'"></i>
                    {{ toast.message }}
                </div>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Errore:</strong> {{ error }}
                <button type="button" class="btn-close" @click="error = null"></button>
            </div>

            <!-- Loading Overlay -->
            <div v-if="loadingVisible" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                 style="background: rgba(255,255,255,0.8); z-index: 9999;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>

            <!-- HEADERS VIEW -->
            <div v-if="currentView === 'headers' && config">
                <div class="card shadow-sm border-0">
                    <div class="card-body bg-light rounded p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="mb-0 fw-bold text-dark">
                                <i class="bi bi-file-earmark-spreadsheet me-2"></i>
                                Import Settimanale
                            </h2>
                            <button class="btn btn-primary" @click="openNewHeaderModal">
                                <i class="bi bi-plus-circle me-2"></i>Nuova Testata
                            </button>
                        </div>

                        <!-- Filter and Page Size -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <input type="text" class="form-control" placeholder="Filtra..." v-model="filterText">
                            </div>
                            <div class="col-md-6 text-end">
                                <label class="me-2">Righe per pagina:</label>
                                <select class="form-select d-inline-block w-auto" v-model.number="pageSize" @change="changePageSize(pageSize)">
                                    <option :value="20">20</option>
                                    <option :value="50">50</option>
                                    <option :value="100">100</option>
                                </select>
                            </div>
                        </div>

                        <!-- Headers Table -->
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th class="fw-bold" style="width: 50px;"></th>
                                        <th v-for="col in config.header_columns" :key="col.field"
                                            class="fw-bold"
                                            @click="toggleSort(col.field)" style="cursor: pointer;">
                                            {{ col.label }}
                                            <i class="bi ms-1" :class="getSortIcon(col.field)"></i>
                                        </th>
                                        <th class="fw-bold" style="width: 50px;"></th>
                                        <th class="fw-bold" style="width: 50px;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="header in paginatedHeaders" :key="header.id">
                                        <td class="text-center">
                                            <button class="btn btn-sm btn-link text-primary" @click="openHeaderDetail(header)">
                                                <i class="bi bi-eye-fill"></i>
                                            </button>
                                        </td>
                                        <td v-for="col in config.header_columns" :key="col.field">
                                            <a v-if="col.field === 'filename'" :href="'/import/' + header.id" class="text-decoration-none">
                                                {{ header[col.field] || '-' }}
                                            </a>
                                            <template v-else>{{ header[col.field] || '-' }}</template>
                                        </td>
                                        <td class="text-center">
                                            <button v-if="canDeleteHeader(header)"
                                                    class="btn btn-sm btn-link text-danger"
                                                    @click="deleteHeader(header)">
                                                <i class="bi bi-trash-fill"></i>
                                            </button>
                                        </td>
                                        <td class="text-center">
                                            <button v-if="header.param_import_status_id === 1"
                                                    class="btn btn-sm btn-link text-success"
                                                    title="Blocca testata"
                                                    @click="toggleHeaderStatus(header)">
                                                <i class="bi bi-unlock-fill"></i>
                                            </button>
                                            <button v-else-if="header.param_import_status_id === 2"
                                                    class="btn btn-sm btn-link text-danger"
                                                    title="Sblocca testata"
                                                    @click="toggleHeaderStatus(header)">
                                                <i class="bi bi-lock-fill"></i>
                                            </button>
                                            <i v-else class="bi bi-lock-fill text-secondary"></i>
                                        </td>
                                    </tr>
                                    <tr v-if="paginatedHeaders.length === 0">
                                        <td :colspan="config.header_columns.length + 3" class="text-center text-muted">
                                            Nessuna testata trovata
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <nav v-if="totalHeaderPages > 1">
                            <ul class="pagination justify-content-center">
                                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                                    <a class="page-link" @click="changePage(currentPage - 1)">Precedente</a>
                                </li>
                                <li v-for="page in visiblePages" :key="page"
                                    class="page-item" :class="{ active: currentPage === page }">
                                    <a class="page-link" @click="changePage(page)">{{ page }}</a>
                                </li>
                                <li class="page-item" :class="{ disabled: currentPage === totalHeaderPages }">
                                    <a class="page-link" @click="changePage(currentPage + 1)">Successivo</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <!-- DETAIL VIEW -->
            <div v-if="currentView === 'detail' && selectedHeader && config">
                <div class="card shadow-sm border-0 mb-3">
                    <div class="card-body bg-light rounded">
                        <nav aria-label="breadcrumb" class="mb-3">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item"><a href="#" @click.prevent="backToHeaders">Import Settimanale</a></li>
                                <li class="breadcrumb-item active">{{ selectedHeader.filename }}</li>
                            </ol>
                        </nav>

                        <!-- Header Summary -->
                        <div class="card mb-3">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div v-if="!editingFilename" class="d-flex align-items-center">
                                        <a :href="'/import/' + selectedHeader.id" class="text-decoration-none">
                                            <h4 class="mb-0 me-2">{{ selectedHeader.filename }}</h4>
                                        </a>
                                        <button v-if="isHeaderEditable" class="btn btn-sm btn-link" @click="startEditFilename">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    </div>
                                    <div v-else class="d-flex align-items-center flex-grow-1 me-3">
                                        <input type="text" class="form-control me-2" v-model="editFilenameValue">
                                        <button class="btn btn-sm btn-success me-1" @click="saveFilename">
                                            <i class="bi bi-check-lg"></i>
                                        </button>
                                        <button class="btn btn-sm btn-secondary" @click="cancelEditFilename">
                                            <i class="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                    <div>
                                        <span class="badge bg-secondary me-2">{{ selectedHeader.status_text }}</span>
                                        <span class="badge bg-info">{{ selectedHeader.rows_imported }} record</span>
                                    </div>
                                </div>
                                <div class="text-muted small">
                                    Inserimento: {{ selectedHeader.run_start_date }} |
                                    Ultima modifica: {{ selectedHeader.run_end_date || '-' }}
                                </div>
                            </div>
                        </div>

                        <!-- Record Type Buttons -->
                        <div v-if="isHeaderEditable" class="mb-3">
                            <h5 class="mb-2">Nuovo Record:</h5>
                            <div class="d-flex flex-wrap gap-2">
                                <button v-for="btn in recordTypeButtons" :key="btn.code"
                                        class="btn btn-sm text-white fw-bold"
                                        :style="{ backgroundColor: btn.color }"
                                        @click="openCreateModal(btn.code)">
                                    {{ btn.label }}
                                </button>
                            </div>
                        </div>

                        <!-- Filter and Page Size -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <input type="text" class="form-control" placeholder="Filtra..." v-model="filterText">
                            </div>
                            <div class="col-md-6 text-end">
                                <label class="me-2">Righe per pagina:</label>
                                <select class="form-select d-inline-block w-auto" v-model.number="pageSize" @change="changePageSize(pageSize)">
                                    <option :value="20">20</option>
                                    <option :value="50">50</option>
                                    <option :value="100">100</option>
                                </select>
                            </div>
                        </div>

                        <!-- Records Table (split: fixed left + scrollable right) -->
                        <div ref="recordsWrapper" :style="{ width: recordsWrapperWidth + 'px', overflowX: 'auto' }">
                        <div class="records-split-container" ref="recordsSplitContainer">
                            <!-- Fixed left table: Azioni, ID, Tipo, Company, Policy, Fund Type, Fund Code, Fund Desc, Currency, Rate, Op. Date -->
                            <div class="records-fixed">
                                <table class="table table-sm table-hover records-table">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="fw-bold" style="width: 120px;">Azioni</th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_02')">ID <i class="bi ms-1" :class="getSortIcon('field_02')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_01')">Tipo <i class="bi ms-1" :class="getSortIcon('field_01')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_04')">Company <i class="bi ms-1" :class="getSortIcon('field_04')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_06')">Policy <i class="bi ms-1" :class="getSortIcon('field_06')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_11')">Fund Type <i class="bi ms-1" :class="getSortIcon('field_11')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_12')">Fund Code <i class="bi ms-1" :class="getSortIcon('field_12')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_13')">Fund Desc <i class="bi ms-1" :class="getSortIcon('field_13')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_14')">Currency <i class="bi ms-1" :class="getSortIcon('field_14')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_15')">Rate <i class="bi ms-1" :class="getSortIcon('field_15')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_49')">Op. Date <i class="bi ms-1" :class="getSortIcon('field_49')"></i></th>
                                            <th class="fw-bold" style="cursor:pointer" @click="toggleSort('field_50')">Eff. Date <i class="bi ms-1" :class="getSortIcon('field_50')"></i></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(record, idx) in paginatedRecords" :key="'left-' + record.id" :ref="'leftRow' + idx"
                                            :data-record-id="record.id"
                                            :style="{ borderLeft: '3px solid ' + getRecordSignColor(record.record_type) }">
                                            <td>
                                                <template v-if="isHeaderEditable">
                                                    <i class="bi bi-grip-vertical drag-handle me-1"></i>
                                                    <button class="btn btn-sm btn-link text-primary p-0" @click="openEditModal(record)">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-link text-info p-0" @click="openDuplicateModal(record)">
                                                        <i class="bi bi-files"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-link text-danger p-0" @click="deleteRecord(record)">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </template>
                                            </td>
                                            <td>{{ record.field_02 }}</td>
                                            <td>{{ record.field_01 }}</td>
                                            <td>{{ record.field_04 }}</td>
                                            <td>{{ record.field_06 }}</td>
                                            <td>{{ record.field_11 }}</td>
                                            <td>{{ record.field_12 }}</td>
                                            <td>{{ record.field_13 }}</td>
                                            <td>{{ record.field_14 }}</td>
                                            <td>{{ record.field_15 }}</td>
                                            <td>{{ record.field_49 }}</td>
                                            <td>{{ record.field_50 }}</td>
                                        </tr>
                                        <tr v-if="paginatedRecords.length === 0">
                                            <td colspan="12" class="text-center text-muted">
                                                Nessun record trovato
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Scrollable right table: Eff. Date + financial columns -->
                            <div class="records-scroll">
                                <table class="table table-sm table-hover records-table">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="fw-bold">Units</th>
                                            <th class="fw-bold">Quotation CUR</th>
                                            <th class="fw-bold">Quotation EUR</th>
                                            <th class="fw-bold">Asset CUR</th>
                                            <th class="fw-bold">Asset EUR</th>
                                            <th class="fw-bold">Gross CUR</th>
                                            <th class="fw-bold">Gross EUR</th>
                                            <th class="fw-bold">Invested/Net CUR</th>
                                            <th class="fw-bold">Invested/Net EUR</th>
                                            <th class="fw-bold">Entry Fee/Op Cost CUR</th>
                                            <th class="fw-bold">Entry Fee/Op Cost EUR</th>
                                            <th class="fw-bold">Entry Exp/Tax CUR</th>
                                            <th class="fw-bold">Entry Exp/Tax EUR</th>
                                            <th class="fw-bold">Duty CUR</th>
                                            <th class="fw-bold">Duty EUR</th>
                                            <th class="fw-bold">Bonus CUR</th>
                                            <th class="fw-bold">Bonus EUR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(record, idx) in paginatedRecords" :key="'right-' + record.id" :ref="'rightRow' + idx">
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_36') && !isFieldApplicable(record.record_type, 'field_37') }">{{ getFieldValue(record, 'field_36') || getFieldValue(record, 'field_37') }}</td>
                                            <td>{{ record.field_38 }}</td>
                                            <td>{{ record.field_39 }}</td>
                                            <td>{{ record.field_40 }}</td>
                                            <td>{{ record.field_41 }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_16') && !isFieldApplicable(record.record_type, 'field_24') }">{{ getFieldValue(record, 'field_16') || getFieldValue(record, 'field_24') }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_17') && !isFieldApplicable(record.record_type, 'field_25') }">{{ getFieldValue(record, 'field_17') || getFieldValue(record, 'field_25') }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_18') && !isFieldApplicable(record.record_type, 'field_26') }">{{ getFieldValue(record, 'field_18') || getFieldValue(record, 'field_26') }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_19') && !isFieldApplicable(record.record_type, 'field_27') }">{{ getFieldValue(record, 'field_19') || getFieldValue(record, 'field_27') }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_20') && !isFieldApplicable(record.record_type, 'field_28') }">{{ getFieldValue(record, 'field_20') || getFieldValue(record, 'field_28') }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_21') && !isFieldApplicable(record.record_type, 'field_29') }">{{ getFieldValue(record, 'field_21') || getFieldValue(record, 'field_29') }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_22') && !isFieldApplicable(record.record_type, 'field_30') }">{{ getFieldValue(record, 'field_22') || getFieldValue(record, 'field_30') }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_23') && !isFieldApplicable(record.record_type, 'field_31') }">{{ getFieldValue(record, 'field_23') || getFieldValue(record, 'field_31') }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_34') }">{{ record.field_34 }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_35') }">{{ record.field_35 }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_32') }">{{ record.field_32 }}</td>
                                            <td :class="{ 'cell-na': !isFieldApplicable(record.record_type, 'field_33') }">{{ record.field_33 }}</td>
                                        </tr>
                                        <tr v-if="paginatedRecords.length === 0">
                                            <td colspan="17" class="text-center text-muted">
                                                &nbsp;
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </div>

                        <!-- Pagination -->
                        <nav v-if="totalRecordPages > 1">
                            <ul class="pagination justify-content-center">
                                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                                    <a class="page-link" @click="changePage(currentPage - 1)">Precedente</a>
                                </li>
                                <li v-for="page in visiblePages" :key="page"
                                    class="page-item" :class="{ active: currentPage === page }">
                                    <a class="page-link" @click="changePage(page)">{{ page }}</a>
                                </li>
                                <li class="page-item" :class="{ disabled: currentPage === totalRecordPages }">
                                    <a class="page-link" @click="changePage(currentPage + 1)">Successivo</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <!-- RECORD MODAL -->
            <div v-if="showRecordModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header" :style="{ backgroundColor: getRecordSignColor(modalRecordType), color: 'white' }">
                            <h5 class="modal-title text-white">
                                <span v-if="modalMode === 'create'">Nuovo Record {{ modalRecordType }}</span>
                                <span v-else-if="modalMode === 'edit'">Modifica Record {{ modalRecordType }}</span>
                                <span v-else>Duplica Record {{ modalRecordType }}</span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white" @click="closeRecordModal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Type change in duplicate mode -->
                            <div v-if="modalMode === 'duplicate' && config" class="mb-3">
                                <label class="form-label fw-bold">Cambia Tipo Record:</label>
                                <div class="d-flex flex-wrap gap-2">
                                    <button v-for="rt in config.record_types" :key="rt.code"
                                            class="btn btn-sm"
                                            :class="rt.code === modalRecordType ? 'btn-primary' : 'btn-outline-primary'"
                                            @click="changeRecordTypeInDuplicate(rt.code)">
                                        {{ rt.label }}
                                    </button>
                                </div>
                            </div>

                            <!-- Form Fields -->
                            <div v-if="config && currentFormFields" class="row g-3">
                                <div v-for="field in currentFormFields" :key="field.field"
                                     class="col-md-6"
                                     :class="{ 'warning-field': warningFieldIds.has(field.field) }"
                                     v-show="field.input !== 'automatic'">
                                    <label class="form-label fw-bold text-uppercase">{{ field.name }}<i v-if="field.input === 'calculated'" class="bi bi-calculator ms-1 text-muted" style="cursor:pointer" @click="fillCalculatedField(field.field)" title="Calcola"></i></label>

                                    <!-- Autocomplete -->
                                    <div v-if="field.input === 'autocomplete'" class="position-relative">
                                        <input type="text" class="form-control"
                                               v-model="modalData[field.field]"
                                               :disabled="isFieldDisabled(field.name)"
                                               :style="isFieldDisabled(field.name) ? 'background-color: #e9ecef; color: #6c757d;' : ''"
                                               @input="handleAutocomplete(field.field, field.name, $event)"
                                               @focus="handleAutocompleteFocus(field.field, field.name)">
                                        <div v-if="autocompleteResults[field.field] && autocompleteResults[field.field].length > 0"
                                             class="autocomplete-dropdown">
                                            <div v-for="item in autocompleteResults[field.field]" :key="item.value"
                                                 class="autocomplete-item"
                                                 @click="selectAutocomplete(field.field, item)">
                                                {{ item.label }}
                                                <small v-if="item.description" class="text-muted d-block">{{ item.description }}</small>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Select -->
                                    <select v-else-if="field.type === 'select'" class="form-select"
                                            v-model="modalData[field.field]"
                                            :disabled="isFieldDisabled(field.name)"
                                            :style="isFieldDisabled(field.name) ? 'background-color: #e9ecef; color: #6c757d;' : ''">
                                        <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                                    </select>

                                    <!-- Float -->
                                    <input v-else-if="field.type === 'float'" type="number" step="any" class="form-control"
                                           v-model="modalData[field.field]">

                                    <!-- Date (DD/MM/YYYY via Flatpickr) -->
                                    <input v-else-if="field.type === 'date'" type="text" class="form-control"
                                           v-flatpickr="modalData[field.field]"
                                           :data-field="field.field">

                                    <!-- Calculated -->
                                    <input v-else-if="field.input === 'calculated'" type="text" class="form-control" readonly disabled
                                           style="background-color: #e9ecef; color: #6c757d;"
                                           :value="getCalculatedEur(field.field)">

                                    <!-- Auto Copy -->
                                    <input v-else-if="field.input === 'auto_copy'" type="text" class="form-control" readonly disabled
                                           style="background-color: #e9ecef; color: #6c757d;"
                                           :value="getAutoCopyValue(field.copy_from)">

                                    <!-- Text (default) -->
                                    <input v-else type="text" class="form-control"
                                           v-model="modalData[field.field]"
                                           :disabled="isFieldDisabled(field.name)"
                                           :style="isFieldDisabled(field.name) ? 'background-color: #e9ecef; color: #6c757d;' : ''">
                                </div>
                            </div>
                        </div>
                        <div v-if="validationWarnings.length > 0" class="alert alert-warning mb-0 rounded-0 border-start-0 border-end-0" style="position: sticky; bottom: 0; z-index: 10;">
                            <i class="bi bi-exclamation-triangle-fill me-1"></i><strong>Attenzione:</strong>
                            <ul class="mb-0 mt-1">
                                <li v-for="(warn, idx) in validationWarnings" :key="idx" v-html="warn.message"></li>
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="closeRecordModal">Annulla</button>
                            <button type="button" class="btn btn-primary" @click="confirmSaveRecord">Salva</button>
                        </div>

                        <!-- Conferma salvataggio -->
                        <div v-if="showSaveConfirm" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1060;">
                            <div class="modal-dialog modal-sm modal-dialog-centered">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title">Conferma Salvataggio</h5>
                                    </div>
                                    <div class="modal-body">
                                        <p>Procedere con il salvataggio del record?</p>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" @click="showSaveConfirm = false">Annulla</button>
                                        <button type="button" class="btn btn-primary" @click="saveRecord">Conferma</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HEADER MODAL -->
            <div v-if="showHeaderModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nuova Testata</h5>
                            <button type="button" class="btn-close" @click="showHeaderModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <label class="form-label">Descrizione</label>
                            <input type="text" class="form-control" v-model="headerModalData.filename">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showHeaderModal = false">Annulla</button>
                            <button type="button" class="btn btn-primary" @click="saveHeader">Salva</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DELETE CONFIRMATION MODAL -->
            <div v-if="showDeleteConfirm" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Conferma Cancellazione</h5>
                            <button type="button" class="btn-close" @click="showDeleteConfirm = false"></button>
                        </div>
                        <div class="modal-body">
                            <p>Sei sicuro di voler eliminare questo elemento?</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">Annulla</button>
                            <button type="button" class="btn btn-danger" @click="confirmDelete">Elimina</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// --- Esportazione funzioni pure per unit test ---
if (typeof module !== 'undefined' && module.exports) {
    /**
     * Calcolo EUR: valore_cur * exchange_rate
     */
    function calculateEur(valueCur, exchangeRate) {
        return ((parseFloat(valueCur) || 0) * (parseFloat(exchangeRate) || 1)).toFixed(2);
    }

    /**
     * Generazione colori HSL per bottoni tipo record
     */
    function generateColdShade(index, total) {
        const hue = 210;
        const saturation = 60 + (index * 10);
        const lightness = 45 + (index * 5);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function generateWarmShade(index, total) {
        const hue = 0;
        const saturation = 60 + (index * 10);
        const lightness = 45 + (index * 5);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function generateGreenShade(index, total) {
        return '#28a745';
    }

    /**
     * Validazione warning non-bloccante
     */
    function validateRecord(formType, data) {
        const warnings = [];
        const f = (val) => parseFloat(val) || 0;

        if (formType === 'valuation') {
            const product = f(data.field_36) * f(data.field_38);
            const assetValue = f(data.field_40);
            if (Math.abs(product - assetValue) > 0.01) {
                warnings.push('Il prodotto units_invested x unit_quotation_cur non corrisponde ad asset_value_cur');
            }
        } else if (formType === 'positive') {
            const diff = f(data.field_16) - f(data.field_18);
            const sum = f(data.field_20) + f(data.field_22);
            if (Math.abs(diff - sum) > 0.01) {
                warnings.push('La differenza gross_premium_cur - invested_premium_cur non corrisponde alla somma entry_fee_cur + entry_expenses_cur');
            }
            const product = f(data.field_36) * f(data.field_38);
            const invested = f(data.field_18);
            if (Math.abs(product - invested) > 0.01) {
                warnings.push('Il prodotto units_invested x unit_quotation_cur non corrisponde a invested_premium_cur');
            }
        } else if (formType === 'negative') {
            const diff = f(data.field_24) - f(data.field_26);
            const sum = f(data.field_28) + f(data.field_30) + f(data.field_34) - f(data.field_32);
            if (Math.abs(diff - sum) > 0.01) {
                warnings.push('La differenza gross_outgoing_cur - net_outgoing_payment_cur non corrisponde alla somma operation_cost_cur + tax_liq_cur + duty_liq_cur - bonus_liq_cur');
            }
            const product = f(data.field_37) * f(data.field_38);
            const gross = f(data.field_24);
            if (Math.abs(product - gross) > 0.01) {
                warnings.push('Il prodotto units_disinveste x unit_quotation_cur non corrisponde a gross_outgoing_cur');
            }
        }

        return warnings;
    }

    /**
     * Filtro client-side su tutte le colonne
     */
    function clientFilter(rows, searchText) {
        if (!searchText || searchText.trim() === '') return rows;
        const term = searchText.toLowerCase();
        return rows.filter(row =>
            Object.values(row).some(val =>
                val !== null && val !== undefined && String(val).toLowerCase().includes(term)
            )
        );
    }

    /**
     * Sort comparator
     */
    function clientSort(rows, column, direction) {
        if (!column || direction === 'nan') return rows;
        const sorted = [...rows].sort((a, b) => {
            const valA = a[column] ?? '';
            const valB = b[column] ?? '';
            if (valA < valB) return -1;
            if (valA > valB) return 1;
            return 0;
        });
        return direction === 'desc' ? sorted.reverse() : sorted;
    }

    module.exports = {
        calculateEur,
        generateColdShade,
        generateWarmShade,
        generateGreenShade,
        validateRecord,
        clientFilter,
        clientSort
    };
}

<?php declare(strict_types=1);

/**
 * This file is part of the Firstance BPER project.
 *
 * @copyright Firstance srl.
 */

namespace FirstAdvisory\FAWill\model\Settimanale;

use Exception;
use PDO;
use Throwable;
use TraitTryQuery;

class RecordManager
{
    use TraitTryQuery;

    private const IMPORT_MAIN_ID = 1120;

    /** @var array<string, int> */
    private array $recordTypeCache = [];
    public function __construct(PDO $conn)
    {
        $this->setConnect($conn);
    }
    /**
     * @param int $trackingId
     * @return list<array<string, string|null>>
     * @throws Throwable
     */
    public function getByTrackingId(int $trackingId): array
    {
        $sql = "SELECT
                    id,
                    row_id,
                    import_tracking_id,
                    import_record_id,
                    source_filename,
                    field_01,
                    field_02,
                    field_04,
                    field_06,
                    field_11,
                    field_12,
                    field_13,
                    field_14,
                    field_15,
                    field_16,
                    field_17,
                    field_18,
                    field_19,
                    field_20,
                    field_21,
                    field_22,
                    field_23,
                    field_24,
                    field_25,
                    field_26,
                    field_27,
                    field_28,
                    field_29,
                    field_30,
                    field_31,
                    field_32,
                    field_33,
                    field_34,
                    field_35,
                    field_36,
                    field_37,
                    field_38,
                    field_39,
                    field_40,
                    field_41,
                    field_49,
                    field_50
                FROM data.import_data_flat
                WHERE import_tracking_id = :tracking_id
                ORDER BY row_id";

        $stmt = $this->tryQuery($sql, [':tracking_id' => $trackingId]);
        $results = $this->getQueryRecords($stmt);

        if ($results === false) {
            return [];
        }

        // Add record_type field for convenience and format floats
        return array_map(function(array $row): array {
            $row['record_type'] = $row['field_01'];
            $this->formatFloatFields($row);
            return $row;
        }, $results);
    }

    /**
     * @param int $trackingId
     * @param string $recordType
     * @param array<string, string|null> $fields
     * @return array<string, string|null>
     * @throws Throwable
     */
    public function create(int $trackingId, string $recordType, array $fields): array
    {
        $this->assertHeaderEditable($trackingId);

        // Resolve record type to import_record_id
        $importRecordId = $this->resolveRecordTypeId($recordType);

        // Get header info
        $headerInfo = $this->getHeaderInfo($trackingId);
        if ($headerInfo === null) {
            throw new Exception('Testata non trovata');
        }

        // Calculate next row_id
        $nextRowId = $this->getNextRowId($trackingId);

        // Get form type for auto-copy logic
        $formType = $this->getFormType($recordType);

        // Prepare field values with calculations
        $preparedFields = $this->prepareFields($fields, $recordType, $formType, (string) $nextRowId);

        // Build INSERT query
        $sql = "INSERT INTO data.import_data_flat (
                    import_tracking_id,
                    row_id,
                    import_record_id,
                    source_filename,
                    field_01, field_02, field_04, field_06, field_11, field_12, field_13, field_14, field_15,
                    field_16, field_17, field_18, field_19, field_20, field_21, field_22, field_23,
                    field_24, field_25, field_26, field_27, field_28, field_29, field_30, field_31,
                    field_32, field_33, field_34, field_35, field_36, field_37, field_38, field_39,
                    field_40, field_41, field_49, field_50, field_51
                ) VALUES (
                    :import_tracking_id, :row_id, :import_record_id, :source_filename,
                    :field_01, :field_02, :field_04, :field_06, :field_11, :field_12, :field_13, :field_14, :field_15,
                    :field_16, :field_17, :field_18, :field_19, :field_20, :field_21, :field_22, :field_23,
                    :field_24, :field_25, :field_26, :field_27, :field_28, :field_29, :field_30, :field_31,
                    :field_32, :field_33, :field_34, :field_35, :field_36, :field_37, :field_38, :field_39,
                    :field_40, :field_41, :field_49, :field_50, ''
                )
                RETURNING id";

        $bindings = [
            ':import_tracking_id' => $trackingId,
            ':row_id' => $nextRowId,
            ':import_record_id' => $importRecordId,
            ':source_filename' => $headerInfo['filename']
        ];

        foreach ($preparedFields as $key => $value) {
            $bindings[':' . $key] = $value;
        }

        // Update header
        $sqlUpdateHeader = "UPDATE data.import_tracking
                            SET rows_imported = rows_imported + 1, run_end_date = now()
                            WHERE id = :tracking_id";

        // Execute in transaction
        $this->addQueryInStack($sql, $bindings);
        $this->addQueryInStack($sqlUpdateHeader, [':tracking_id' => $trackingId]);
        $this->tryQueryStack();

        // Retrieve created record
        return $this->getByRowId($trackingId, $nextRowId);
    }

    /**
     * @param int $id
     * @param string $recordType
     * @param array<string, string|null> $fields
     * @return array<string, string|null>
     * @throws Throwable
     */
    public function update(int $id, string $recordType, array $fields): array
    {
        // Get existing record to find tracking_id
        $existing = $this->getById($id);
        if ($existing === null) {
            throw new Exception('Record non trovato');
        }

        $trackingId = (int) $existing['import_tracking_id'];
        $this->assertHeaderEditable($trackingId);
        $formType = $this->getFormType($recordType);

        // Prepare fields (no row_id change)
        $preparedFields = $this->prepareFields($fields, $recordType, $formType, $existing['field_02']);

        // Build UPDATE query
        $sql = "UPDATE data.import_data_flat
                SET
                    field_04 = :field_04, field_06 = :field_06, field_11 = :field_11, field_12 = :field_12, field_13 = :field_13,
                    field_14 = :field_14, field_15 = :field_15, field_16 = :field_16, field_17 = :field_17, field_18 = :field_18,
                    field_19 = :field_19, field_20 = :field_20, field_21 = :field_21, field_22 = :field_22, field_23 = :field_23,
                    field_24 = :field_24, field_25 = :field_25, field_26 = :field_26, field_27 = :field_27, field_28 = :field_28,
                    field_29 = :field_29, field_30 = :field_30, field_31 = :field_31, field_32 = :field_32, field_33 = :field_33,
                    field_34 = :field_34, field_35 = :field_35, field_36 = :field_36, field_37 = :field_37, field_38 = :field_38,
                    field_39 = :field_39, field_40 = :field_40, field_41 = :field_41, field_49 = :field_49, field_50 = :field_50
                WHERE id = :id";

        $bindings = [':id' => $id];
        foreach ($preparedFields as $key => $value) {
            if (!in_array($key, ['field_01', 'field_02'], true)) {
                $bindings[':' . $key] = $value;
            }
        }

        // Update header
        $sqlUpdateHeader = "UPDATE data.import_tracking
                            SET run_end_date = now()
                            WHERE id = :tracking_id";

        // Execute in transaction
        $this->addQueryInStack($sql, $bindings);
        $this->addQueryInStack($sqlUpdateHeader, [':tracking_id' => $trackingId]);
        $this->tryQueryStack();

        // Retrieve updated record
        $updated = $this->getById($id);
        if ($updated === null) {
            throw new Exception('Failed to retrieve updated record');
        }

        return $updated;
    }

    /**
     * @param int $id
     * @param int $trackingId
     * @throws Throwable
     * @return void
     */
    public function delete(int $id, int $trackingId): void
    {
        $this->assertHeaderEditable($trackingId);

        // Delete record
        $sqlDelete = "DELETE FROM data.import_data_flat WHERE id = :id";

        // Recalculate row_id
        $sqlReindex = "UPDATE data.import_data_flat AS t
                       SET row_id = sub.new_row_id,
                           field_02 = sub.new_row_id::text
                       FROM (
                           SELECT id, ROW_NUMBER() OVER (ORDER BY row_id) AS new_row_id
                           FROM data.import_data_flat
                           WHERE import_tracking_id = :tracking_id
                       ) AS sub
                       WHERE t.id = sub.id
                         AND t.row_id != sub.new_row_id";

        // Update header
        $sqlUpdateHeader = "UPDATE data.import_tracking
                            SET rows_imported = rows_imported - 1, run_end_date = now()
                            WHERE id = :tracking_id";

        // Execute in transaction
        $this->addQueryInStack($sqlDelete, [':id' => $id]);
        $this->addQueryInStack($sqlReindex, [':tracking_id' => $trackingId]);
        $this->addQueryInStack($sqlUpdateHeader, [':tracking_id' => $trackingId]);
        $this->tryQueryStack();
    }

    /**
     * @param string $code
     * @throws Throwable
     * @return int
     */
    public function resolveRecordTypeId(string $code): int
    {
        if (empty($this->recordTypeCache)) {
            $sql = "SELECT id, code FROM data.import_record WHERE import_main_id = :import_main_id";
            $stmt = $this->tryQuery($sql, [':import_main_id' => self::IMPORT_MAIN_ID]);
            $results = $this->getQueryRecords($stmt);

            if ($results === false) {
                throw new Exception('Failed to load record types');
            }

            foreach ($results as $row) {
                $this->recordTypeCache[$row['code']] = (int) $row['id'];
            }
        }

        if (!isset($this->recordTypeCache[$code])) {
            throw new Exception('Tipo record non valido: ' . $code);
        }

        return $this->recordTypeCache[$code];
    }

    /**
     * @param string $code
     * @return string
     */
    public function getFormType(string $code): string
    {
        if ($code === 'ASV') {
            return 'valuation';
        }

        if (in_array($code, ['EMP', 'VAI', 'SWI'], true)) {
            return 'positive';
        }

        if (in_array($code, ['PSR', 'TSR', 'CLM', 'TRU', 'DMF', 'DDC', 'SWO'], true)) {
            return 'negative';
        }

        throw new Exception('Tipo form non riconosciuto per codice record: ' . $code);
    }

    /**
     * Verifica che la testata sia in stato modificabile (param_import_status_id = 1).
     *
     * @param int $trackingId
     * @throws Exception
     * @throws Throwable
     * @return void
     */
    private function assertHeaderEditable(int $trackingId): void
    {
        $sql = "SELECT param_import_status_id FROM data.import_tracking WHERE id = :id";
        $stmt = $this->tryQuery($sql, [':id' => $trackingId]);
        $result = $this->getQueryRecord($stmt);

        if ($result === false) {
            throw new Exception('Testata non trovata');
        }

        if ((int) $result['param_import_status_id'] !== 1) {
            throw new Exception('Operazione non consentita: la testata non è in stato modificabile');
        }
    }

    /**
     * @param int $trackingId
     * @throws Throwable
     * @return int
     */
    private function getNextRowId(int $trackingId): int
    {
        $sql = "SELECT COALESCE(MAX(row_id), 0) + 1 AS next_row_id
                FROM data.import_data_flat
                WHERE import_tracking_id = :tracking_id";

        $stmt = $this->tryQuery($sql, [':tracking_id' => $trackingId]);
        $result = $this->getQueryRecord($stmt);

        if ($result === false) {
            return 1;
        }

        return (int) $result['next_row_id'];
    }

    /**
     * @param int $trackingId
     * @throws Throwable
     * @return array|null
     */
    private function getHeaderInfo(int $trackingId): ?array
    {
        $sql = "SELECT filename FROM data.import_tracking WHERE id = :id";
        $stmt = $this->tryQuery($sql, [':id' => $trackingId]);
        $result = $this->getQueryRecord($stmt);

        return $result === false ? null : $result;
    }

    /**
     * @param int $id
     * @throws Throwable
     * @return array|null
     */
    private function getById(int $id): ?array
    {
        $sql = "SELECT * FROM data.import_data_flat WHERE id = :id";
        $stmt = $this->tryQuery($sql, [':id' => $id]);
        $result = $this->getQueryRecord($stmt);

        if ($result === false) {
            return null;
        }

        $result['record_type'] = $result['field_01'];
        $this->formatFloatFields($result);
        return $result;
    }

    /**
     * @param int $trackingId
     * @param int $rowId
     * @return array<string, string|null>
     * @throws Throwable
     */
    private function getByRowId(int $trackingId, int $rowId): array
    {
        $sql = "SELECT * FROM data.import_data_flat WHERE import_tracking_id = :tracking_id AND row_id = :row_id";
        $stmt = $this->tryQuery($sql, [':tracking_id' => $trackingId, ':row_id' => $rowId]);
        $result = $this->getQueryRecord($stmt);

        if ($result === false) {
            throw new Exception('Failed to retrieve created record');
        }

        $result['record_type'] = $result['field_01'];
        $this->formatFloatFields($result);
        return $result;
    }

    /**
     * Riordina i record di una testata secondo l'array di ID fornito.
     *
     * @param int $trackingId
     * @param list<int> $orderedIds ID record nell'ordine desiderato
     * @return void
     * @throws Throwable
     */
    public function reorder(int $trackingId, array $orderedIds): void
    {
        $this->assertHeaderEditable($trackingId);

        $pos = 1;
        foreach ($orderedIds as $id) {
            $sql = "UPDATE data.import_data_flat
                    SET row_id = :pos, field_02 = :pos_text
                    WHERE id = :id AND import_tracking_id = :tracking_id";
            $this->addQueryInStack($sql, [
                ':pos' => $pos,
                ':pos_text' => (string) $pos,
                ':id' => (int) $id,
                ':tracking_id' => $trackingId
            ]);
            $pos++;
        }

        $sqlUpdateHeader = "UPDATE data.import_tracking
                            SET run_end_date = now()
                            WHERE id = :tracking_id";
        $this->addQueryInStack($sqlUpdateHeader, [':tracking_id' => $trackingId]);

        $this->tryQueryStack();
    }

    /**
     * @param array<string, string|null> $fields
     * @param string $recordType
     * @param string $formType
     * @param string $rowId
     * @return array<string, string|null>
     */
    private function prepareFields(array $fields, string $recordType, string $formType, string $rowId): array
    {
        $prepared = [];

        // Automatic fields
        $prepared['field_01'] = $recordType;
        $prepared['field_02'] = $rowId;

        // Exchange rate (stringa per bcmul — precisione finanziaria)
        $exchangeRate = $fields['field_15'] ?? '1';

        // All fields (set to null if not provided)
        $allFields = [
            'field_04', 'field_06', 'field_11', 'field_12', 'field_13', 'field_14', 'field_15',
            'field_16', 'field_17', 'field_18', 'field_19', 'field_20', 'field_21', 'field_22', 'field_23',
            'field_24', 'field_25', 'field_26', 'field_27', 'field_28', 'field_29', 'field_30', 'field_31',
            'field_32', 'field_33', 'field_34', 'field_35', 'field_36', 'field_37', 'field_38', 'field_39',
            'field_40', 'field_41', 'field_49', 'field_50'
        ];

        foreach ($allFields as $field) {
            $prepared[$field] = $fields[$field] ?? null;
        }

        // Validazione formato date DD/MM/YYYY
        $dateFields = ['field_49', 'field_50'];
        foreach ($dateFields as $df) {
            if ($prepared[$df] !== null && $prepared[$df] !== '') {
                if (!preg_match('/^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/', $prepared[$df])) {
                    throw new Exception('Il campo ' . $df . ' deve essere nel formato DD/MM/YYYY, ricevuto: ' . $prepared[$df]);
                }
            }
        }

        // Calculate EUR fields (valore_eur = valore_cur * exchange_rate)
        // field_40 => field_41 is needed for valuation; for positive/negative auto_copy overwrites it after
        $eurFields = [
            'field_16' => 'field_17',
            'field_18' => 'field_19',
            'field_20' => 'field_21',
            'field_22' => 'field_23',
            'field_24' => 'field_25',
            'field_26' => 'field_27',
            'field_28' => 'field_29',
            'field_30' => 'field_31',
            'field_32' => 'field_33',
            'field_34' => 'field_35',
            'field_38' => 'field_39',
            'field_40' => 'field_41'
        ];

        foreach ($eurFields as $curField => $eurField) {
            if ($prepared[$curField] !== null) {
                $prepared[$eurField] = bcmul($prepared[$curField], $exchangeRate, 2);
            }
        }

        // Auto-copy fields based on form_type
        if ($formType === 'positive') {
            $prepared['field_40'] = $prepared['field_18'];
            $prepared['field_41'] = $prepared['field_19'];
        } elseif ($formType === 'negative') {
            $prepared['field_40'] = $prepared['field_24'];
            $prepared['field_41'] = $prepared['field_25'];
        }

        return $prepared;
    }

    /**
     * Formatta i campi float a 2 decimali.
     * Campi esclusi: field_01, field_02, field_04, field_06, field_11-14, field_49, field_50.
     *
     * @param array &$row
     * @return void
     */
    private function formatFloatFields(array &$row): void
    {
        $floatFields = [
            'field_15', 'field_16', 'field_17', 'field_18', 'field_19',
            'field_20', 'field_21', 'field_22', 'field_23', 'field_24',
            'field_25', 'field_26', 'field_27', 'field_28', 'field_29',
            'field_30', 'field_31', 'field_32', 'field_33', 'field_34',
            'field_35', 'field_36', 'field_37', 'field_38', 'field_39',
            'field_40', 'field_41'
        ];

        foreach ($floatFields as $field) {
            if (isset($row[$field]) && $row[$field] !== '') {
                $row[$field] = number_format((float) $row[$field], 2, '.', '');
            }
        }
    }
}
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

class HeaderManager
{
    use TraitTryQuery;

    private const IMPORT_MAIN_ID = 1120;
    private const DEFAULT_STATUS_ID = 1;

    public function __construct(PDO $conn)
    {
        $this->setConnect($conn);
    }
    /**
     * @return list<array<string, string|null>>
     * @throws Throwable
     */
    public function getList(): array
    {
        $sql = $this->baseSelectQuery()
             . " WHERE t.import_main_id = :import_main_id
                 ORDER BY t.run_start_date DESC
                 LIMIT 200";

        $stmt = $this->tryQuery($sql, [':import_main_id' => self::IMPORT_MAIN_ID]);
        $results = $this->getQueryRecords($stmt);

        return $results === false ? [] : $results;
    }

    /**
     * @param int $id
     * @return array<string, string|null>|null
     * @throws Throwable
     */
    public function getById(int $id): ?array
    {
        $sql = $this->baseSelectQuery() . " WHERE t.id = :id";

        $stmt = $this->tryQuery($sql, [':id' => $id]);
        $result = $this->getQueryRecord($stmt);

        return $result === false ? null : $result;
    }

    /**
     * @return string
     */
    private function baseSelectQuery(): string
    {
        return "SELECT
                    t.id,
                    TO_CHAR(t.run_start_date, 'YYYY-MM-DD HH24:MI') AS run_start_date,
                    TO_CHAR(t.run_end_date, 'YYYY-MM-DD HH24:MI') AS run_end_date,
                    t.filename,
                    ps.description_2 AS status_text,
                    t.param_import_status_id,
                    t.rows_imported,
                    t.rows_rejected,
                    t.rows_recovered,
                    TO_CHAR(t.last_check_start, 'YYYY-MM-DD HH24:MI') AS last_check_start,
                    TO_CHAR(t.last_check_end, 'YYYY-MM-DD HH24:MI') AS last_check_end,
                    TO_CHAR(t.last_post_start, 'YYYY-MM-DD HH24:MI') AS last_post_start,
                    TO_CHAR(t.last_post_end, 'YYYY-MM-DD HH24:MI') AS last_post_end
                FROM data.import_tracking t
                LEFT JOIN data.param_import_status ps
                    ON ps.id = t.param_import_status_id";
    }

    /**
     * @param string $filename
     * @return array<string, string|null>
     * @throws Throwable
     */
    public function create(string $filename): array
    {
        $sql = "INSERT INTO data.import_tracking (
                    import_main_id,
                    param_import_status_id,
                    rows_imported,
                    run_start_date,
                    run_end_date,
                    filename
                ) VALUES (
                    :import_main_id,
                    :param_import_status_id,
                    0,
                    now(),
                    NULL,
                    :filename
                )
                RETURNING id";

        $stmt = $this->tryQuery($sql, [
            ':import_main_id' => self::IMPORT_MAIN_ID,
            ':param_import_status_id' => self::DEFAULT_STATUS_ID,
            ':filename' => $filename
        ]);
        $result = $this->getQueryRecord($stmt);

        if ($result === false || !isset($result['id'])) {
            throw new Exception('Failed to create header');
        }

        $newHeader = $this->getById((int) $result['id']);
        if ($newHeader === null) {
            throw new Exception('Failed to retrieve created header');
        }

        return $newHeader;
    }

    /**
     * @param int $id
     * @param string $filename
     * @return array<string, string|null>
     * @throws Throwable
     */
    public function updateFilename(int $id, string $filename): array
    {
        $header = $this->getById($id);
        if ($header === null) {
            throw new Exception('Testata non trovata');
        }
        if ((int) $header['param_import_status_id'] !== 1) {
            throw new Exception('Operazione non consentita: la testata non è in stato modificabile');
        }

        $sql1 = "UPDATE data.import_tracking
                 SET filename = :filename
                 WHERE id = :id";

        $sql2 = "UPDATE data.import_data_flat
                 SET source_filename = :filename
                 WHERE import_tracking_id = :id";

        $bindings = [':id' => $id, ':filename' => $filename];

        $this->addQueryInStack($sql1, $bindings);
        $this->addQueryInStack($sql2, $bindings);
        $this->tryQueryStack();

        $updated = $this->getById($id);
        if ($updated === null) {
            throw new Exception('Header not found after update');
        }

        return $updated;
    }

    /**
     * Cambia lo stato della testata: 1 → 2, 2 → 1.
     * Solleva eccezione se lo stato corrente non è 1 né 2.
     *
     * @param int $id
     * @return array<string, string|null>
     * @throws Throwable
     */
    public function toggleStatus(int $id): array
    {
        $header = $this->getById($id);
        if ($header === null) {
            throw new Exception('Testata non trovata');
        }

        $currentStatus = (int) $header['param_import_status_id'];
        if ($currentStatus === 1) {
            $newStatus = 2;
        } elseif ($currentStatus === 2) {
            $newStatus = 1;
        } else {
            throw new Exception('Cambio stato non consentito: lo stato corrente (' . $currentStatus . ') non è modificabile');
        }

        $sql = "UPDATE data.import_tracking
                SET param_import_status_id = :new_status
                WHERE id = :id";

        $this->tryQuery($sql, [':new_status' => $newStatus, ':id' => $id]);

        $updated = $this->getById($id);
        if ($updated === null) {
            throw new Exception('Header not found after status update');
        }

        return $updated;
    }

    /**
     * @param int $id
     * @return void
     * @throws HeaderNotDeletableException
     * @throws Throwable
     */
    public function delete(int $id): void
    {
        $sqlCheck = "SELECT rows_imported, param_import_status_id
                     FROM data.import_tracking
                     WHERE id = :id";

        $stmt = $this->tryQuery($sqlCheck, [':id' => $id]);
        $header = $this->getQueryRecord($stmt);

        if ($header === false) {
            throw new Exception('Testata non trovata');
        }

        if ((int) $header['rows_imported'] !== 0 || (int) $header['param_import_status_id'] !== self::DEFAULT_STATUS_ID) {
            throw new HeaderNotDeletableException('La testata può essere cancellata solo se è vuota (rows_imported=0) e in stato Iniziale (param_import_status_id=1)');
        }

        $sqlDelete = "DELETE FROM data.import_tracking_warning WHERE import_tracking_id = :id";
        $this->addQueryInStack($sqlDelete, [':id' => $id]);

        $sqlDelete = "DELETE FROM data.import_data_reject_error WHERE import_tracking_id = :id";
        $this->addQueryInStack($sqlDelete, [':id' => $id]);

        $sqlDelete = "DELETE FROM data.import_data_reject WHERE import_tracking_id = :id";
        $this->addQueryInStack($sqlDelete, [':id' => $id]);

        $sqlDelete = "DELETE FROM data.import_tracking WHERE id = :id";
        $this->addQueryInStack($sqlDelete, [':id' => $id]);

        $this->tryQueryStack();
    }

}

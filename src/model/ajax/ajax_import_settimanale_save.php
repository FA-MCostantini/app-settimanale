<?php declare(strict_types=1);

/**
 * This file is part of the Firstance BPER project.
 *
 * @copyright Firstance srl.
 */

require_once __DIR__ . '/../../../lib/autoloader.php';

use FirstAdvisory\FAWill\model\Settimanale\AjaxResponseHelper;
use FirstAdvisory\FAWill\model\Settimanale\HeaderManager;
use FirstAdvisory\FAWill\model\Settimanale\HeaderNotDeletableException;
use FirstAdvisory\FAWill\model\Settimanale\RecordManager;

header('Content-Type: application/json');

try {
    // Database
    $database = new Database();
    $database->connect_db();

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data === null) {
        $response = AjaxResponseHelper::error('Corpo della richiesta non valido');
        http_response_code($response->getHttpCode());
        echo $response;
        exit;
    }

    $action = $data['action'] ?? '';

    switch ($action) {
        case 'header_save':
            $id = isset($data['id']) ? (int) $data['id'] : null;
            $filename = $data['filename'] ?? '';

            if (empty($filename)) {
                $response = AjaxResponseHelper::error('Il campo filename è obbligatorio');
                break;
            }

            $tracking = new HeaderManager($database->getConnection());

            if ($id === null) {
                $response = AjaxResponseHelper::success($tracking->create($filename));
            } else {
                $response = AjaxResponseHelper::success($tracking->updateFilename($id, $filename));
            }
            break;

        case 'record_save':
            $id = isset($data['id']) ? (int) $data['id'] : null;
            $importTrackingId = isset($data['import_tracking_id']) ? (int) $data['import_tracking_id'] : 0;
            $recordType = $data['record_type'] ?? '';
            $fields = $data['fields'] ?? [];

            if ($importTrackingId === 0) {
                $response = AjaxResponseHelper::error('Parametro import_tracking_id mancante o non valido');
                break;
            }

            if (empty($recordType)) {
                $response = AjaxResponseHelper::error('Parametro record_type mancante');
                break;
            }

            $mandatoryFields = ['field_04', 'field_06'];
            $missingFields = [];
            foreach ($mandatoryFields as $field) {
                if (empty($fields[$field])) {
                    $missingFields[] = $field;
                }
            }

            if (count($missingFields) > 0) {
                $response = AjaxResponseHelper::error('Campi obbligatori mancanti: ' . implode(', ', $missingFields));
                break;
            }

            $dataFlat = new RecordManager($database->getConnection());

            if ($id === null) {
                $response = AjaxResponseHelper::success($dataFlat->create($importTrackingId, $recordType, $fields));
            } else {
                $response = AjaxResponseHelper::success($dataFlat->update($id, $recordType, $fields));
            }
            break;

        case 'record_delete':
            $id = isset($data['id']) ? (int) $data['id'] : 0;
            $importTrackingId = isset($data['import_tracking_id']) ? (int) $data['import_tracking_id'] : 0;

            if ($id === 0 || $importTrackingId === 0) {
                $response = AjaxResponseHelper::error('Parametri id e import_tracking_id obbligatori');
                break;
            }

            $dataFlat = new RecordManager($database->getConnection());
            $dataFlat->delete($id, $importTrackingId);

            $tracking = new HeaderManager($database->getConnection());
            $updatedHeader = $tracking->getById($importTrackingId);

            $response = AjaxResponseHelper::success([
                'deleted_id' => $id,
                'updated_header' => $updatedHeader
            ]);
            break;

        case 'record_reorder':
            $importTrackingId = isset($data['import_tracking_id']) ? (int) $data['import_tracking_id'] : 0;
            $orderedIds = $data['ordered_ids'] ?? [];

            if ($importTrackingId === 0) {
                $response = AjaxResponseHelper::error('Parametro import_tracking_id mancante o non valido');
                break;
            }

            if (!is_array($orderedIds) || count($orderedIds) === 0) {
                $response = AjaxResponseHelper::error('Parametro ordered_ids mancante o vuoto');
                break;
            }

            // Validate all IDs are integers
            $sanitizedIds = array_map('intval', $orderedIds);

            $dataFlat = new RecordManager($database->getConnection());
            $dataFlat->reorder($importTrackingId, $sanitizedIds);

            $response = AjaxResponseHelper::success(['reordered' => true]);
            break;

        case 'header_toggle_status':
            $id = isset($data['id']) ? (int) $data['id'] : 0;

            if ($id === 0) {
                $response = AjaxResponseHelper::error('Parametro id mancante o non valido');
                break;
            }

            $tracking = new HeaderManager($database->getConnection());
            $response = AjaxResponseHelper::success($tracking->toggleStatus($id));
            break;

        case 'header_delete':
            $id = isset($data['id']) ? (int) $data['id'] : 0;

            if ($id === 0) {
                $response = AjaxResponseHelper::error('Parametro id mancante o non valido');
                break;
            }

            $tracking = new HeaderManager($database->getConnection());

            try {
                $tracking->delete($id);
                $response = AjaxResponseHelper::success(['deleted_id' => $id]);
            } catch (HeaderNotDeletableException $e) {
                $response = AjaxResponseHelper::error($e->getMessage(), $e, 409);
            }
            break;

        default:
            $response = AjaxResponseHelper::error('Azione non valida');
    }
} catch (Throwable $e) {
    $response = AjaxResponseHelper::error('Errore durante l\'elaborazione della richiesta', $e, 500);
}

http_response_code($response->getHttpCode());
echo $response;
exit;

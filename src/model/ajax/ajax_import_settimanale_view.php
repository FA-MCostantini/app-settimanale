<?php declare(strict_types=1);

/**
 * This file is part of the Firstance BPER project.
 *
 * @copyright Firstance srl.
 */

require_once __DIR__ . '/../../../lib/autoloader.php';

use FirstAdvisory\FAWill\model\Settimanale\AjaxResponseHelper;
use FirstAdvisory\FAWill\model\Settimanale\BaseConfig;
use FirstAdvisory\FAWill\model\Settimanale\HeaderManager;
use FirstAdvisory\FAWill\model\Settimanale\RecordManager;
use FirstAdvisory\FAWill\model\Settimanale\FormHelper;

header('Content-Type: application/json');

try {
    // Database
    $database = new Database();
    $database->connect_db();

    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'config':
            $response = AjaxResponseHelper::success(BaseConfig::get());
            break;

        case 'headers':
            $tracking = new HeaderManager($database->getConnection());
            $response = AjaxResponseHelper::success($tracking->getList());
            break;

        case 'records':
            $trackingId = isset($_GET['tracking_id']) ? (int) $_GET['tracking_id'] : 0;
            if ($trackingId === 0) {
                $response = AjaxResponseHelper::error('Parametro tracking_id mancante o non valido');
                break;
            }

            $dataFlat = new RecordManager($database->getConnection());
            $response = AjaxResponseHelper::success($dataFlat->getByTrackingId($trackingId));
            break;

        case 'autocomplete':
            $field = $_GET['field'] ?? '';
            $query = $_GET['query'] ?? '';

            if (empty($field)) {
                $response = AjaxResponseHelper::error('Parametro field mancante');
                break;
            }

            $context = [];
            if (!empty($_GET['company'])) {
                $context['company'] = $_GET['company'];
            }
            if (!empty($_GET['policy_number'])) {
                $context['policy_number'] = $_GET['policy_number'];
            }

            // Per fund_code con contesto, accetta query vuota
            if (strlen($query) < 2 && $field !== 'fund_code') {
                $response = AjaxResponseHelper::error('La query deve contenere almeno 2 caratteri');
                break;
            }

            $autocomplete = new FormHelper($database->getConnection());
            $response = AjaxResponseHelper::success($autocomplete->search($field, $query, $context));
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

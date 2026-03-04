<?php declare(strict_types=1);

/**
 * Autoloader del progetto Settimanale.
 *
 * Carica le variabili d'ambiente da .env, definisce le costanti globali,
 * e include tutte le classi del progetto in ordine di dipendenza.
 *
 * Uso: require_once __DIR__ . '/../lib/autoloader.php';  (da src/)
 *      require_once __DIR__ . '/autoloader.php';          (da lib/)
 */

// Evita inclusioni multiple
if (defined('SETTIMANALE_AUTOLOADER_LOADED')) {
    return;
}
define('SETTIMANALE_AUTOLOADER_LOADED', true);

// --- Caricamento .env ---

$envFile = __DIR__ . '/../.env';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        // Salta commenti
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        if (strpos($line, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        // Rimuovi virgolette se presenti
        if (strlen($value) >= 2 && $value[0] === '"' && $value[strlen($value) - 1] === '"') {
            $value = substr($value, 1, -1);
        }

        putenv("$key=$value");
    }
}

// --- Definizione costanti globali da environment ---

if (!defined('ENV_DB_HOST')) {
    define('ENV_DB_HOST', getenv('ENV_DB_HOST') ?: 'localhost');
}
if (!defined('ENV_DB_DATABABE')) {
    define('ENV_DB_DATABABE', getenv('ENV_DB_DATABABE') ?: 'fa_will');
}
if (!defined('ENV_DB_PORT')) {
    define('ENV_DB_PORT', getenv('ENV_DB_PORT') ?: '5432');
}
if (!defined('ENV_DB_USER')) {
    define('ENV_DB_USER', getenv('ENV_DB_USER') ?: 'fa_user');
}
if (!defined('ENV_DB_PASSWORD')) {
    define('ENV_DB_PASSWORD', getenv('ENV_DB_PASSWORD') ?: 'fa_password');
}
if (!defined('ENV_IS_DEV')) {
    $devValue = getenv('ENV_IS_DEV');
    define('ENV_IS_DEV', $devValue === 'true' || $devValue === '1');
}

// --- Include classi in ordine di dipendenza ---

// Livello 0: infrastruttura DB
require_once __DIR__ . '/cls_db.php';
require_once __DIR__ . '/TraitTryQuery.php';

// Livello 1: model
require_once __DIR__ . '/../src/model/Settimanale/AjaxResponseHelper.php';
require_once __DIR__ . '/../src/model/Settimanale/BaseConfig.php';
require_once __DIR__ . '/../src/model/Settimanale/FormHelper.php';
require_once __DIR__ . '/../src/model/Settimanale/HeaderNotDeletableException.php';
require_once __DIR__ . '/../src/model/Settimanale/HeaderManager.php';
require_once __DIR__ . '/../src/model/Settimanale/RecordManager.php';

// Livello 2: controller
require_once __DIR__ . '/../src/controller/Settimanale/ctl_import_settimanale.php';

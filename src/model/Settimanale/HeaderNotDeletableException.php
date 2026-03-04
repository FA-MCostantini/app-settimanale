<?php declare(strict_types=1);

/**
 * This file is part of the Firstance BPER project.
 *
 * @copyright Firstance srl.
 */

namespace FirstAdvisory\FAWill\model\Settimanale;

use Exception;

/**
 * Lanciata quando si tenta di cancellare una testata che non soddisfa
 * le precondizioni (rows_imported=0 e param_import_status_id=1).
 */
class HeaderNotDeletableException extends Exception
{
}

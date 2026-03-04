<?php declare(strict_types=1);

/**
 * This file is part of the Firstance BPER project.
 *
 * @copyright Firstance srl.
 */

namespace FirstAdvisory\FAWill\model\Settimanale;

use Exception;
use FirstAdvisory\FACode\Infrastructure\Persistence\FileSystem\FileSystem;
use League\Flysystem\FilesystemException;

class BaseConfig
{
    /** @var array<string, mixed>|null */
    private static ?array $jsonConfig = null;
    /**
     * @throws FilesystemException|Exception
     *
     * @return array<string, mixed>
     */
    public static function get(): array
    {
        if (null === self::$jsonConfig) {
            $fs               = FileSystem::createFromConfig(APP_FOLDERS['PATH_LOCAL']);
            $content = $fs->read(SETTIMANALE_CONFIG);

            self::$jsonConfig = json_decode($content, true);
            if (!is_array(self::$jsonConfig)) {
                self::$jsonConfig = null;
                throw new Exception('Invalid JSON in config file: ' . json_last_error_msg());
            }
            self::$jsonConfig['is_dev'] = ENV_IS_DEV;
        }

        return self::$jsonConfig;
    }
}

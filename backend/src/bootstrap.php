<?php

declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file = __DIR__ . '/' . str_replace('\\', '/', $relativeClass) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

App\Core\Env::load(dirname(__DIR__) . '/.env');

ini_set('display_errors', App\Core\Env::bool('APP_DEBUG', false) ? '1' : '0');
error_reporting(E_ALL);


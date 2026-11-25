<?php

declare(strict_types=1);

namespace App\Core;

use Throwable;

final class Application
{
    public function run(): never
    {
        SecurityHeaders::apply();

        try {
            $this->guardRequest();
            $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
            $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

            if ($method === 'OPTIONS') {
                http_response_code(204);
                exit;
            }

            if ($method === 'GET' && $path === '/api/health') {
                JsonResponse::send(['data' => ['status' => 'ok', 'service' => 'IS Coach API']]);
            }

            JsonResponse::error('Recurso não encontrado.', 404, 'NOT_FOUND');
        } catch (Throwable $exception) {
            error_log(sprintf('[%s] %s', date(DATE_ATOM), $exception->getMessage()));
            JsonResponse::error('Ocorreu um erro interno.', 500, 'INTERNAL_ERROR');
        }
    }

    private function guardRequest(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigin = Env::get('FRONTEND_ORIGIN', 'http://127.0.0.1:5173');

        if ($origin !== '') {
            if (!hash_equals((string) $allowedOrigin, $origin)) {
                JsonResponse::error('Origem não permitida.', 403, 'ORIGIN_NOT_ALLOWED');
            }
            header("Access-Control-Allow-Origin: {$allowedOrigin}");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Vary: Origin');
        }

        $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        $maxBytes = (int) Env::get('MAX_REQUEST_BYTES', '1048576');
        if ($contentLength > $maxBytes) {
            JsonResponse::error('Requisição muito grande.', 413, 'PAYLOAD_TOO_LARGE');
        }
    }
}


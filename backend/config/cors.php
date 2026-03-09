<?php

return [

    'paths' => ['api/*', 'webhooks/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Correlation-ID'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];

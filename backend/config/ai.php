<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Service Configuration (Google AI Studio / Gemini)
    |--------------------------------------------------------------------------
    */

    'provider' => env('AI_PROVIDER', 'google'),

    'google' => [
        'api_key' => env('GOOGLE_AI_API_KEY'),
        'model' => env('GOOGLE_AI_MODEL', 'gemini-2.0-flash'),
        'max_tokens' => env('GOOGLE_AI_MAX_TOKENS', 500),
        'temperature' => env('GOOGLE_AI_TEMPERATURE', 0.7),
        'api_url' => env('GOOGLE_AI_API_URL', 'https://generativelanguage.googleapis.com/v1beta'),
    ],

    'recommendations' => [
        'max_items' => env('AI_MAX_RECOMMENDATIONS', 5),
        'cache_ttl' => env('AI_CACHE_TTL', 3600), // 1 hour
    ],

    'timeout' => env('AI_TIMEOUT', 30),

];

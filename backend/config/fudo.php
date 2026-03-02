<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Fudo POS Integration
    |--------------------------------------------------------------------------
    |
    | Configuration for Fudo POS API integration.
    | OAuth2 credentials and API endpoints.
    |
    */

    'client_id' => env('FUDO_CLIENT_ID', 'MDAwMDI6MDYzOTU2'),
    'client_secret' => env('FUDO_CLIENT_SECRET', 'xH6rdcTALbNBv3qBoAUyhYFz'),

    'api_url' => env('FUDO_API_URL', 'https://api.fu.do'),
    'auth_url' => env('FUDO_AUTH_URL', 'https://api.fu.do/oauth/token'),
    'admin_url' => env('FUDO_ADMIN_URL', 'https://app-v2.fu.do/app/#!/admin/external_apps/2'),

    'webhook_secret' => env('FUDO_WEBHOOK_SECRET'),
    'webhook_events' => ['ORDER-CONFIRMED'],

    'sound_enabled' => env('FUDO_SOUND_ENABLED', true),
    'print_control' => env('FUDO_PRINT_CONTROL', true),

    'timeout' => env('FUDO_TIMEOUT', 30),

];

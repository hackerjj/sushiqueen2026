<?php

return [

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Business API Configuration
    |--------------------------------------------------------------------------
    */

    'api_url' => env('WHATSAPP_API_URL', 'https://graph.facebook.com/v18.0'),
    'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
    'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
    'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
    'verify_token' => env('WHATSAPP_VERIFY_TOKEN'),
    'webhook_secret' => env('WHATSAPP_WEBHOOK_SECRET'),

    'timeout' => env('WHATSAPP_TIMEOUT', 30),

];

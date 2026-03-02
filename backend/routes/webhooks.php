<?php

use App\Http\Controllers\WebhookController;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Webhook Routes - Sushi Queen
|--------------------------------------------------------------------------
|
| External service webhook endpoints.
| These routes bypass CSRF and standard auth middleware.
|
| Fudo webhook URL: https://yourdomain.com/webhooks/fudo/order-confirmed
| WhatsApp webhook URL: https://yourdomain.com/webhooks/whatsapp
|
*/

// Fudo POS Webhooks
Route::post('/fudo/order-confirmed', [WebhookController::class, 'fudoOrderConfirmed']);

// ─── WhatsApp Business Webhooks ──────────────────────────────────

// GET: Webhook verification challenge from Meta
Route::get('/whatsapp', function (Request $request) {
    $mode = $request->query('hub_mode');
    $token = $request->query('hub_verify_token');
    $challenge = $request->query('hub_challenge');

    if (!$mode || !$token || !$challenge) {
        return response()->json(['error' => 'Missing verification parameters'], 400);
    }

    try {
        $whatsapp = new WhatsAppService();
        $result = $whatsapp->verifyWebhook($mode, $token, $challenge);

        if ($result !== null) {
            Log::info('WhatsApp webhook verified successfully');
            return response($result, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('WhatsApp webhook verification failed', [
            'mode' => $mode,
            'token_match' => false,
        ]);
        return response()->json(['error' => 'Verification failed'], 403);
    } catch (\Throwable $e) {
        Log::error('WhatsApp webhook verification error', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Internal error'], 500);
    }
});

// POST: Incoming messages from WhatsApp
Route::post('/whatsapp', function (Request $request) {
    $payload = $request->all();

    // Quick validation — Meta sends a specific structure
    if (empty($payload['entry'])) {
        Log::debug('WhatsApp webhook: No entry in payload (possibly a status update)', [
            'object' => $payload['object'] ?? 'unknown',
        ]);
        return response()->json(['status' => 'ok']);
    }

    try {
        $whatsapp = new WhatsAppService();
        $result = $whatsapp->processIncomingMessage($payload);

        Log::info('WhatsApp webhook processed', ['result' => $result]);

        return response()->json($result);
    } catch (\Throwable $e) {
        Log::error('WhatsApp webhook processing error', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        // Always return 200 to Meta to avoid retries
        return response()->json(['status' => 'error', 'message' => 'Processing failed'], 200);
    }
});

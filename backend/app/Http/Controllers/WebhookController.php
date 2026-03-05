<?php

namespace App\Http\Controllers;

use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

/**
 * WebhookController - Handles incoming webhooks from WhatsApp Business.
 * Fudo webhooks have been removed - MealLi POS handles orders internally.
 */
class WebhookController extends Controller
{
    /**
     * Handle WhatsApp webhook verification (GET).
     */
    public function whatsappVerify(Request $request): mixed
    {
        $verifyToken = config('whatsapp.verify_token');
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            return response($challenge, 200);
        }

        return response()->json(['error' => 'Forbidden'], 403);
    }

    /**
     * Handle incoming WhatsApp messages (POST).
     */
    public function whatsappIncoming(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('WebhookController: WhatsApp webhook received', [
            'payload' => $payload,
        ]);

        try {
            $whatsapp = new WhatsAppService();
            $whatsapp->handleIncomingWebhook($payload);
        } catch (\Throwable $e) {
            Log::error('WebhookController: WhatsApp webhook processing failed', [
                'error' => $e->getMessage(),
            ]);
        }

        // Always return 200 to WhatsApp
        return response()->json(['status' => 'received'], 200);
    }
}

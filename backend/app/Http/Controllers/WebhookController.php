<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

/**
 * WebhookController - Handles incoming webhooks from external services.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  FUDO WEBHOOK CONFIGURATION                                        │
 * │                                                                     │
 * │  Configure the webhook URL in Fudo admin panel:                     │
 * │  https://app-v2.fu.do/app/#!/admin/external_apps/2                 │
 * │                                                                     │
 * │  Webhook URL:                                                       │
 * │  https://yourdomain.com/webhooks/fudo/order-confirmed               │
 * │                                                                     │
 * │  Event: ORDER-CONFIRMED                                             │
 * │                                                                     │
 * │  Set the FUDO_WEBHOOK_SECRET env variable to match the secret       │
 * │  configured in Fudo admin. The controller verifies this via the     │
 * │  X-Fudo-Secret header on every incoming request.                    │
 * │                                                                     │
 * │  Steps:                                                             │
 * │  1. Go to Fudo admin → External Apps → App #2                      │
 * │  2. Set Webhook URL to your production domain + path above          │
 * │  3. Set a webhook secret and copy it to your .env                   │
 * │  4. Enable the ORDER-CONFIRMED event                                │
 * │  5. Save and test with a sample order                               │
 * └─────────────────────────────────────────────────────────────────────┘
 */
class WebhookController extends Controller
{
    /**
     * Handle Fudo ORDER-CONFIRMED webhook.
     *
     * Expected payload from Fudo:
     * {
     *   "event": "ORDER-CONFIRMED",
     *   "order_id": "fudo_order_123",
     *   "timestamp": "2024-01-15T10:30:00Z",
     *   "data": { ... }
     * }
     */
    public function fudoOrderConfirmed(Request $request): JsonResponse
    {
        // Step 1: Verify webhook signature/secret
        if (!$this->verifyFudoWebhook($request)) {
            Log::warning('WebhookController: Fudo webhook unauthorized', [
                'ip' => $request->ip(),
                'headers' => $request->headers->all(),
            ]);
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $payload = $request->all();

        Log::info('WebhookController: Fudo ORDER-CONFIRMED received', [
            'payload' => $payload,
        ]);

        // Step 2: Validate event type
        $event = $payload['event'] ?? null;
        if ($event && $event !== 'ORDER-CONFIRMED') {
            Log::warning('WebhookController: Unexpected Fudo event', ['event' => $event]);
            return response()->json(['message' => 'Event ignored', 'event' => $event], 200);
        }

        // Step 3: Find the order by fudo_order_id
        $fudoOrderId = $payload['order_id'] ?? $payload['data']['order_id'] ?? null;

        if (!$fudoOrderId) {
            Log::warning('WebhookController: Fudo webhook missing order_id', ['payload' => $payload]);
            return response()->json(['error' => 'Missing order_id'], 422);
        }

        $order = Order::where('fudo_order_id', (string) $fudoOrderId)->first();

        if (!$order) {
            Log::warning('WebhookController: Order not found for fudo_order_id', [
                'fudo_order_id' => $fudoOrderId,
            ]);
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Step 4: Update order status to confirmed
        $order->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        Log::info('WebhookController: Order confirmed via Fudo webhook', [
            'order_id' => (string) $order->_id,
            'fudo_order_id' => $fudoOrderId,
            'confirmed_at' => $order->confirmed_at,
        ]);

        return response()->json([
            'message' => 'Order confirmed',
            'order_id' => (string) $order->_id,
            'fudo_order_id' => $fudoOrderId,
        ]);
    }

    /**
     * Verify the Fudo webhook request using the shared secret.
     * Checks the X-Fudo-Secret header against the configured webhook_secret.
     */
    private function verifyFudoWebhook(Request $request): bool
    {
        $secret = config('fudo.webhook_secret');

        // If no secret is configured, allow all requests (dev mode)
        if (empty($secret)) {
            Log::warning('WebhookController: FUDO_WEBHOOK_SECRET not set, skipping verification');
            return true;
        }

        $headerSecret = $request->header('X-Fudo-Secret');

        return hash_equals($secret, $headerSecret ?? '');
    }
}

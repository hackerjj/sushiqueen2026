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
     * Handle all Fudo webhook events.
     *
     * Supported events:
     * - ORDER-CONFIRMED: Order accepted by restaurant
     * - ORDER-REJECTED: Order rejected by restaurant
     * - ORDER-READY-TO-DELIVER: Order ready for pickup/delivery
     * - ORDER-DELIVERY-SENT: Order dispatched for delivery
     * - ORDER-CLOSED: Order completed/closed
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
        return $this->handleFudoWebhook($request);
    }

    /**
     * Generic handler for all Fudo webhook events.
     */
    private function handleFudoWebhook(Request $request): JsonResponse
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
        $event = $payload['event'] ?? 'UNKNOWN';

        Log::info('WebhookController: Fudo webhook received', [
            'event' => $event,
            'payload' => $payload,
        ]);

        // Step 2: Extract order ID
        $fudoOrderId = $payload['order_id'] ?? $payload['data']['order_id'] ?? null;

        if (!$fudoOrderId) {
            Log::warning('WebhookController: Fudo webhook missing order_id', ['payload' => $payload]);
            return response()->json(['error' => 'Missing order_id'], 422);
        }

        // Step 3: Find the order
        $order = Order::where('fudo_order_id', (string) $fudoOrderId)->first();

        if (!$order) {
            Log::warning('WebhookController: Order not found for fudo_order_id', [
                'fudo_order_id' => $fudoOrderId,
                'event' => $event,
            ]);
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Step 4: Update order status based on event
        $statusMap = [
            'ORDER-CONFIRMED' => 'confirmed',
            'ORDER-REJECTED' => 'cancelled',
            'ORDER-READY-TO-DELIVER' => 'ready',
            'ORDER-DELIVERY-SENT' => 'delivering',
            'ORDER-CLOSED' => 'delivered',
        ];

        $newStatus = $statusMap[$event] ?? null;

        if ($newStatus) {
            $updateData = ['status' => $newStatus];

            // Set confirmed_at timestamp for ORDER-CONFIRMED
            if ($event === 'ORDER-CONFIRMED') {
                $updateData['confirmed_at'] = now();
            }

            $order->update($updateData);

            Log::info('WebhookController: Order status updated via Fudo webhook', [
                'order_id' => (string) $order->_id,
                'fudo_order_id' => $fudoOrderId,
                'event' => $event,
                'new_status' => $newStatus,
            ]);

            return response()->json([
                'message' => 'Order updated',
                'order_id' => (string) $order->_id,
                'fudo_order_id' => $fudoOrderId,
                'event' => $event,
                'status' => $newStatus,
            ]);
        }

        // Unknown event, log and return success
        Log::warning('WebhookController: Unknown Fudo event', ['event' => $event]);
        return response()->json(['message' => 'Event received but not handled', 'event' => $event], 200);
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

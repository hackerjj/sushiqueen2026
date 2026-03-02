<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Order;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FudoService
{
    private Client $client;
    private string $apiUrl;
    private string $authUrl;
    private string $clientId;
    private string $clientSecret;
    private int $timeout;

    private const CACHE_TOKEN_KEY = 'fudo_access_token';
    private const CACHE_TOKEN_TTL = 3500; // ~58 min (tokens usually last 1h)

    public function __construct()
    {
        $this->apiUrl = config('fudo.api_url');
        $this->authUrl = config('fudo.auth_url');
        $this->clientId = config('fudo.client_id');
        $this->clientSecret = config('fudo.client_secret');
        $this->timeout = config('fudo.timeout', 30);

        $this->client = new Client([
            'base_uri' => $this->apiUrl,
            'timeout' => $this->timeout,
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    // ─── Authentication ──────────────────────────────────────────────

    /**
     * Get a valid access token, using Redis cache when available.
     * Performs OAuth2 client_credentials grant against Fudo auth endpoint.
     */
    public function authenticate(): string
    {
        $cached = Cache::store('redis')->get(self::CACHE_TOKEN_KEY);

        if ($cached) {
            return $cached;
        }

        return $this->refreshToken();
    }

    /**
     * Request a fresh access token from Fudo OAuth2 endpoint.
     */
    private function refreshToken(): string
    {
        try {
            $response = $this->client->post($this->authUrl, [
                'form_params' => [
                    'grant_type' => 'client_credentials',
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                ],
                'headers' => [
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (empty($data['access_token'])) {
                Log::error('FudoService: OAuth response missing access_token', ['response' => $data]);
                throw new \RuntimeException('Fudo OAuth: no access_token in response');
            }

            $token = $data['access_token'];
            $ttl = $data['expires_in'] ?? self::CACHE_TOKEN_TTL;

            // Cache with a small buffer before actual expiry
            Cache::store('redis')->put(self::CACHE_TOKEN_KEY, $token, max($ttl - 60, 60));

            Log::info('FudoService: Access token refreshed successfully');

            return $token;
        } catch (GuzzleException $e) {
            Log::error('FudoService: OAuth authentication failed', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw new \RuntimeException('Fudo authentication failed: ' . $e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * Build authorized headers for API requests.
     */
    private function authHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->authenticate(),
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    // ─── Menu ────────────────────────────────────────────────────────

    /**
     * Fetch menu items from Fudo POS API.
     *
     * @return array Raw menu data from Fudo
     */
    public function getMenu(): array
    {
        try {
            $response = $this->client->get('/api/v1/menu/items', [
                'headers' => $this->authHeaders(),
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            Log::info('FudoService: Menu fetched', ['items_count' => count($data['data'] ?? $data)]);

            return $data['data'] ?? $data;
        } catch (GuzzleException $e) {
            Log::error('FudoService: Failed to fetch menu', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw new \RuntimeException('Failed to fetch Fudo menu: ' . $e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * Sync Fudo menu items to local MenuItem model.
     * - Updates existing items (matched by fudo_id)
     * - Creates new items
     * - Marks removed items as unavailable
     *
     * @return array Summary of sync operation
     */
    public function syncMenuFromFudo(): array
    {
        $fudoItems = $this->getMenu();

        $created = 0;
        $updated = 0;
        $deactivated = 0;

        $fudoIds = [];

        foreach ($fudoItems as $fudoItem) {
            $fudoId = (string) ($fudoItem['id'] ?? $fudoItem['_id'] ?? null);

            if (!$fudoId) {
                Log::warning('FudoService: Menu item missing ID, skipping', ['item' => $fudoItem]);
                continue;
            }

            $fudoIds[] = $fudoId;

            $mapped = [
                'fudo_id' => $fudoId,
                'name' => $fudoItem['name'] ?? $fudoItem['title'] ?? 'Sin nombre',
                'description' => $fudoItem['description'] ?? '',
                'price' => (float) ($fudoItem['price'] ?? $fudoItem['unit_price'] ?? 0),
                'category' => $fudoItem['category'] ?? $fudoItem['category_name'] ?? 'general',
                'image_url' => $fudoItem['image'] ?? $fudoItem['image_url'] ?? '',
                'modifiers' => $fudoItem['modifiers'] ?? $fudoItem['options'] ?? [],
                'available' => (bool) ($fudoItem['available'] ?? $fudoItem['active'] ?? true),
                'sort_order' => (int) ($fudoItem['sort_order'] ?? $fudoItem['position'] ?? 0),
            ];

            $existing = MenuItem::where('fudo_id', $fudoId)->first();

            if ($existing) {
                $existing->update($mapped);
                $updated++;
            } else {
                MenuItem::create($mapped);
                $created++;
            }
        }

        // Mark items no longer in Fudo as unavailable
        if (!empty($fudoIds)) {
            $deactivated = MenuItem::whereNotNull('fudo_id')
                ->whereNotIn('fudo_id', $fudoIds)
                ->where('available', true)
                ->update(['available' => false]);
        }

        $summary = [
            'created' => $created,
            'updated' => $updated,
            'deactivated' => $deactivated,
            'total_from_fudo' => count($fudoItems),
        ];

        Log::info('FudoService: Menu sync completed', $summary);

        return $summary;
    }

    // ─── Orders ──────────────────────────────────────────────────────

    /**
     * Send an order to Fudo POS.
     *
     * @param array $orderData Fudo-formatted order payload
     * @return array Fudo API response with order ID
     */
    public function createOrder(array $orderData): array
    {
        try {
            $response = $this->client->post('/api/v1/orders', [
                'headers' => $this->authHeaders(),
                'json' => $orderData,
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            Log::info('FudoService: Order created in Fudo', [
                'fudo_order_id' => $data['id'] ?? $data['order_id'] ?? null,
            ]);

            return $data;
        } catch (GuzzleException $e) {
            Log::error('FudoService: Failed to create order in Fudo', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'order_data' => $orderData,
            ]);
            throw new \RuntimeException('Failed to create Fudo order: ' . $e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * Map a local Order model to Fudo order format and send it.
     *
     * @param Order $order Local order instance
     * @return array Fudo response
     */
    public function sendOrderToFudo(Order $order): array
    {
        $fudoItems = [];

        foreach ($order->items as $item) {
            $fudoItem = [
                'name' => $item['name'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['price'],
                'total' => $item['line_total'],
                'notes' => $item['notes'] ?? '',
            ];

            // Include fudo_id if the menu item has one
            if (!empty($item['menu_item_id'])) {
                $menuItem = MenuItem::find($item['menu_item_id']);
                if ($menuItem && $menuItem->fudo_id) {
                    $fudoItem['product_id'] = $menuItem->fudo_id;
                }
            }

            if (!empty($item['modifiers'])) {
                $fudoItem['modifiers'] = $item['modifiers'];
            }

            $fudoItems[] = $fudoItem;
        }

        $fudoOrderData = [
            'external_id' => (string) $order->_id,
            'items' => $fudoItems,
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'total' => $order->total,
            'notes' => $order->notes ?? '',
            'source' => $order->source ?? 'web',
            'customer' => [
                'name' => $order->customer->name ?? '',
                'phone' => $order->customer->phone ?? '',
                'email' => $order->customer->email ?? '',
            ],
        ];

        if ($order->delivery_address) {
            $fudoOrderData['delivery_address'] = $order->delivery_address;
        }

        $response = $this->createOrder($fudoOrderData);

        // Store the Fudo order ID in our local order
        $fudoOrderId = $response['id'] ?? $response['order_id'] ?? null;
        if ($fudoOrderId) {
            $order->update(['fudo_order_id' => (string) $fudoOrderId]);
        }

        return $response;
    }

    /**
     * Check order status in Fudo POS.
     *
     * @param string $fudoOrderId The Fudo order ID
     * @return array Order status data from Fudo
     */
    public function getOrderStatus(string $fudoOrderId): array
    {
        try {
            $response = $this->client->get("/api/v1/orders/{$fudoOrderId}", [
                'headers' => $this->authHeaders(),
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            Log::info('FudoService: Order status fetched', [
                'fudo_order_id' => $fudoOrderId,
                'status' => $data['status'] ?? 'unknown',
            ]);

            return $data;
        } catch (GuzzleException $e) {
            Log::error('FudoService: Failed to fetch order status', [
                'fudo_order_id' => $fudoOrderId,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw new \RuntimeException('Failed to fetch Fudo order status: ' . $e->getMessage(), $e->getCode(), $e);
        }
    }
}

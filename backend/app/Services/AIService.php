<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Promotion;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AIService
{
    private Client $client;
    private string $apiKey;
    private string $model;
    private string $apiUrl;
    private int $maxTokens;
    private float $temperature;
    private int $maxRecommendations;
    private int $cacheTtl;

    public function __construct()
    {
        $this->apiKey = config('ai.google.api_key', '');
        $this->model = config('ai.google.model', 'gemini-2.0-flash');
        $this->apiUrl = config('ai.google.api_url', 'https://generativelanguage.googleapis.com/v1beta');
        $this->maxTokens = (int) config('ai.google.max_tokens', 500);
        $this->temperature = (float) config('ai.google.temperature', 0.7);
        $this->maxRecommendations = (int) config('ai.recommendations.max_items', 5);
        $this->cacheTtl = (int) config('ai.recommendations.cache_ttl', 3600);

        $this->client = new Client([
            'timeout' => config('ai.timeout', 30),
            'headers' => ['Content-Type' => 'application/json'],
        ]);
    }

    // ─── Core: Call Gemini API ────────────────────────────────────────

    /**
     * Call Google Gemini API with generateContent endpoint.
     *
     * @param string $prompt  The user/system prompt text
     * @param array  $context Optional additional context merged into the prompt
     * @return string|null     The generated text response, or null on failure
     */
    public function generateContent(string $prompt, array $context = []): ?string
    {
        if (empty($this->apiKey)) {
            Log::warning('AIService: GOOGLE_AI_API_KEY is not configured');
            return null;
        }

        // Merge context into prompt if provided
        $fullPrompt = $prompt;
        if (!empty($context)) {
            $contextStr = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            $fullPrompt = $prompt . "\n\nContexto adicional:\n" . $contextStr;
        }

        $url = "{$this->apiUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $fullPrompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => $this->temperature,
                'maxOutputTokens' => $this->maxTokens,
            ],
        ];

        try {
            $response = $this->client->post($url, [
                'json' => $payload,
            ]);

            $body = json_decode($response->getBody()->getContents(), true);

            // Extract text from Gemini response structure
            $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$text) {
                Log::warning('AIService: Empty response from Gemini', [
                    'body' => $body,
                ]);
                return null;
            }

            Log::debug('AIService: Gemini response received', [
                'prompt_length' => mb_strlen($fullPrompt),
                'response_length' => mb_strlen($text),
            ]);

            return $text;
        } catch (GuzzleException $e) {
            Log::error('AIService: Gemini API request failed', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            return null;
        } catch (\Throwable $e) {
            Log::error('AIService: Unexpected error calling Gemini', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    // ─── Task 49: Recommendation System ──────────────────────────────

    /**
     * Generate personalized menu recommendations for a customer.
     *
     * 1. Fetch customer's last 10 orders
     * 2. Extract favorite items and categories
     * 3. Get current available menu items
     * 4. Build prompt for Gemini
     * 5. Parse response into structured recommendations
     * 6. Cache results in Redis (1 hour TTL)
     *
     * @return array{recommendations: array, source: string}
     */
    public function getRecommendations(Customer $customer): array
    {
        $cacheKey = "ai_recommendations:{$customer->_id}";

        // Check cache first
        $cached = Cache::get($cacheKey);
        if ($cached) {
            Log::debug('AIService: Returning cached recommendations', [
                'customer_id' => (string) $customer->_id,
            ]);
            return ['recommendations' => $cached, 'source' => 'cache'];
        }

        // 1. Fetch last 10 orders
        $recentOrders = Order::where('customer_id', (string) $customer->_id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // 2. Extract favorite items and categories
        $orderHistory = $this->extractOrderHistory($recentOrders);

        // 3. Get current available menu items
        $availableItems = MenuItem::where('available', true)
            ->orderBy('category')
            ->get(['_id', 'name', 'description', 'price', 'category'])
            ->toArray();

        // 4. Build prompt
        $prompt = $this->buildRecommendationPrompt($customer, $orderHistory, $availableItems);

        // 5. Call Gemini
        $aiResponse = $this->generateContent($prompt);

        if (!$aiResponse) {
            // Fallback: return popular items if AI fails
            return [
                'recommendations' => $this->getFallbackRecommendations($availableItems),
                'source' => 'fallback',
            ];
        }

        // 6. Parse response into structured recommendations
        $recommendations = $this->parseRecommendations($aiResponse, $availableItems);

        // Cache results
        if (!empty($recommendations)) {
            Cache::put($cacheKey, $recommendations, $this->cacheTtl);
        }

        Log::info('AIService: Generated recommendations', [
            'customer_id' => (string) $customer->_id,
            'count' => count($recommendations),
        ]);

        return ['recommendations' => $recommendations, 'source' => 'ai'];
    }

    /**
     * Extract order history stats from recent orders.
     */
    private function extractOrderHistory($orders): array
    {
        $itemCounts = [];
        $categoryCounts = [];
        $totalSpent = 0;

        foreach ($orders as $order) {
            $totalSpent += $order->total;
            foreach ($order->items as $item) {
                $name = $item['name'] ?? 'Unknown';
                $qty = $item['quantity'] ?? 1;
                $itemCounts[$name] = ($itemCounts[$name] ?? 0) + $qty;

                // Try to find category from menu
                $menuItem = MenuItem::where('name', $name)->first();
                if ($menuItem) {
                    $cat = $menuItem->category;
                    $categoryCounts[$cat] = ($categoryCounts[$cat] ?? 0) + $qty;
                }
            }
        }

        arsort($itemCounts);
        arsort($categoryCounts);

        return [
            'favorite_items' => array_slice($itemCounts, 0, 5, true),
            'favorite_categories' => array_slice($categoryCounts, 0, 3, true),
            'total_orders' => $orders->count(),
            'avg_order_value' => $orders->count() > 0 ? round($totalSpent / $orders->count(), 2) : 0,
        ];
    }

    /**
     * Build the recommendation prompt for Gemini.
     */
    private function buildRecommendationPrompt(Customer $customer, array $history, array $availableItems): string
    {
        $hour = now()->format('H');
        $timeOfDay = match (true) {
            $hour >= 6 && $hour < 12 => 'mañana',
            $hour >= 12 && $hour < 17 => 'mediodía',
            $hour >= 17 && $hour < 21 => 'tarde/noche',
            default => 'noche',
        };

        $favoriteItemsStr = !empty($history['favorite_items'])
            ? implode(', ', array_map(fn($name, $count) => "{$name} ({$count}x)", array_keys($history['favorite_items']), $history['favorite_items']))
            : 'Sin historial';

        $favoriteCatsStr = !empty($history['favorite_categories'])
            ? implode(', ', array_keys($history['favorite_categories']))
            : 'Sin preferencia';

        $menuList = '';
        foreach ($availableItems as $item) {
            $id = $item['_id'] ?? '';
            $menuList .= "- ID:{$id} | {$item['name']} | {$item['category']} | \${$item['price']}\n";
        }

        $preferences = !empty($customer->preferences) ? json_encode($customer->preferences, JSON_UNESCAPED_UNICODE) : 'No especificadas';

        return <<<PROMPT
Eres el asistente de recomendaciones de Sushi Queen, un restaurante de sushi.
Tu tarea es recomendar exactamente {$this->maxRecommendations} productos del menú para este cliente.

CLIENTE:
- Nombre: {$customer->name}
- Pedidos totales: {$history['total_orders']}
- Valor promedio de pedido: \${$history['avg_order_value']}
- Items favoritos: {$favoriteItemsStr}
- Categorías favoritas: {$favoriteCatsStr}
- Preferencias: {$preferences}

MOMENTO DEL DÍA: {$timeOfDay}

MENÚ DISPONIBLE:
{$menuList}

INSTRUCCIONES:
1. Recomienda exactamente {$this->maxRecommendations} items del menú disponible
2. Prioriza items similares a los favoritos del cliente
3. Incluye al menos 1 item de una categoría que el cliente NO ha probado (para descubrimiento)
4. Considera el momento del día
5. Responde SOLO en formato JSON, sin texto adicional, sin markdown, sin backticks

FORMATO DE RESPUESTA (JSON puro):
[
  {"id": "MENU_ITEM_ID", "name": "Nombre del item", "reason": "Razón breve en español de por qué se recomienda"}
]
PROMPT;
    }

    /**
     * Parse Gemini response into structured recommendation array.
     */
    private function parseRecommendations(string $aiResponse, array $availableItems): array
    {
        // Clean response: remove markdown code blocks if present
        $cleaned = trim($aiResponse);
        $cleaned = preg_replace('/^```(?:json)?\s*/i', '', $cleaned);
        $cleaned = preg_replace('/\s*```$/i', '', $cleaned);
        $cleaned = trim($cleaned);

        $parsed = json_decode($cleaned, true);

        if (!is_array($parsed)) {
            Log::warning('AIService: Failed to parse Gemini recommendations', [
                'raw_response' => $aiResponse,
            ]);
            return $this->getFallbackRecommendations($availableItems);
        }

        // Validate and enrich with actual menu item data
        $validItemIds = array_column($availableItems, '_id');
        $recommendations = [];

        foreach ($parsed as $rec) {
            $id = $rec['id'] ?? null;
            if (!$id) continue;

            // Convert to string for comparison
            $idStr = (string) $id;

            // Find matching menu item
            $menuItem = null;
            foreach ($availableItems as $item) {
                if ((string) ($item['_id'] ?? '') === $idStr) {
                    $menuItem = $item;
                    break;
                }
            }

            if (!$menuItem) {
                // Try matching by name as fallback
                $recName = mb_strtolower($rec['name'] ?? '');
                foreach ($availableItems as $item) {
                    if (mb_strtolower($item['name']) === $recName) {
                        $menuItem = $item;
                        break;
                    }
                }
            }

            if ($menuItem) {
                $recommendations[] = [
                    'menu_item_id' => (string) ($menuItem['_id'] ?? ''),
                    'name' => $menuItem['name'],
                    'category' => $menuItem['category'],
                    'price' => $menuItem['price'],
                    'reason' => $rec['reason'] ?? 'Recomendado para ti',
                ];
            }

            if (count($recommendations) >= $this->maxRecommendations) break;
        }

        return $recommendations;
    }

    /**
     * Fallback recommendations when AI is unavailable — return random available items.
     */
    private function getFallbackRecommendations(array $availableItems): array
    {
        $shuffled = $availableItems;
        shuffle($shuffled);
        $selected = array_slice($shuffled, 0, $this->maxRecommendations);

        return array_map(fn($item) => [
            'menu_item_id' => (string) ($item['_id'] ?? ''),
            'name' => $item['name'],
            'category' => $item['category'],
            'price' => $item['price'],
            'reason' => 'Recomendación popular de Sushi Queen',
        ], $selected);
    }

    // ─── Task 50: WhatsApp AI Response Generation ────────────────────

    /**
     * Generate an AI-powered WhatsApp response for unrecognized messages.
     *
     * The AI knows about the menu, promotions, and customer history.
     * Responses are kept short and in Spanish.
     *
     * @param string   $message         The incoming WhatsApp message text
     * @param array    $customerContext  Customer data (name, history, preferences)
     * @return string                    AI-generated response in Spanish
     */
    public function generateWhatsAppResponse(string $message, array $customerContext = []): string
    {
        // Build menu summary
        $menuItems = MenuItem::where('available', true)
            ->orderBy('category')
            ->get(['name', 'price', 'category']);

        $menuSummary = '';
        $currentCat = '';
        foreach ($menuItems as $item) {
            if ($item->category !== $currentCat) {
                $currentCat = $item->category;
                $menuSummary .= "\n[{$currentCat}]\n";
            }
            $menuSummary .= "  - {$item->name}: \${$item->price}\n";
        }

        // Build active promotions summary
        $promos = Promotion::active()->get(['title', 'description', 'discount_type', 'discount_value']);
        $promoSummary = $promos->isEmpty()
            ? 'No hay promociones activas.'
            : $promos->map(fn($p) => "- {$p->title}: {$p->description}")->implode("\n");

        // Customer context
        $customerName = $customerContext['name'] ?? 'Cliente';
        $customerHistory = $customerContext['order_history'] ?? 'Sin pedidos anteriores';
        $customerPrefs = $customerContext['preferences'] ?? 'No especificadas';

        $prompt = <<<PROMPT
Eres el asistente virtual de Sushi Queen por WhatsApp. Tu nombre es Sushi Queen Bot.

REGLAS:
1. Responde SIEMPRE en español
2. Sé amable, breve y directo (máximo 3 oraciones)
3. Si preguntan por el menú, sugiere escribir "menu" para ver las opciones interactivas
4. Si preguntan por su pedido, sugiere escribir "estado"
5. Si quieren pedir, sugiere escribir "menu" para empezar
6. No inventes precios ni productos que no estén en el menú
7. Usa emojis con moderación (1-2 por mensaje)
8. Si no sabés algo, sugiere contactar al local

MENÚ ACTUAL:
{$menuSummary}

PROMOCIONES:
{$promoSummary}

CLIENTE: {$customerName}
HISTORIAL: {$customerHistory}
PREFERENCIAS: {$customerPrefs}

MENSAJE DEL CLIENTE: "{$message}"

Responde de forma natural y útil:
PROMPT;

        $response = $this->generateContent($prompt);

        if (!$response) {
            return "¡Hola! 🍣 No pude procesar tu mensaje. "
                . "Escribí *menu* para ver nuestros productos o *ayuda* para ver las opciones disponibles.";
        }

        // Clean up: remove quotes if Gemini wraps the response
        $response = trim($response, " \t\n\r\0\x0B\"'");

        // Ensure response isn't too long for WhatsApp (max ~1000 chars)
        if (mb_strlen($response) > 1000) {
            $response = mb_substr($response, 0, 997) . '...';
        }

        return $response;
    }

    // ─── Task 51: Customer Preference Analysis ──────────────────────

    /**
     * Analyze customer order patterns and update their ai_profile.
     *
     * 1. Fetch all customer orders
     * 2. Calculate: favorite items, order frequency, avg order value, preferred categories
     * 3. Build prompt for Gemini to generate customer profile insights
     * 4. Update customer.ai_profile with results
     *
     * Can be called periodically or after each order.
     *
     * @return array The updated ai_profile
     */
    public function analyzeCustomerPreferences(Customer $customer): array
    {
        // 1. Fetch all customer orders
        $orders = Order::where('customer_id', (string) $customer->_id)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($orders->isEmpty()) {
            $profile = [
                'analyzed_at' => now()->toISOString(),
                'total_orders' => 0,
                'insights' => 'Cliente nuevo, sin historial de pedidos.',
                'favorite_items' => [],
                'favorite_categories' => [],
                'avg_order_value' => 0,
                'order_frequency' => 'none',
                'customer_segment' => 'new',
                'suggestions' => 'Ofrecer menú de bienvenida con items populares.',
            ];

            $customer->update(['ai_profile' => $profile]);
            return $profile;
        }

        // 2. Calculate stats
        $itemCounts = [];
        $categoryCounts = [];
        $totalSpent = 0;
        $orderDates = [];

        foreach ($orders as $order) {
            $totalSpent += $order->total;
            $orderDates[] = $order->created_at;

            foreach ($order->items as $item) {
                $name = $item['name'] ?? 'Unknown';
                $qty = $item['quantity'] ?? 1;
                $price = $item['line_total'] ?? ($item['price'] ?? 0) * $qty;

                $itemCounts[$name] = ($itemCounts[$name] ?? 0) + $qty;

                $menuItem = MenuItem::where('name', $name)->first();
                if ($menuItem) {
                    $cat = $menuItem->category;
                    $categoryCounts[$cat] = ($categoryCounts[$cat] ?? 0) + $qty;
                }
            }
        }

        arsort($itemCounts);
        arsort($categoryCounts);

        $totalOrders = $orders->count();
        $avgOrderValue = round($totalSpent / $totalOrders, 2);

        // Calculate order frequency
        $frequency = 'occasional';
        if ($totalOrders >= 2 && count($orderDates) >= 2) {
            $firstOrder = end($orderDates);
            $lastOrder = reset($orderDates);
            $daysBetween = $firstOrder->diffInDays($lastOrder);
            $avgDaysBetween = $daysBetween > 0 ? $daysBetween / ($totalOrders - 1) : 0;

            $frequency = match (true) {
                $avgDaysBetween <= 3 => 'very_frequent',
                $avgDaysBetween <= 7 => 'weekly',
                $avgDaysBetween <= 14 => 'biweekly',
                $avgDaysBetween <= 30 => 'monthly',
                default => 'occasional',
            };
        }

        $favoriteItems = array_slice($itemCounts, 0, 5, true);
        $favoriteCategories = array_slice($categoryCounts, 0, 3, true);

        // 3. Build prompt for Gemini insights
        $favoriteItemsStr = implode(', ', array_map(
            fn($name, $count) => "{$name} ({$count}x)",
            array_keys($favoriteItems),
            $favoriteItems
        ));

        $favoriteCatsStr = implode(', ', array_map(
            fn($cat, $count) => "{$cat} ({$count}x)",
            array_keys($favoriteCategories),
            $favoriteCategories
        ));

        $prompt = <<<PROMPT
Eres un analista de datos de Sushi Queen, un restaurante de sushi.
Analiza el perfil de este cliente y genera insights accionables.

DATOS DEL CLIENTE:
- Nombre: {$customer->name}
- Total de pedidos: {$totalOrders}
- Gasto total: \${$totalSpent}
- Valor promedio de pedido: \${$avgOrderValue}
- Frecuencia: {$frequency}
- Items favoritos: {$favoriteItemsStr}
- Categorías favoritas: {$favoriteCatsStr}

INSTRUCCIONES:
Responde SOLO en formato JSON sin markdown ni backticks:
{
  "customer_segment": "vip|regular|occasional|new",
  "insights": "Resumen breve del perfil del cliente en español (1-2 oraciones)",
  "suggestions": "Sugerencia de marketing personalizada en español (1-2 oraciones)",
  "upsell_categories": ["categoría1", "categoría2"],
  "preferred_time": "lunch|dinner|late_night|unknown",
  "risk_of_churn": "low|medium|high"
}
PROMPT;

        $aiResponse = $this->generateContent($prompt);
        $aiInsights = [];

        if ($aiResponse) {
            $cleaned = trim($aiResponse);
            $cleaned = preg_replace('/^```(?:json)?\s*/i', '', $cleaned);
            $cleaned = preg_replace('/\s*```$/i', '', $cleaned);
            $aiInsights = json_decode(trim($cleaned), true) ?? [];
        }

        // 4. Build and save profile
        $profile = [
            'analyzed_at' => now()->toISOString(),
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'avg_order_value' => $avgOrderValue,
            'order_frequency' => $frequency,
            'favorite_items' => $favoriteItems,
            'favorite_categories' => $favoriteCategories,
            'customer_segment' => $aiInsights['customer_segment'] ?? ($totalOrders >= 10 ? 'vip' : ($totalOrders >= 3 ? 'regular' : 'occasional')),
            'insights' => $aiInsights['insights'] ?? "Cliente con {$totalOrders} pedidos, gasto promedio \${$avgOrderValue}.",
            'suggestions' => $aiInsights['suggestions'] ?? 'Enviar promociones personalizadas basadas en categorías favoritas.',
            'upsell_categories' => $aiInsights['upsell_categories'] ?? [],
            'preferred_time' => $aiInsights['preferred_time'] ?? 'unknown',
            'risk_of_churn' => $aiInsights['risk_of_churn'] ?? 'medium',
        ];

        $customer->update(['ai_profile' => $profile]);

        // Invalidate recommendation cache since profile changed
        Cache::forget("ai_recommendations:{$customer->_id}");

        Log::info('AIService: Customer preferences analyzed', [
            'customer_id' => (string) $customer->_id,
            'segment' => $profile['customer_segment'],
            'frequency' => $profile['order_frequency'],
        ]);

        return $profile;
    }
}

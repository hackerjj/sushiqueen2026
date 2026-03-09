<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Services\AIService;
use App\Http\Traits\RetryableHttpCall;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    use RetryableHttpCall;
    private Client $client;
    private string $phoneNumberId;
    private string $accessToken;
    private string $verifyToken;

    private const CACHE_SESSION_PREFIX = 'wa_session:';
    private const SESSION_TTL = 1800; // 30 minutes

    public function __construct()
    {
        $apiUrl = config('whatsapp.api_url', 'https://graph.facebook.com/v18.0');
        $this->phoneNumberId = config('whatsapp.phone_number_id', '');
        $this->accessToken = config('whatsapp.access_token', '');
        $this->verifyToken = config('whatsapp.verify_token', '');

        $this->client = new Client([
            'base_uri' => rtrim($apiUrl, '/') . '/',
            'timeout' => config('whatsapp.timeout', 30),
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    // ─── Sending Messages ────────────────────────────────────────────

    /**
     * Send a plain text message via WhatsApp Business Cloud API.
     */
    public function sendTextMessage(string $to, string $text): array
    {
        return $this->sendMessage($to, [
            'type' => 'text',
            'text' => ['body' => $text],
        ]);
    }

    /**
     * Send the main interactive menu with categories (Task 44).
     * Uses WhatsApp interactive list message format.
     */
    public function sendInteractiveMenu(string $to): array
    {
        $categories = MenuItem::where('available', true)
            ->distinct('category')
            ->get()
            ->toArray();

        // Fallback defaults if no categories in DB
        if (empty($categories)) {
            $categories = ['Rolls', 'Nigiri', 'Sashimi', 'Combos', 'Bebidas'];
        }

        $rows = [];
        foreach ($categories as $index => $category) {
            $catName = is_array($category) ? ($category['category'] ?? $category) : $category;
            $rows[] = [
                'id' => 'cat_' . strtolower(str_replace(' ', '_', $catName)),
                'title' => mb_substr($catName, 0, 24),
                'description' => 'Ver productos de ' . $catName,
            ];
            if ($index >= 9) break; // WhatsApp limit: max 10 rows per section
        }

        return $this->sendMessage($to, [
            'type' => 'interactive',
            'interactive' => [
                'type' => 'list',
                'header' => [
                    'type' => 'text',
                    'text' => '🍣 Sushi Queen',
                ],
                'body' => [
                    'text' => '¡Bienvenido a Sushi Queen! 🎉\nElegí una categoría para ver nuestro menú:',
                ],
                'footer' => [
                    'text' => 'Escribí "menu" en cualquier momento para volver aquí',
                ],
                'action' => [
                    'button' => 'Ver Menú 📋',
                    'sections' => [
                        [
                            'title' => 'Categorías',
                            'rows' => $rows,
                        ],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Send items for a specific category as an interactive list (Task 44).
     */
    public function sendCategoryItems(string $to, string $category): array
    {
        $items = MenuItem::where('available', true)
            ->where('category', 'like', '%' . $category . '%')
            ->orderBy('sort_order')
            ->limit(10)
            ->get();

        if ($items->isEmpty()) {
            return $this->sendTextMessage(
                $to,
                "No encontramos productos en la categoría \"{$category}\". Escribí *menu* para ver las categorías disponibles."
            );
        }

        $rows = [];
        foreach ($items as $item) {
            $desc = '$' . number_format($item->price, 0) . ' - ' . mb_substr($item->description ?? '', 0, 48);
            $rows[] = [
                'id' => 'item_' . (string) $item->_id,
                'title' => mb_substr($item->name, 0, 24),
                'description' => mb_substr($desc, 0, 72),
            ];
        }

        return $this->sendMessage($to, [
            'type' => 'interactive',
            'interactive' => [
                'type' => 'list',
                'header' => [
                    'type' => 'text',
                    'text' => "📂 {$category}",
                ],
                'body' => [
                    'text' => "Estos son los productos disponibles en {$category}.\nSeleccioná uno para agregarlo a tu pedido:",
                ],
                'footer' => [
                    'text' => 'Escribí "carrito" para ver tu pedido actual',
                ],
                'action' => [
                    'button' => 'Ver Productos 🍱',
                    'sections' => [
                        [
                            'title' => $category,
                            'rows' => $rows,
                        ],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Send order confirmation message (Task 45).
     */
    public function sendOrderConfirmation(string $to, Order $order): array
    {
        $itemLines = '';
        foreach ($order->items as $item) {
            $itemLines .= "• {$item['quantity']}x {$item['name']} - \${$item['line_total']}\n";
        }

        $text = "✅ *Pedido Confirmado*\n\n"
            . "📋 *Pedido #" . substr((string) $order->_id, -6) . "*\n\n"
            . $itemLines . "\n"
            . "Subtotal: \$" . number_format($order->subtotal, 2) . "\n"
            . "IVA (21%): \$" . number_format($order->tax, 2) . "\n"
            . "*Total: \$" . number_format($order->total, 2) . "*\n\n"
            . "Estado: " . $this->getStatusEmoji($order->status) . " " . $this->getStatusText($order->status) . "\n\n"
            . "Te avisaremos cuando tu pedido cambie de estado. 🍣\n"
            . "Escribí *estado* para consultar tu pedido.";

        return $this->sendTextMessage($to, $text);
    }

    /**
     * Send order status update notification (Task 46).
     * Status messages in Spanish as required.
     */
    public function sendOrderStatusUpdate(string $to, Order $order): array
    {
        $emoji = $this->getStatusEmoji($order->status);
        $statusText = $this->getStatusText($order->status);

        $text = "{$emoji} *Actualización de Pedido*\n\n"
            . "Pedido #" . substr((string) $order->_id, -6) . "\n"
            . "Nuevo estado: *{$statusText}*\n\n";

        // Spanish status messages as specified in Task 46
        $text .= match ($order->status) {
            'confirmed' => "Tu pedido ha sido confirmado. 👨‍🍳",
            'preparing' => "Estamos preparando tu pedido. 🍣",
            'ready' => "Tu pedido está listo. 🎉\nPodés pasar a retirarlo o lo enviaremos en breve.",
            'delivered' => "Tu pedido ha sido entregado. 🚀\n¡Gracias por elegir Sushi Queen! ❤️",
            'cancelled' => "Tu pedido fue cancelado. Si tenés alguna consulta, escribinos.",
            default => "Estado actualizado.",
        };

        return $this->sendTextMessage($to, $text);
    }

    // ─── Incoming Message Processing (Task 42/43) ────────────────────

    /**
     * Process incoming WhatsApp webhook payload.
     * Parses Meta webhook structure and routes to appropriate handler.
     */
    public function processIncomingMessage(array $payload): array
    {
        try {
            $entries = $payload['entry'] ?? [];

            foreach ($entries as $entry) {
                $changes = $entry['changes'] ?? [];

                foreach ($changes as $change) {
                    $value = $change['value'] ?? [];
                    $messages = $value['messages'] ?? [];
                    $contacts = $value['contacts'] ?? [];

                    // Handle status updates (delivery receipts, read receipts)
                    if (empty($messages) && !empty($value['statuses'])) {
                        Log::debug('WhatsAppService: Status update received', [
                            'statuses' => $value['statuses'],
                        ]);
                        continue;
                    }

                    foreach ($messages as $index => $message) {
                        $from = $message['from'] ?? null;
                        $type = $message['type'] ?? 'unknown';
                        $contactName = $contacts[$index]['profile']['name'] ?? 'Cliente';

                        if (!$from) {
                            Log::warning('WhatsAppService: Message missing "from" field', ['message' => $message]);
                            continue;
                        }

                        // Auto-register customer (Task 47)
                        $customer = $this->findOrCreateCustomer($from, $contactName);

                        // Mark message as read
                        $this->markAsRead($message['id'] ?? null);

                        // Route by message type
                        match ($type) {
                            'text' => $this->handleTextMessage($from, $message['text']['body'] ?? '', $customer),
                            'interactive' => $this->handleInteractiveReply($from, $message['interactive'] ?? [], $customer),
                            'button' => $this->handleButtonReply($from, $message['button'] ?? [], $customer),
                            default => $this->sendTextMessage($from, "No pudimos procesar ese tipo de mensaje. Escribí *menu* para ver nuestras opciones. 🍣"),
                        };
                    }
                }
            }

            return ['status' => 'processed'];
        } catch (\Throwable $e) {
            Log::error('WhatsAppService: Error processing incoming message', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    // ─── Message Type Handlers ───────────────────────────────────────

    /**
     * Handle incoming text messages.
     * Routes based on keywords (Task 44: "menu"/"menú" triggers interactive menu).
     */
    private function handleTextMessage(string $from, string $text, Customer $customer): void
    {
        $normalized = mb_strtolower(trim($text));

        match (true) {
            in_array($normalized, ['menu', 'menú', 'hola', 'hi', 'hello', 'inicio', 'start'])
                => $this->sendInteractiveMenu($from),

            in_array($normalized, ['carrito', 'cart', 'pedido', 'mi pedido'])
                => $this->sendCartSummary($from),

            in_array($normalized, ['confirmar', 'confirm', 'listo', 'pedir', 'ordenar'])
                => $this->confirmOrder($from, $customer),

            in_array($normalized, ['cancelar', 'cancel', 'vaciar', 'borrar'])
                => $this->cancelSession($from),

            in_array($normalized, ['estado', 'status', 'mi orden', 'tracking'])
                => $this->sendLastOrderStatus($from, $customer),

            in_array($normalized, ['ayuda', 'help', '?'])
                => $this->sendHelpMessage($from),

            // Quantity response (e.g., "2", "3") for pending item
            is_numeric($normalized) && (int) $normalized > 0 && (int) $normalized <= 20
                => $this->handleQuantityResponse($from, (int) $normalized),

            default => $this->handleUnrecognizedMessage($from, $text, $customer),
        };
    }

    /**
     * Handle unrecognized messages using AI fallback (Task 50).
     * Falls back to a static help message if AI is unavailable.
     */
    private function handleUnrecognizedMessage(string $from, string $text, Customer $customer): void
    {
        try {
            $aiService = new AIService();

            // Build customer context for AI
            $lastOrders = Order::where('customer_id', (string) $customer->_id)
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            $orderHistory = $lastOrders->isEmpty()
                ? 'Sin pedidos anteriores'
                : $lastOrders->map(fn($o) => implode(', ', array_column($o->items, 'name')))->implode(' | ');

            $customerContext = [
                'name' => $customer->name,
                'order_history' => $orderHistory,
                'preferences' => !empty($customer->preferences) ? json_encode($customer->preferences, JSON_UNESCAPED_UNICODE) : 'No especificadas',
            ];

            $aiResponse = $aiService->generateWhatsAppResponse($text, $customerContext);
            $this->sendTextMessage($from, $aiResponse);

            Log::debug('WhatsAppService: AI response sent for unrecognized message', [
                'from' => $from,
                'message' => $text,
            ]);
        } catch (\Throwable $e) {
            Log::warning('WhatsAppService: AI fallback failed, sending static response', [
                'error' => $e->getMessage(),
            ]);

            $this->sendTextMessage($from,
                "No entendí tu mensaje. 🤔\n\n"
                . "Escribí:\n"
                . "• *menu* — Ver nuestro menú\n"
                . "• *carrito* — Ver tu pedido actual\n"
                . "• *confirmar* — Confirmar tu pedido\n"
                . "• *estado* — Ver estado de tu última orden\n"
                . "• *ayuda* — Ver opciones disponibles"
            );
        }
    }

    /**
     * Handle interactive list/button replies (category or item selection).
     */
    private function handleInteractiveReply(string $from, array $interactive, Customer $customer): void
    {
        $type = $interactive['type'] ?? '';

        if ($type === 'list_reply') {
            $selectedId = $interactive['list_reply']['id'] ?? '';
            $this->handleListSelection($from, $selectedId, $customer);
        } elseif ($type === 'button_reply') {
            $buttonId = $interactive['button_reply']['id'] ?? '';
            $this->handleButtonSelection($from, $buttonId, $customer);
        }
    }

    /**
     * Handle button reply messages.
     */
    private function handleButtonReply(string $from, array $button, Customer $customer): void
    {
        $buttonId = $button['payload'] ?? $button['text'] ?? '';
        $this->handleButtonSelection($from, $buttonId, $customer);
    }

    /**
     * Handle list selection (category or item).
     */
    private function handleListSelection(string $from, string $selectedId, Customer $customer): void
    {
        // Category selection: cat_rolls, cat_nigiri, etc.
        if (str_starts_with($selectedId, 'cat_')) {
            $categorySlug = str_replace('cat_', '', $selectedId);
            $category = str_replace('_', ' ', $categorySlug);

            // Find actual category name (case-insensitive match)
            $actualCategory = MenuItem::where('available', true)
                ->where('category', 'like', '%' . $category . '%')
                ->value('category');

            $this->sendCategoryItems($from, $actualCategory ?? ucfirst($category));
            return;
        }

        // Item selection: item_{mongo_id}
        if (str_starts_with($selectedId, 'item_')) {
            $itemId = str_replace('item_', '', $selectedId);
            $this->handleItemSelection($from, $itemId);
            return;
        }

        $this->sendTextMessage($from, "Selección no reconocida. Escribí *menu* para ver las opciones.");
    }

    /**
     * Handle button selection (confirm, cancel, etc.).
     */
    private function handleButtonSelection(string $from, string $buttonId, Customer $customer): void
    {
        match ($buttonId) {
            'confirm_order' => $this->confirmOrder($from, $customer),
            'cancel_order' => $this->cancelSession($from),
            'view_cart' => $this->sendCartSummary($from),
            'continue_shopping' => $this->sendInteractiveMenu($from),
            default => $this->sendTextMessage($from, "Opción no reconocida. Escribí *menu* para ver las opciones."),
        };
    }

    // ─── Order Flow via WhatsApp (Task 45) ───────────────────────────

    /**
     * Handle item selection — store in session and ask for quantity.
     */
    private function handleItemSelection(string $from, string $itemId): void
    {
        $item = MenuItem::find($itemId);

        if (!$item || !$item->available) {
            $this->sendTextMessage($from, "Ese producto no está disponible. Escribí *menu* para ver las opciones.");
            return;
        }

        // Store pending item in session
        $session = $this->getSession($from);
        $session['pending_item'] = [
            'id' => (string) $item->_id,
            'name' => $item->name,
            'price' => $item->price,
        ];
        $this->saveSession($from, $session);

        $this->sendTextMessage($from,
            "🍣 *{$item->name}*\n"
            . ($item->description ? "{$item->description}\n" : '')
            . "💰 Precio: \$" . number_format($item->price, 0) . "\n\n"
            . "¿Cuántas unidades querés? Respondé con un número (1-20).\n"
            . "Escribí *cancelar* para volver al menú."
        );
    }

    /**
     * Handle quantity response — add item to cart.
     */
    private function handleQuantityResponse(string $from, int $quantity): void
    {
        $session = $this->getSession($from);
        $pendingItem = $session['pending_item'] ?? null;

        if (!$pendingItem) {
            $this->sendTextMessage($from, "No hay ningún producto pendiente. Escribí *menu* para elegir uno.");
            return;
        }

        // Add to cart (merge if item already exists)
        $cart = $session['cart'] ?? [];
        $existingIndex = null;

        foreach ($cart as $index => $cartItem) {
            if ($cartItem['id'] === $pendingItem['id']) {
                $existingIndex = $index;
                break;
            }
        }

        if ($existingIndex !== null) {
            $cart[$existingIndex]['quantity'] += $quantity;
            $cart[$existingIndex]['line_total'] = $cart[$existingIndex]['quantity'] * $cart[$existingIndex]['price'];
        } else {
            $cart[] = [
                'id' => $pendingItem['id'],
                'name' => $pendingItem['name'],
                'price' => $pendingItem['price'],
                'quantity' => $quantity,
                'line_total' => $pendingItem['price'] * $quantity,
            ];
        }

        // Clear pending item, update cart
        $session['cart'] = $cart;
        unset($session['pending_item']);
        $this->saveSession($from, $session);

        $total = array_sum(array_column($cart, 'line_total'));

        $this->sendTextMessage($from,
            "✅ Agregado: {$quantity}x {$pendingItem['name']}\n\n"
            . "🛒 Tu carrito tiene " . count($cart) . " producto(s) — Total: \$" . number_format($total, 0) . "\n\n"
            . "• Escribí *menu* para seguir agregando\n"
            . "• Escribí *carrito* para ver el detalle\n"
            . "• Escribí *confirmar* para hacer el pedido"
        );
    }

    /**
     * Send cart summary to customer.
     */
    private function sendCartSummary(string $from): void
    {
        $session = $this->getSession($from);
        $cart = $session['cart'] ?? [];

        if (empty($cart)) {
            $this->sendTextMessage($from, "Tu carrito está vacío. 🛒\nEscribí *menu* para ver nuestros productos.");
            return;
        }

        $text = "🛒 *Tu Pedido Actual*\n\n";
        $total = 0;

        foreach ($cart as $item) {
            $text .= "• {$item['quantity']}x {$item['name']} — \$" . number_format($item['line_total'], 0) . "\n";
            $total += $item['line_total'];
        }

        $tax = round($total * 0.21, 2);
        $grandTotal = $total + $tax;

        $text .= "\nSubtotal: \$" . number_format($total, 0) . "\n"
            . "IVA (21%): \$" . number_format($tax, 0) . "\n"
            . "*Total: \$" . number_format($grandTotal, 0) . "*\n\n"
            . "• Escribí *confirmar* para hacer el pedido\n"
            . "• Escribí *cancelar* para vaciar el carrito\n"
            . "• Escribí *menu* para seguir agregando";

        $this->sendTextMessage($from, $text);
    }

    /**
     * Confirm and create the order from WhatsApp cart.
     * Uses same order creation logic as OrderController::store().
     */
    private function confirmOrder(string $from, Customer $customer): void
    {
        $session = $this->getSession($from);
        $cart = $session['cart'] ?? [];

        if (empty($cart)) {
            $this->sendTextMessage($from, "No tenés productos en el carrito. Escribí *menu* para empezar.");
            return;
        }

        try {
            // Build order items (same structure as OrderController::store)
            $orderItems = [];
            $subtotal = 0;

            foreach ($cart as $cartItem) {
                $lineTotal = $cartItem['price'] * $cartItem['quantity'];
                $subtotal += $lineTotal;

                $orderItems[] = [
                    'menu_item_id' => $cartItem['id'],
                    'name' => $cartItem['name'],
                    'price' => $cartItem['price'],
                    'quantity' => $cartItem['quantity'],
                    'modifiers' => [],
                    'notes' => '',
                    'line_total' => $lineTotal,
                ];
            }

            $tax = round($subtotal * 0.21, 2);
            $total = round($subtotal + $tax, 2);

            // Create order
            $order = Order::create([
                'customer_id' => (string) $customer->_id,
                'items' => $orderItems,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'status' => 'pending',
                'source' => 'whatsapp',
                'notes' => '',
                'delivery_address' => $customer->address ?? '',
            ]);

            // Update customer stats (same as OrderController)
            $customer->increment('total_orders');
            $customer->increment('total_spent', $total);
            $customer->update(['last_order_at' => now()]);

            // Clear WhatsApp session
            $this->clearSession($from);

            // Send order confirmation
            $this->sendOrderConfirmation($from, $order);

            Log::info('WhatsAppService: Order created via WhatsApp', [
                'order_id' => (string) $order->_id,
                'customer_id' => (string) $customer->_id,
                'total' => $total,
            ]);
        } catch (\Throwable $e) {
            Log::error('WhatsAppService: Failed to create order', [
                'from' => $from,
                'error' => $e->getMessage(),
            ]);
            $this->sendTextMessage($from, "❌ Hubo un error al crear tu pedido. Por favor intentá de nuevo o escribí *ayuda*.");
        }
    }

    /**
     * Cancel current session/cart.
     */
    private function cancelSession(string $from): void
    {
        $this->clearSession($from);
        $this->sendTextMessage($from, "🗑️ Tu carrito fue vaciado.\nEscribí *menu* para empezar de nuevo.");
    }

    /**
     * Send last order status for a customer.
     */
    private function sendLastOrderStatus(string $from, Customer $customer): void
    {
        $order = Order::where('customer_id', (string) $customer->_id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$order) {
            $this->sendTextMessage($from, "No encontramos pedidos anteriores. Escribí *menu* para hacer tu primer pedido. 🍣");
            return;
        }

        $emoji = $this->getStatusEmoji($order->status);
        $statusText = $this->getStatusText($order->status);

        $text = "📋 *Tu Último Pedido*\n\n"
            . "Pedido #" . substr((string) $order->_id, -6) . "\n"
            . "Estado: {$emoji} *{$statusText}*\n"
            . "Total: \$" . number_format($order->total, 2) . "\n"
            . "Fecha: " . $order->created_at->format('d/m/Y H:i') . "\n\n";

        foreach ($order->items as $item) {
            $text .= "• {$item['quantity']}x {$item['name']}\n";
        }

        $this->sendTextMessage($from, $text);
    }

    /**
     * Send help message with available commands.
     */
    private function sendHelpMessage(string $from): void
    {
        $this->sendTextMessage($from,
            "🍣 *Sushi Queen — Ayuda*\n\n"
            . "Estos son los comandos disponibles:\n\n"
            . "📋 *menu* — Ver nuestro menú\n"
            . "🛒 *carrito* — Ver tu pedido actual\n"
            . "✅ *confirmar* — Confirmar tu pedido\n"
            . "🗑️ *cancelar* — Vaciar tu carrito\n"
            . "📦 *estado* — Ver estado de tu última orden\n"
            . "❓ *ayuda* — Ver este mensaje\n\n"
            . "También podés seleccionar opciones de los menús interactivos que te enviamos. 😊"
        );
    }

    // ─── Customer Auto-Registration (Task 47) ───────────────────────

    /**
     * Find or create a customer from WhatsApp message.
     * Extracts name from WhatsApp profile if available.
     * Sets source='whatsapp' and stores whatsapp_id.
     */
    public function findOrCreateCustomer(string $whatsappNumber, string $name = 'Cliente'): Customer
    {
        // Normalize phone: remove non-numeric chars
        $phone = preg_replace('/[^0-9]/', '', $whatsappNumber);

        // Try to find by whatsapp_id first, then by phone
        $customer = Customer::where('whatsapp_id', $whatsappNumber)->first()
            ?? Customer::where('phone', $phone)->first()
            ?? Customer::where('phone', $whatsappNumber)->first();

        if ($customer) {
            // Update whatsapp_id if not set
            if (!$customer->whatsapp_id) {
                $customer->update(['whatsapp_id' => $whatsappNumber]);
            }
            // Update name if it was a placeholder and we now have a real name
            if ($customer->name === 'Cliente' && $name !== 'Cliente') {
                $customer->update(['name' => $name]);
            }
            return $customer;
        }

        // Create new customer from WhatsApp
        $customer = Customer::create([
            'name' => $name,
            'phone' => $phone,
            'whatsapp_id' => $whatsappNumber,
            'source' => 'whatsapp',
            'tier' => 'new',
            'total_orders' => 0,
            'total_spent' => 0.0,
            'preferences' => [],
            'ai_profile' => [],
        ]);

        Log::info('WhatsAppService: New customer registered from WhatsApp', [
            'customer_id' => (string) $customer->_id,
            'phone' => $phone,
            'name' => $name,
        ]);

        return $customer;
    }

    // ─── Session Management (Cache-backed cart) ──────────────────────

    /**
     * Get session data for a WhatsApp number.
     */
    private function getSession(string $phone): array
    {
        $key = self::CACHE_SESSION_PREFIX . $phone;
        $data = Cache::store('file')->get($key);
        return $data ? (is_array($data) ? $data : json_decode($data, true)) : ['cart' => []];
    }

    /**
     * Save session data.
     */
    private function saveSession(string $phone, array $data): void
    {
        $key = self::CACHE_SESSION_PREFIX . $phone;
        Cache::store('file')->put($key, $data, self::SESSION_TTL);
    }

    /**
     * Clear session data.
     */
    private function clearSession(string $phone): void
    {
        $key = self::CACHE_SESSION_PREFIX . $phone;
        Cache::store('file')->forget($key);
    }

    // ─── WhatsApp Business Cloud API Helpers ─────────────────────────

    /**
     * Send a message via Meta WhatsApp Business Cloud API.
     */
    private function sendMessage(string $to, array $messageData): array
    {
        $payload = array_merge([
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
        ], $messageData);

        try {
            $result = $this->retryWithBackoff(function () use ($payload) {
                $response = $this->client->post("{$this->phoneNumberId}/messages", [
                    'json' => $payload,
                ]);
                return json_decode($response->getBody()->getContents(), true);
            });

            Log::debug('WhatsAppService: Message sent', [
                'to' => $to,
                'type' => $messageData['type'] ?? 'unknown',
                'message_id' => $result['messages'][0]['id'] ?? null,
            ]);

            return $result;
        } catch (\Throwable $e) {
            Log::error('WhatsAppService: Failed to send message after retries', [
                'to' => $to,
                'type' => $messageData['type'] ?? 'unknown',
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Mark a message as read via WhatsApp API.
     */
    private function markAsRead(?string $messageId): void
    {
        if (!$messageId) return;

        try {
            $this->retryWithBackoff(function () use ($messageId) {
                $this->client->post("{$this->phoneNumberId}/messages", [
                    'json' => [
                        'messaging_product' => 'whatsapp',
                        'status' => 'read',
                        'message_id' => $messageId,
                    ],
                ]);
            });
        } catch (\Throwable $e) {
            Log::warning('WhatsAppService: Failed to mark message as read after retries', [
                'message_id' => $messageId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Verify webhook subscription challenge from Meta (Task 42).
     */
    public function verifyWebhook(string $mode, string $token, string $challenge): ?string
    {
        if ($mode === 'subscribe' && $token === $this->verifyToken) {
            return $challenge;
        }
        return null;
    }

    // ─── Status Helpers ──────────────────────────────────────────────

    private function getStatusEmoji(string $status): string
    {
        return match ($status) {
            'pending' => '⏳',
            'confirmed' => '✅',
            'preparing' => '👨‍🍳',
            'ready' => '🎉',
            'delivered' => '🚀',
            'cancelled' => '❌',
            default => '📋',
        };
    }

    private function getStatusText(string $status): string
    {
        return match ($status) {
            'pending' => 'Pendiente',
            'confirmed' => 'Confirmado',
            'preparing' => 'En preparación',
            'ready' => 'Listo para retirar/enviar',
            'delivered' => 'Entregado',
            'cancelled' => 'Cancelado',
            default => ucfirst($status),
        };
    }
}

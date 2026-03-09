<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Events\OrderUpdated;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Traits\ApiResponse;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Services\FudoService;
use App\Services\InventoryService;
use App\Services\POSService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderController extends Controller
{
    use ApiResponse;
    /**
     * Create a new order (public).
     * Also creates or updates the customer record.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Accept both flat format (customer_name) and nested format (customer.name)
        $hasNested = $request->has('customer');

        // Normalize customer data from either format
        $customerName = $hasNested ? $validated['customer']['name'] : $validated['customer_name'];
        $customerPhone = $hasNested ? $validated['customer']['phone'] : $validated['customer_phone'];
        $customerEmail = $hasNested
            ? ($validated['customer']['email'] ?? null)
            : ($validated['customer_email'] ?? null);
        $deliveryAddress = $validated['delivery_address']
            ?? ($hasNested ? ($validated['customer']['address'] ?? '') : '');

        // Find or create customer
        $customer = Customer::firstOrCreate(
            ['phone' => $customerPhone],
            [
                'name' => $customerName,
                'email' => $customerEmail,
                'source' => $validated['source'] ?? 'web',
                'tier' => 'new',
                'total_orders' => 0,
                'total_spent' => 0.0,
                'preferences' => [],
                'ai_profile' => [],
            ]
        );

        // Build order items with prices
        $orderItems = [];
        $subtotal = 0;

        foreach ($validated['items'] as $item) {
            // Try to find menu item by ID first, then by name as fallback
            $menuItem = MenuItem::find($item['menu_item_id']);

            if (!$menuItem && !empty($item['name'])) {
                $menuItem = MenuItem::where('name', $item['name'])->first();
            }

            // If still not found, create order item from provided data
            if (!$menuItem) {
                Log::warning('OrderController: Menu item not found, using provided data', [
                    'menu_item_id' => $item['menu_item_id'],
                    'name' => $item['name'] ?? 'unknown',
                ]);

                $lineTotal = ($item['price'] ?? 0) * $item['quantity'];
                $subtotal += $lineTotal;

                $orderItems[] = [
                    'menu_item_id' => $item['menu_item_id'],
                    'name' => $item['name'] ?? 'Item desconocido',
                    'price' => $item['price'] ?? 0,
                    'quantity' => $item['quantity'],
                    'modifiers' => $item['modifiers'] ?? [],
                    'notes' => $item['notes'] ?? '',
                    'line_total' => $lineTotal,
                ];
                continue;
            }

            $lineTotal = $menuItem->price * $item['quantity'];
            $subtotal += $lineTotal;

            $orderItems[] = [
                'menu_item_id' => $menuItem->_id,
                'name' => $menuItem->name,
                'price' => $menuItem->price,
                'quantity' => $item['quantity'],
                'modifiers' => $item['modifiers'] ?? [],
                'notes' => $item['notes'] ?? '',
                'line_total' => $lineTotal,
            ];
        }

        $tax = 0; // IVA already included in Mexican prices
        $total = round($subtotal, 2);

        $order = Order::create([
            'customer_id' => (string) $customer->_id,
            'items' => $orderItems,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'status' => 'pending',
            'source' => $validated['source'] ?? 'web',
            'notes' => $validated['notes'] ?? '',
            'delivery_address' => $deliveryAddress,
        ]);

        // Update customer stats
        $customer->increment('total_orders');
        $customer->increment('total_spent', $total);
        $customer->update([
            'last_order_at' => now(),
            'address' => $deliveryAddress ?: $customer->address,
        ]);

        // Update tier based on total orders
        $this->updateCustomerTier($customer->fresh());

        // Always send order to Fudo POS
        $fudoResponse = null;
        try {
            $fudoService = new FudoService();
            $fudoResponse = $fudoService->sendOrderToFudo($order->fresh()->load('customer'));
            Log::info('OrderController: Order sent to Fudo', [
                'order_id' => (string) $order->_id,
                'fudo_order_id' => $order->fresh()->fudo_order_id,
            ]);
        } catch (\Throwable $e) {
            Log::error('OrderController: Failed to send order to Fudo', [
                'order_id' => (string) $order->_id,
                'error' => $e->getMessage(),
            ]);
            $fudoResponse = ['error' => 'Fudo sync failed: ' . $e->getMessage()];
        }

        // Broadcast order created event for KDS real-time updates
        try {
            event(new OrderCreated($order->fresh()));
        } catch (\Throwable $e) {
            Log::warning('OrderController: Failed to broadcast OrderCreated event', [
                'order_id' => (string) $order->_id,
                'error' => $e->getMessage(),
            ]);
        }

        // Invalidate dashboard cache when a new order is created
        Cache::forget('dashboard:' . md5(':'));

        return response()->json([
            'message' => 'Order created successfully',
            'data' => $order->load('customer'),
            'fudo' => $fudoResponse,
        ], 201);
    }

    /**
     * Get order status (public).
     */
    public function status(string $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        return response()->json([
            'order_id' => $order->_id,
            'status' => $order->status,
            'total' => $order->total,
            'created_at' => $order->created_at,
            'confirmed_at' => $order->confirmed_at,
        ]);
    }

    /**
     * List all orders with filters (admin).
     */
    public function index(Request $request): JsonResponse
        {
            try {
                $query = Order::query();

                if ($request->has('status')) {
                    $query->where('status', $request->input('status'));
                }

                if ($request->has('source')) {
                    $query->where('source', $request->input('source'));
                }

                if ($request->has('type')) {
                    $query->where('type', $request->input('type'));
                }

                if ($request->has('channel')) {
                    $query->where('channel', $request->input('channel'));
                }

                if ($request->has('customer_id')) {
                    $query->where('customer_id', $request->input('customer_id'));
                }

                if ($request->filled('customer_name')) {
                    $name = $request->input('customer_name');
                    $query->where('customer.name', 'like', '%' . $name . '%');
                }

                if ($request->has('from')) {
                    $query->where('created_at', '>=', Carbon::parse($request->input('from')));
                }

                if ($request->has('to')) {
                    $query->where('created_at', '<=', Carbon::parse($request->input('to')));
                }

                $orders = $query->orderBy('created_at', 'desc')
                    ->paginate($request->input('per_page', 20));

                return response()->json($orders);
            } catch (\Throwable $e) {
                return $this->error($e->getMessage(), 500);
            }
        }

    /**
     * Show order detail (admin).
     */
    public function show(string $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $customer = null;
        if ($order->customer_id) {
            $customer = Customer::find($order->customer_id);
        }

        return response()->json([
            'data' => [
                'order' => $order,
                'customer' => $customer ? ['_id' => $customer->_id, 'name' => $customer->name, 'phone' => $customer->phone] : null,
            ],
        ]);
    }

    /**
     * Update order status (admin).
     * Triggers WhatsApp notification if order source is 'whatsapp'.
     */
    public function update(UpdateOrderRequest $request, string $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validated();

        $previousStatus = $order->status;

        if ($validated['status'] === 'confirmed' && $order->status !== 'confirmed') {
            $validated['confirmed_at'] = now();
        }

        $order->update($validated);

        // Send WhatsApp notification if status changed
        if ($previousStatus !== $validated['status']) {
            $this->notifyWhatsAppStatusChange($order->fresh());

            // Broadcast order updated event for KDS real-time updates
            try {
                event(new OrderUpdated($order->fresh(), $previousStatus));
            } catch (\Throwable $e) {
                Log::warning('OrderController: Failed to broadcast OrderUpdated event', [
                    'order_id' => (string) $order->_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Order updated',
            'data' => $order,
        ]);
    }

    /**
     * Dashboard KPIs (admin).
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $cacheKey = 'dashboard:' . md5($request->input('from', '') . ':' . $request->input('to', ''));

            $data = Cache::remember($cacheKey, 300, function () use ($request) {
                return $this->buildDashboardData($request);
            });

            return response()->json($data);
        } catch (\Throwable $e) {
            return response()->json([
                'sales_today' => 0, 'sales_week' => 0, 'sales_month' => 0,
                'orders_today' => 0, 'orders_week' => 0, 'orders_month' => 0,
                'new_customers_week' => 0, 'total_customers' => 0,
                'top_items' => [], 'sales_by_category' => [],
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build dashboard data (extracted for caching).
     */
    private function buildDashboardData(Request $request): array
    {
            // Date range from filters (optional)
            $hasFilter = $request->has('from') || $request->has('to');
            if ($hasFilter) {
                $from = $request->has('from') ? Carbon::parse($request->input('from'))->startOfDay() : Carbon::now()->startOfMonth();
                $to = $request->has('to') ? Carbon::parse($request->input('to'))->endOfDay() : Carbon::now()->endOfDay();
            } else {
                $from = Carbon::now()->startOfMonth();
                $to = Carbon::now()->endOfDay();
            }

            $fromMongo = new \MongoDB\BSON\UTCDateTime($from->getTimestamp() * 1000);
            $toMongo = new \MongoDB\BSON\UTCDateTime($to->getTimestamp() * 1000);

            // Orders in range
            $rangeOrders = Order::whereBetween('created_at', [$from, $to])->get();
            $rangeRevenue = $rangeOrders->sum('total');
            $rangeCount = $rangeOrders->count();

            // Today stats (always current day)
            $today = Carbon::today();
            $todayOrders = Order::where('created_at', '>=', $today)->get();
            $todayRevenue = $todayOrders->sum('total');

            // Fallback: last day with sales if today is 0
            $lastDayLabel = null;
            if ($todayRevenue == 0) {
                $lastOrder = Order::where('total', '>', 0)->orderBy('created_at', 'desc')->first();
                if ($lastOrder) {
                    $lastDate = Carbon::parse($lastOrder->created_at);
                    $lastDayStart = $lastDate->copy()->startOfDay();
                    $lastDayEnd = $lastDate->copy()->endOfDay();
                    $lastDayOrders = Order::whereBetween('created_at', [$lastDayStart, $lastDayEnd])->get();
                    $todayRevenue = $lastDayOrders->sum('total');
                    $todayOrders = $lastDayOrders;
                    $lastDayLabel = $lastDate->format('d/m');
                }
            }

            $weekOrders = Order::where('created_at', '>=', Carbon::now()->startOfWeek())->get();
            $totalCustomers = \App\Models\Customer::count();
            $newCustomers = \App\Models\Customer::where('created_at', '>=', Carbon::now()->subDays(60))->count();

            // Top Items from product_sales (filtered by date range)
            $topItemsArray = [];
            $topItemsFallback = false;
            try {
                $db = DB::connection('mongodb')->getMongoDB();
                $psCollection = $db->selectCollection('product_sales');
                $psCursor = $psCollection->aggregate([
                    ['$match' => ['date' => ['$gte' => $fromMongo, '$lte' => $toMongo]]],
                    ['$group' => ['_id' => '$product_name', 'quantity' => ['$sum' => '$quantity'], 'revenue' => ['$sum' => '$revenue']]],
                    ['$sort' => ['quantity' => -1]],
                    ['$limit' => 15],
                ]);
                foreach ($psCursor as $doc) {
                    $topItemsArray[] = ['name' => $doc['_id'] ?? '', 'quantity' => intval($doc['quantity'] ?? 0), 'revenue' => floatval($doc['revenue'] ?? 0)];
                }
            } catch (\Throwable $e) { /* product_sales may not exist */ }

            // Fallback to POS items
            if (empty($topItemsArray)) {
                $topItems = Order::raw(function ($collection) use ($fromMongo, $toMongo) {
                    return $collection->aggregate([
                        ['$match' => ['created_at' => ['$gte' => $fromMongo, '$lte' => $toMongo]]],
                        ['$unwind' => '$items'],
                        ['$match' => ['items.name' => ['$not' => new \MongoDB\BSON\Regex('^Venta #', 'i')]]],
                        ['$group' => ['_id' => '$items.name', 'quantity' => ['$sum' => '$items.quantity'], 'revenue' => ['$sum' => '$items.line_total']]],
                        ['$sort' => ['quantity' => -1]],
                        ['$limit' => 10],
                    ]);
                });
                $topItemsArray = collect(iterator_to_array($topItems))->map(fn($item) => [
                    'name' => $item->_id ?? $item['_id'] ?? '',
                    'quantity' => intval($item->quantity ?? $item['quantity'] ?? 0),
                    'revenue' => floatval($item->revenue ?? $item['revenue'] ?? 0),
                ])->values()->all();
            }

            if (empty($topItemsArray)) {
                $topItemsFallback = true;
                $topItemsArray = MenuItem::where('available', true)->orderBy('sort_order')->limit(10)->get()
                    ->map(fn($item) => ['name' => $item->name, 'quantity' => 0, 'revenue' => 0])->all();
            }

            // Sales by category (filtered)
            $salesByCategory = [];
            try {
                $catCursor = $psCollection->aggregate([
                    ['$match' => ['date' => ['$gte' => $fromMongo, '$lte' => $toMongo]]],
                    ['$group' => ['_id' => '$category', 'quantity' => ['$sum' => '$quantity'], 'revenue' => ['$sum' => '$revenue']]],
                    ['$sort' => ['revenue' => -1]],
                ]);
                foreach ($catCursor as $doc) {
                    $salesByCategory[] = ['category' => $doc['_id'] ?? 'Otros', 'quantity' => intval($doc['quantity'] ?? 0), 'revenue' => floatval($doc['revenue'] ?? 0)];
                }
            } catch (\Throwable $e) { /* ignore */ }

            return [
                'sales_today' => $todayRevenue,
                'sales_week' => $weekOrders->sum('total'),
                'sales_month' => $rangeRevenue,
                'orders_today' => $todayOrders->count(),
                'orders_week' => $weekOrders->count(),
                'orders_month' => $rangeCount,
                'new_customers_week' => $newCustomers,
                'total_customers' => $totalCustomers,
                'top_items' => $topItemsArray,
                'sales_by_category' => $salesByCategory,
                'top_items_fallback' => $topItemsFallback,
                'top_items_note' => $topItemsFallback ? 'Sin datos de productos — basado en menú' : null,
                'last_day_label' => $lastDayLabel,
                'filter_label' => $hasFilter ? $from->format('d/m/Y') . ' - ' . Carbon::parse($request->input('to'))->format('d/m/Y') : null,
            ];
    }

    /**
     * Get kitchen orders (admin/KDS).
     * Returns only orders with status "confirmed" or "preparing",
     * sorted by created_at ascending (oldest first).
     */
    public function kitchen(): JsonResponse
    {
        $orders = Order::whereIn('status', ['confirmed', 'preparing'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }


    /**
     * Send WhatsApp notification when order status changes.
     * Only sends if the order has an associated customer with a whatsapp_id.
     */
    private function notifyWhatsAppStatusChange(Order $order): void
    {
        try {
            $customer = Customer::find($order->customer_id);

            if (!$customer) {
                return;
            }

            // Determine the WhatsApp number to send to
            $whatsappNumber = $customer->whatsapp_id ?? null;

            // If no whatsapp_id but order source is whatsapp, try phone
            if (!$whatsappNumber && $order->source === 'whatsapp') {
                $whatsappNumber = $customer->phone;
            }

            if (!$whatsappNumber) {
                return;
            }

            $whatsapp = new WhatsAppService();
            $whatsapp->sendOrderStatusUpdate($whatsappNumber, $order);

            Log::info('OrderController: WhatsApp status notification sent', [
                'order_id' => (string) $order->_id,
                'status' => $order->status,
                'to' => $whatsappNumber,
            ]);
        } catch (\Throwable $e) {
            // Don't fail the status update if WhatsApp notification fails
            Log::error('OrderController: Failed to send WhatsApp notification', [
                'order_id' => (string) $order->_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Update customer tier based on order count.
     */
    private function updateCustomerTier(Customer $customer): void
    {
        $tier = match (true) {
            $customer->total_orders >= 20 => 'vip',
            $customer->total_orders >= 10 => 'gold',
            $customer->total_orders >= 5 => 'regular',
            $customer->total_orders >= 1 => 'new',
            default => 'lead',
        };

        if ($customer->tier !== $tier) {
            $customer->update(['tier' => $tier]);
        }
    }
}

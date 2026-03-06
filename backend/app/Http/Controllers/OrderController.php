<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Events\OrderUpdated;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Services\InventoryService;
use App\Services\POSService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Create a new order (public).
     * Also creates or updates the customer record.
     */
    public function store(Request $request): JsonResponse
    {
        // Accept both flat format (customer_name) and nested format (customer.name)
        $hasNested = $request->has('customer');

        $rules = [
            'items' => 'required|array|min:1',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.modifiers' => 'nullable|array',
            'items.*.notes' => 'nullable|string',
            'notes' => 'nullable|string',
            'delivery_address' => 'nullable|string',
            'source' => 'nullable|string|in:web,whatsapp,facebook,phone',
            'send_to_fudo' => 'nullable|boolean',
        ];

        if ($hasNested) {
            $rules['customer.name'] = 'required|string|max:255';
            $rules['customer.phone'] = 'required|string|max:50';
            $rules['customer.email'] = 'nullable|email';
            $rules['customer.address'] = 'nullable|string';
            $rules['items.*.menu_item_id'] = 'required|string';
            $rules['items.*.name'] = 'nullable|string';
            $rules['items.*.price'] = 'nullable|numeric';
        } else {
            $rules['customer_name'] = 'required|string|max:255';
            $rules['customer_phone'] = 'required|string|max:50';
            $rules['customer_email'] = 'nullable|email';
            $rules['items.*.menu_item_id'] = 'required|string';
        }

        $validated = $request->validate($rules);

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
            $query = Order::query();

            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->has('source')) {
                $query->where('source', $request->input('source'));
            }

            if ($request->has('customer_id')) {
                $query->where('customer_id', $request->input('customer_id'));
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
        }

    /**
     * Update order status (admin).
     * Triggers WhatsApp notification if order source is 'whatsapp'.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,preparing,ready,delivered,cancelled',
            'fudo_order_id' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

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
    public function dashboard(): JsonResponse
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        $todayOrders = Order::where('created_at', '>=', $today)->get();
        $monthOrders = Order::where('created_at', '>=', $startOfMonth)->get();

        $todayRevenue = $todayOrders->sum('total');
        $monthRevenue = $monthOrders->sum('total');

        $pendingOrders = Order::where('status', 'pending')->count();
        $totalCustomers = Customer::count();

        $ordersByStatus = Order::raw(function ($collection) {
            return $collection->aggregate([
                ['$group' => ['_id' => '$status', 'count' => ['$sum' => 1]]],
            ]);
        });

        $topItems = Order::raw(function ($collection) use ($startOfMonth) {
            return $collection->aggregate([
                ['$match' => ['created_at' => ['$gte' => new \MongoDB\BSON\UTCDateTime($startOfMonth->getTimestamp() * 1000)]]],
                ['$unwind' => '$items'],
                ['$group' => ['_id' => '$items.name', 'quantity' => ['$sum' => '$items.quantity'], 'revenue' => ['$sum' => '$items.line_total']]],
                ['$sort' => ['quantity' => -1]],
                ['$limit' => 10],
            ]);
        });

        $revenueBySource = Order::raw(function ($collection) use ($startOfMonth) {
            return $collection->aggregate([
                ['$match' => ['created_at' => ['$gte' => new \MongoDB\BSON\UTCDateTime($startOfMonth->getTimestamp() * 1000)]]],
                ['$group' => ['_id' => '$source', 'total' => ['$sum' => '$total'], 'count' => ['$sum' => 1]]],
            ]);
        });

        return response()->json([
            'today' => [
                'orders' => $todayOrders->count(),
                'revenue' => $todayRevenue,
            ],
            'month' => [
                'orders' => $monthOrders->count(),
                'revenue' => $monthRevenue,
            ],
            'pending_orders' => $pendingOrders,
            'total_customers' => $totalCustomers,
            'orders_by_status' => $ordersByStatus,
            'top_items' => $topItems,
            'revenue_by_source' => $revenueBySource,
        ]);
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

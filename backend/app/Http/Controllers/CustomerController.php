<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CustomerController extends Controller
{
    use ApiResponse;
    /**
     * List customers with pagination, search, filter by tier/source (admin).
     * Computes total_orders, total_spent, last_order_at, and predominant_order_type from orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($tier = $request->input('tier')) {
            $query->where('tier', $tier);
        }

        if ($source = $request->input('source')) {
            $query->where('source', $source);
        }

        $customers = $query->orderBy('total_spent', 'desc')
            ->paginate(min($request->input('per_page', 20), 100));

        // Compute metrics from orders for each customer
        $customerIds = collect($customers->items())->pluck('_id')->map(fn ($id) => (string) $id)->toArray();

        // Aggregate order metrics per customer in a single query
        $orderMetrics = Order::raw(function ($collection) use ($customerIds) {
            return $collection->aggregate([
                ['$match' => ['customer_id' => ['$in' => $customerIds]]],
                ['$group' => [
                    '_id' => '$customer_id',
                    'total_orders' => ['$sum' => 1],
                    'total_spent' => ['$sum' => ['$ifNull' => ['$total', 0]]],
                    'last_order_at' => ['$max' => '$created_at'],
                    'types' => ['$push' => '$type'],
                    'sources' => ['$push' => '$source'],
                    'channels' => ['$push' => '$channel'],
                ]],
            ]);
        });

        $metricsMap = [];
        foreach ($orderMetrics as $m) {
            $metricsMap[(string) $m->_id] = $m;
        }

        // Transform paginated results to include computed metrics
        $customers->getCollection()->transform(function ($customer) use ($metricsMap) {
            $id = (string) $customer->_id;
            $metrics = $metricsMap[$id] ?? null;

            if ($metrics) {
                $customer->total_orders = $metrics->total_orders;
                $customer->total_spent = $metrics->total_spent;
                $customer->last_order_at = $metrics->last_order_at;
                $customer->predominant_order_type = $this->computePredominantOrderType(
                    is_array($metrics->types) ? $metrics->types : iterator_to_array($metrics->types ?? []),
                    is_array($metrics->sources) ? $metrics->sources : iterator_to_array($metrics->sources ?? []),
                    is_array($metrics->channels) ? $metrics->channels : iterator_to_array($metrics->channels ?? [])
                );
            } else {
                $customer->total_orders = $customer->total_orders ?? 0;
                $customer->total_spent = $customer->total_spent ?? 0;
                $customer->predominant_order_type = null;
            }

            return $customer;
        });

        return response()->json($customers);
    }

    /**
     * Compute the predominant order type for a customer.
     * Maps order types/sources/channels to: local, delivery, app.
     *   - dine_in, takeout, counter, express, mostrador, salon → local
     *   - delivery → delivery
     *   - source web/whatsapp/facebook (non-pos) → app
     *   - channel mostrador/local/para llevar → local
     */
    private function computePredominantOrderType(array $types, array $sources, array $channels = []): ?string
    {
        $localTypes = ['dine_in', 'takeout', 'counter', 'express', 'mostrador', 'salon'];
        $appSources = ['web', 'whatsapp', 'facebook'];
        $localChannels = ['mostrador', 'local', 'para llevar', 'salon'];

        $counts = ['local' => 0, 'delivery' => 0, 'app' => 0];

        foreach ($types as $i => $type) {
            $source = $sources[$i] ?? 'pos';
            $channel = $channels[$i] ?? null;
            $typeLower = strtolower(trim($type ?? ''));
            $channelLower = strtolower(trim($channel ?? ''));

            if ($typeLower === 'delivery' || $channelLower === 'delivery') {
                $counts['delivery']++;
            } elseif (in_array($source, $appSources)) {
                $counts['app']++;
            } elseif (in_array($typeLower, $localTypes) || in_array($channelLower, $localChannels)) {
                $counts['local']++;
            } else {
                // Default: if type is set but not recognized, count as local
                $counts['local']++;
            }
        }

        $total = array_sum($counts);
        if ($total === 0) {
            return null;
        }

        // Return the type with the highest count
        arsort($counts);
        return array_key_first($counts);
    }

    /**
     * Customer detail with order history (admin).
     */
    public function show(string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $orders = Order::where('customer_id', (string) $customer->_id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        // Recompute order metrics from orders collection (not stale customer model fields)
        $orderMetrics = Order::raw(function ($collection) use ($customer) {
            return $collection->aggregate([
                ['$match' => ['customer_id' => (string) $customer->_id]],
                ['$group' => [
                    '_id' => null,
                    'total_orders' => ['$sum' => 1],
                    'total_spent' => ['$sum' => ['$ifNull' => ['$total', 0]]],
                    'last_order_at' => ['$max' => '$created_at'],
                ]],
            ]);
        });

        $metrics = collect($orderMetrics)->first();
        $totalOrders = $metrics->total_orders ?? 0;
        $totalSpent = $metrics->total_spent ?? 0;
        $lastOrderAt = $metrics->last_order_at ?? $customer->last_order_at;

        // Top 5 products: aggregate from order items, filtering out Fudo "Venta #..." placeholders
        $topProductsRaw = Order::raw(function ($collection) use ($customer) {
            return $collection->aggregate([
                ['$match' => ['customer_id' => (string) $customer->_id]],
                ['$unwind' => '$items'],
                ['$match' => ['items.name' => ['$not' => new \MongoDB\BSON\Regex('^Venta #', 'i')]]],
                ['$group' => [
                    '_id' => '$items.name',
                    'quantity' => ['$sum' => '$items.quantity'],
                    'total_spent' => ['$sum' => '$items.line_total'],
                ]],
                ['$sort' => ['quantity' => -1]],
                ['$limit' => 5],
            ]);
        });

        $topProducts = collect(iterator_to_array($topProductsRaw))->map(function ($item) {
            return [
                'name' => $item->_id ?? $item['_id'] ?? '',
                'quantity' => $item->quantity ?? $item['quantity'] ?? 0,
                'total_spent' => $item->total_spent ?? $item['total_spent'] ?? 0,
            ];
        })->values()->all();

        return response()->json([
            'data' => [
                'customer' => $customer,
                'orders' => $orders,
                '_id' => $customer->_id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'address' => $customer->address,
                'tier' => $customer->tier,
                'source' => $customer->source,
                'total_orders' => $totalOrders,
                'total_spent' => $totalSpent,
                'ai_profile' => $customer->ai_profile,
                'preferences' => $customer->preferences,
                'last_order_at' => $lastOrderAt,
                'top_products' => $topProducts,
            ],
        ]);
    }

    /**
     * Update customer info (admin).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:50',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'tier' => 'sometimes|string|in:lead,new,regular,gold,vip',
            'preferences' => 'nullable|array',
            'ai_profile' => 'nullable|array',
        ]);

        $customer->update($validated);

        return response()->json([
            'message' => 'Customer updated',
            'data' => $customer,
        ]);
    }

    /**
     * List leads grouped by source (admin).
     */
    public function leads(): JsonResponse
    {
        $leads = Customer::raw(function ($collection) {
            return $collection->aggregate([
                ['$group' => [
                    '_id' => '$source',
                    'total' => ['$sum' => 1],
                    'leads' => ['$sum' => ['$cond' => [['$eq' => ['$tier', 'lead']], 1, 0]]],
                    'new_customers' => ['$sum' => ['$cond' => [['$eq' => ['$tier', 'new']], 1, 0]]],
                    'regulars' => ['$sum' => ['$cond' => [['$eq' => ['$tier', 'regular']], 1, 0]]],
                    'gold' => ['$sum' => ['$cond' => [['$eq' => ['$tier', 'gold']], 1, 0]]],
                    'vip' => ['$sum' => ['$cond' => [['$eq' => ['$tier', 'vip']], 1, 0]]],
                    'total_revenue' => ['$sum' => '$total_spent'],
                ]],
                ['$sort' => ['total' => -1]],
            ]);
        });

        $totalLeads = Customer::where('tier', 'lead')->count();
        $totalCustomers = Customer::count();

        return response()->json([
            'by_source' => $leads,
            'total_leads' => $totalLeads,
            'total_customers' => $totalCustomers,
        ]);
    }
}

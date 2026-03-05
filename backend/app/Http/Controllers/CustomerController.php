<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CustomerController extends Controller
{
    /**
     * List customers with pagination, search, filter by tier/source (admin).
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
            ->paginate($request->input('per_page', 20));

        return response()->json($customers);
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
                'total_orders' => $customer->total_orders,
                'total_spent' => $customer->total_spent,
                'ai_profile' => $customer->ai_profile,
                'preferences' => $customer->preferences,
                'last_order_at' => $customer->last_order_at,
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

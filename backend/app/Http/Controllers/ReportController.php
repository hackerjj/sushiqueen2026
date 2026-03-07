<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * GET /admin/reports/sales
     * Sales report with complete metrics.
     */
    public function salesReport(Request $request): JsonResponse
    {
        try {
            [$startDate, $endDate] = $this->parsePeriod($request);

            $startUtc = new \MongoDB\BSON\UTCDateTime($startDate->getTimestamp() * 1000);
            $endUtc = new \MongoDB\BSON\UTCDateTime($endDate->getTimestamp() * 1000);

            $matchStage = [
                '$match' => [
                    'created_at' => ['$gte' => $startUtc, '$lte' => $endUtc],
                    'status' => ['$nin' => ['cancelled']],
                ],
            ];

            // Total orders & revenue
            $totals = Order::raw(function ($collection) use ($matchStage) {
                return $collection->aggregate([
                    $matchStage,
                    ['$group' => [
                        '_id' => null,
                        'total_orders' => ['$sum' => 1],
                        'total_revenue' => ['$sum' => '$total'],
                    ]],
                ]);
            });

            $totalsData = $totals->first();
            $totalOrders = $totalsData->total_orders ?? 0;
            $totalRevenue = $totalsData->total_revenue ?? 0;
            $avgTicket = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

            // Best customer
            $bestCustomerAgg = Order::raw(function ($collection) use ($matchStage) {
                return $collection->aggregate([
                    $matchStage,
                    ['$match' => ['customer_id' => ['$ne' => null]]],
                    ['$group' => [
                        '_id' => '$customer_id',
                        'total_spent' => ['$sum' => '$total'],
                        'order_count' => ['$sum' => 1],
                    ]],
                    ['$sort' => ['total_spent' => -1]],
                    ['$limit' => 1],
                ]);
            });

            $bestCustomer = null;
            $bestCustData = $bestCustomerAgg->first();
            if ($bestCustData) {
                $customer = Customer::find($bestCustData->_id);
                $bestCustomer = [
                    'name' => $customer->name ?? 'Desconocido',
                    'total_spent' => $bestCustData->total_spent,
                    'order_count' => $bestCustData->order_count,
                ];
            }

            // Best & worst products
            $productAgg = Order::raw(function ($collection) use ($matchStage) {
                return $collection->aggregate([
                    $matchStage,
                    ['$unwind' => '$items'],
                    ['$group' => [
                        '_id' => '$items.name',
                        'quantity' => ['$sum' => '$items.quantity'],
                        'revenue' => ['$sum' => ['$multiply' => ['$items.price', '$items.quantity']]],
                    ]],
                    ['$sort' => ['quantity' => -1]],
                ]);
            });

            $allProducts = $productAgg->values()->toArray();
            $topProducts = array_slice($allProducts, 0, 10);
            $lowProducts = array_reverse(array_slice($allProducts, -10));

            $bestProduct = !empty($topProducts) ? [
                'name' => $topProducts[0]['_id'],
                'quantity' => $topProducts[0]['quantity'],
                'revenue' => $topProducts[0]['revenue'],
            ] : null;

            $worstProduct = !empty($lowProducts) ? [
                'name' => $lowProducts[0]['_id'],
                'quantity' => $lowProducts[0]['quantity'],
            ] : null;

            // Best promotion
            $bestPromotion = null;
            $promo = Promotion::orderBy('usage_count', 'desc')->first();
            if ($promo && $promo->usage_count > 0) {
                $bestPromotion = [
                    'title' => $promo->title,
                    'usage_count' => $promo->usage_count,
                    'discount_type' => $promo->discount_type,
                ];
            }

            // Sales by day
            $salesByDay = Order::raw(function ($collection) use ($matchStage) {
                return $collection->aggregate([
                    $matchStage,
                    ['$group' => [
                        '_id' => ['$dateToString' => ['format' => '%Y-%m-%d', 'date' => '$created_at']],
                        'total' => ['$sum' => '$total'],
                        'orders' => ['$sum' => 1],
                    ]],
                    ['$sort' => ['_id' => 1]],
                ]);
            });

            // Sales by source (channel)
            $salesBySource = Order::raw(function ($collection) use ($matchStage) {
                return $collection->aggregate([
                    $matchStage,
                    ['$group' => [
                        '_id' => '$source',
                        'total' => ['$sum' => '$total'],
                        'orders' => ['$sum' => 1],
                    ]],
                    ['$sort' => ['total' => -1]],
                ]);
            });

            // Sales by type (service type)
            $salesByType = Order::raw(function ($collection) use ($matchStage) {
                return $collection->aggregate([
                    $matchStage,
                    ['$group' => [
                        '_id' => '$type',
                        'total' => ['$sum' => '$total'],
                        'orders' => ['$sum' => 1],
                    ]],
                    ['$sort' => ['total' => -1]],
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_orders' => $totalOrders,
                    'total_revenue' => $totalRevenue,
                    'avg_ticket' => $avgTicket,
                    'best_customer' => $bestCustomer,
                    'best_product' => $bestProduct,
                    'worst_product' => $worstProduct,
                    'best_promotion' => $bestPromotion,
                    'sales_by_day' => $salesByDay->map(fn($d) => [
                        'date' => $d->_id,
                        'total' => $d->total,
                        'orders' => $d->orders,
                    ])->values(),
                    'sales_by_source' => $salesBySource->map(fn($s) => [
                        'source' => $s->_id ?? 'unknown',
                        'total' => $s->total,
                        'orders' => $s->orders,
                    ])->values(),
                    'sales_by_type' => $salesByType->map(fn($t) => [
                        'type' => $t->_id ?? 'unknown',
                        'total' => $t->total,
                        'orders' => $t->orders,
                    ])->values(),
                    'top_products' => array_map(fn($p) => [
                        'name' => $p['_id'],
                        'quantity' => $p['quantity'],
                        'revenue' => $p['revenue'],
                    ], $topProducts),
                    'low_products' => array_map(fn($p) => [
                        'name' => $p['_id'],
                        'quantity' => $p['quantity'],
                        'revenue' => $p['revenue'],
                    ], $lowProducts),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate sales report',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }

    /**
     * GET /admin/reports/customers
     * Customer report with order metrics.
     */
    public function customerReport(Request $request): JsonResponse
    {
        try {
            [$startDate, $endDate] = $this->parsePeriod($request);

            $startUtc = new \MongoDB\BSON\UTCDateTime($startDate->getTimestamp() * 1000);
            $endUtc = new \MongoDB\BSON\UTCDateTime($endDate->getTimestamp() * 1000);

            $customerAgg = Order::raw(function ($collection) use ($startUtc, $endUtc) {
                return $collection->aggregate([
                    ['$match' => [
                        'created_at' => ['$gte' => $startUtc, '$lte' => $endUtc],
                        'status' => ['$nin' => ['cancelled']],
                        'customer_id' => ['$ne' => null],
                    ]],
                    ['$group' => [
                        '_id' => '$customer_id',
                        'total_spent' => ['$sum' => '$total'],
                        'total_orders' => ['$sum' => 1],
                        'last_order_at' => ['$max' => '$created_at'],
                        'sources' => ['$push' => '$source'],
                    ]],
                    ['$sort' => ['total_spent' => -1]],
                    ['$limit' => 50],
                ]);
            });

            $customers = $customerAgg->map(function ($agg) {
                $customer = Customer::find($agg->_id);
                $sources = is_array($agg->sources) ? $agg->sources : [];
                $sourceCounts = array_count_values(array_filter($sources));
                $predominantSource = !empty($sourceCounts) ? array_keys($sourceCounts, max($sourceCounts))[0] : 'unknown';

                return [
                    'customer_id' => (string) $agg->_id,
                    'name' => $customer->name ?? 'Desconocido',
                    'phone' => $customer->phone ?? '',
                    'total_spent' => $agg->total_spent,
                    'total_orders' => $agg->total_orders,
                    'last_order_at' => $agg->last_order_at,
                    'predominant_source' => $predominantSource,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => $customers,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate customer report',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }

    /**
     * GET /admin/reports/products
     * Product report: most and least sold products.
     */
    public function productReport(Request $request): JsonResponse
    {
        try {
            [$startDate, $endDate] = $this->parsePeriod($request);

            $startUtc = new \MongoDB\BSON\UTCDateTime($startDate->getTimestamp() * 1000);
            $endUtc = new \MongoDB\BSON\UTCDateTime($endDate->getTimestamp() * 1000);

            $productAgg = Order::raw(function ($collection) use ($startUtc, $endUtc) {
                return $collection->aggregate([
                    ['$match' => [
                        'created_at' => ['$gte' => $startUtc, '$lte' => $endUtc],
                        'status' => ['$nin' => ['cancelled']],
                    ]],
                    ['$unwind' => '$items'],
                    ['$group' => [
                        '_id' => '$items.name',
                        'quantity' => ['$sum' => '$items.quantity'],
                        'revenue' => ['$sum' => ['$multiply' => ['$items.price', '$items.quantity']]],
                    ]],
                    ['$sort' => ['quantity' => -1]],
                ]);
            });

            $allProducts = $productAgg->values()->toArray();

            $topProducts = array_slice($allProducts, 0, 10);
            $lowProducts = array_reverse(array_slice($allProducts, -10));

            $formatProducts = fn($products) => array_map(fn($p) => [
                'name' => $p['_id'],
                'quantity' => $p['quantity'],
                'revenue' => $p['revenue'],
            ], $products);

            return response()->json([
                'success' => true,
                'data' => [
                    'top_products' => $formatProducts($topProducts),
                    'low_products' => $formatProducts($lowProducts),
                    'total_products' => count($allProducts),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate product report',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }

    /**
     * GET /admin/reports/revenue
     * Revenue report: sales - expenses for the selected period.
     */
    public function revenueReport(Request $request): JsonResponse
    {
        try {
            [$startDate, $endDate] = $this->parsePeriod($request);

            $startUtc = new \MongoDB\BSON\UTCDateTime($startDate->getTimestamp() * 1000);
            $endUtc = new \MongoDB\BSON\UTCDateTime($endDate->getTimestamp() * 1000);

            // Total sales (excluding cancelled orders)
            $salesAgg = Order::raw(function ($collection) use ($startUtc, $endUtc) {
                return $collection->aggregate([
                    ['$match' => [
                        'created_at' => ['$gte' => $startUtc, '$lte' => $endUtc],
                        'status' => ['$nin' => ['cancelled']],
                    ]],
                    ['$group' => [
                        '_id' => null,
                        'total' => ['$sum' => '$total'],
                    ]],
                ]);
            });
            $totalSales = $salesAgg->first()->total ?? 0;

            // Total expenses for the period
            $totalExpenses = Expense::where('date', '>=', $startDate->toDateString())
                ->where('date', '<=', $endDate->toDateString())
                ->sum('amount');

            $revenue = $totalSales - $totalExpenses;

            // Daily breakdown
            $days = $startDate->diffInDays($endDate);
            $breakdown = [];

            for ($i = 0; $i <= $days; $i++) {
                $date = $startDate->copy()->addDays($i);
                $dateStr = $date->toDateString();
                $dayStartUtc = new \MongoDB\BSON\UTCDateTime($date->copy()->startOfDay()->getTimestamp() * 1000);
                $dayEndUtc = new \MongoDB\BSON\UTCDateTime($date->copy()->endOfDay()->getTimestamp() * 1000);

                $daySalesAgg = Order::raw(function ($collection) use ($dayStartUtc, $dayEndUtc) {
                    return $collection->aggregate([
                        ['$match' => [
                            'created_at' => ['$gte' => $dayStartUtc, '$lte' => $dayEndUtc],
                            'status' => ['$nin' => ['cancelled']],
                        ]],
                        ['$group' => [
                            '_id' => null,
                            'total' => ['$sum' => '$total'],
                        ]],
                    ]);
                });
                $daySales = $daySalesAgg->first()->total ?? 0;

                $dayExpenses = Expense::where('date', $dateStr)->sum('amount');

                $breakdown[] = [
                    'date' => $dateStr,
                    'sales' => round((float) $daySales, 2),
                    'expenses' => round((float) $dayExpenses, 2),
                    'revenue' => round((float) ($daySales - $dayExpenses), 2),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $request->query('period', 'month'),
                    'total_sales' => round((float) $totalSales, 2),
                    'total_expenses' => round((float) $totalExpenses, 2),
                    'revenue' => round((float) $revenue, 2),
                    'breakdown' => $breakdown,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate revenue report',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }


    /**
     * Parse period from request: today, week, month, year, or custom range.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function parsePeriod(Request $request): array
    {
        $period = $request->query('period', 'month');
        $endDate = Carbon::now()->endOfDay();

        if ($period === 'custom') {
            $startDate = $request->query('start_date')
                ? Carbon::parse($request->query('start_date'))->startOfDay()
                : Carbon::now()->startOfMonth();
            $endDate = $request->query('end_date')
                ? Carbon::parse($request->query('end_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            return [$startDate, $endDate];
        }

        $startDate = match ($period) {
            'today' => Carbon::today(),
            'week' => Carbon::now()->startOfWeek(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth(),
        };

        return [$startDate, $endDate];
    }

    /**
     * GET /admin/reports/product-sales
     * Product sales report from Fudo product_sales collection.
     */
    public function productSalesReport(Request $request): JsonResponse
    {
        try {
            [$startDate, $endDate] = $this->parsePeriod($request);
            $startUtc = new \MongoDB\BSON\UTCDateTime($startDate->getTimestamp() * 1000);
            $endUtc = new \MongoDB\BSON\UTCDateTime($endDate->getTimestamp() * 1000);

            // Top products
            $topProducts = DB::connection('mongodb')->collection('product_sales')
                ->raw(function ($collection) use ($startUtc, $endUtc) {
                    return $collection->aggregate([
                        ['$match' => ['date' => ['$gte' => $startUtc, '$lte' => $endUtc]]],
                        ['$group' => ['_id' => '$product_name', 'quantity' => ['$sum' => '$quantity'], 'revenue' => ['$sum' => '$revenue']]],
                        ['$sort' => ['quantity' => -1]],
                        ['$limit' => 20],
                    ]);
                });
            $topArr = collect(iterator_to_array($topProducts))->map(fn($i) => [
                'name' => $i->_id ?? $i['_id'] ?? '', 'quantity' => intval($i->quantity ?? $i['quantity'] ?? 0), 'revenue' => floatval($i->revenue ?? $i['revenue'] ?? 0),
            ])->values()->all();

            // Totals
            $totals = DB::connection('mongodb')->collection('product_sales')
                ->raw(function ($collection) use ($startUtc, $endUtc) {
                    return $collection->aggregate([
                        ['$match' => ['date' => ['$gte' => $startUtc, '$lte' => $endUtc]]],
                        ['$group' => ['_id' => null, 'total_qty' => ['$sum' => '$quantity'], 'total_rev' => ['$sum' => '$revenue']]],
                    ]);
                });
            $totalsData = collect(iterator_to_array($totals))->first();
            $totalQty = intval($totalsData->total_qty ?? $totalsData['total_qty'] ?? 0);
            $totalRev = floatval($totalsData->total_rev ?? $totalsData['total_rev'] ?? 0);

            // By category
            $byCategory = DB::connection('mongodb')->collection('product_sales')
                ->raw(function ($collection) use ($startUtc, $endUtc) {
                    return $collection->aggregate([
                        ['$match' => ['date' => ['$gte' => $startUtc, '$lte' => $endUtc]]],
                        ['$group' => ['_id' => '$category', 'quantity' => ['$sum' => '$quantity'], 'revenue' => ['$sum' => '$revenue']]],
                        ['$sort' => ['revenue' => -1]],
                    ]);
                });
            $catArr = collect(iterator_to_array($byCategory))->map(fn($i) => [
                'category' => $i->_id ?? $i['_id'] ?? 'Otros', 'quantity' => intval($i->quantity ?? $i['quantity'] ?? 0), 'revenue' => floatval($i->revenue ?? $i['revenue'] ?? 0),
            ])->values()->all();

            // Monthly evolution (last 12 months from end date)
            $evoStart = $endDate->copy()->subMonths(11)->startOfMonth();
            $evoStartUtc = new \MongoDB\BSON\UTCDateTime($evoStart->getTimestamp() * 1000);
            $evolution = DB::connection('mongodb')->collection('product_sales')
                ->raw(function ($collection) use ($evoStartUtc, $endUtc) {
                    return $collection->aggregate([
                        ['$match' => ['date' => ['$gte' => $evoStartUtc, '$lte' => $endUtc]]],
                        ['$group' => [
                            '_id' => ['year' => ['$year' => '$date'], 'month' => ['$month' => '$date']],
                            'quantity' => ['$sum' => '$quantity'], 'revenue' => ['$sum' => '$revenue'],
                        ]],
                        ['$sort' => ['_id.year' => 1, '_id.month' => 1]],
                    ]);
                });
            $evoArr = collect(iterator_to_array($evolution))->map(function ($i) {
                $id = (array)($i->_id ?? $i['_id']);
                $y = $id['year'] ?? 0; $m = $id['month'] ?? 0;
                return ['month' => sprintf('%04d-%02d', $y, $m), 'quantity' => intval($i->quantity ?? $i['quantity'] ?? 0), 'revenue' => floatval($i->revenue ?? $i['revenue'] ?? 0)];
            })->values()->all();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_quantity' => $totalQty,
                    'total_revenue' => $totalRev,
                    'top_products' => $topArr,
                    'by_category' => $catArr,
                    'evolution' => $evoArr,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

}

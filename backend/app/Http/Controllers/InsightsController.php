<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use App\Models\Order;
use App\Services\AnalyticsService;
use App\Services\CloudflareService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsightsController extends Controller
{
    use ApiResponse;

    private AnalyticsService $analyticsService;
    private CloudflareService $cloudflareService;

    public function __construct(AnalyticsService $analyticsService, CloudflareService $cloudflareService)
    {
        $this->analyticsService = $analyticsService;
        $this->cloudflareService = $cloudflareService;
    }

    /**
     * GET /api/admin/insights
     *
     * Returns aggregated analytics insights for the admin dashboard.
     * Accepts ?period=today|week|month|year (default: month)
     *
     * When Cloudflare is configured (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID),
     * real visit data replaces the estimated values.
     */
    public function index(Request $request): JsonResponse
    {
        $period = $request->query('period', 'month');

        $validPeriods = ['today', 'week', 'month', 'year'];
        if (!in_array($period, $validPeriods)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid period. Use: today, week, month, year',
            ], 422);
        }

        try {
            $insights = $this->analyticsService->getInsights($period);

            // Enrich with real Cloudflare visit data when configured
            if ($this->cloudflareService->isConfigured()) {
                $cfSince = $this->mapPeriodToCloudflare($period);
                $cfAnalytics = $this->cloudflareService->getAnalytics(null, $cfSince);

                if ($cfAnalytics['source'] === 'cloudflare') {
                    $insights['visits'] = [
                        'total'            => $cfAnalytics['visits'],
                        'unique_visitors'  => $cfAnalytics['unique_visitors'],
                        'bandwidth'        => $cfAnalytics['bandwidth'],
                        'threats_blocked'  => $cfAnalytics['threats_blocked'],
                        'total_requests'   => $cfAnalytics['total_requests'],
                        'source'           => 'cloudflare',
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $insights,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch insights',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }

    /**
     * GET /api/admin/insights/reviews
     *
     * Returns Google Maps reviews for the restaurant.
     * Placeholder endpoint — returns mock review data structure
     * until a Google Maps API key is configured.
     */
    public function reviews(Request $request): JsonResponse
    {
        try {
            $googlePlaceId = config('services.google.place_id', env('GOOGLE_PLACE_ID', ''));
            $googleApiKey = config('services.google.api_key', env('GOOGLE_MAPS_API_KEY', ''));

            // If Google Maps API is configured, fetch real reviews
            if (!empty($googlePlaceId) && !empty($googleApiKey)) {
                // TODO: Integrate with Google Places API when key is available
                // $reviews = $this->fetchGoogleReviews($googlePlaceId, $googleApiKey);
            }

            // Return placeholder review data structure
            $reviews = [
                'place_name' => 'Sushi Queen Orlando',
                'overall_rating' => 4.6,
                'total_reviews' => 127,
                'source' => 'placeholder',
                'reviews' => [
                    [
                        'author' => 'Maria G.',
                        'rating' => 5,
                        'text' => 'Best sushi in Orlando! The Dragon Roll is amazing and the service is always fast.',
                        'time' => now()->subDays(2)->toISOString(),
                        'relative_time' => 'hace 2 días',
                    ],
                    [
                        'author' => 'Carlos R.',
                        'rating' => 4,
                        'text' => 'Great food and good prices. The delivery was a bit slow but the quality makes up for it.',
                        'time' => now()->subDays(5)->toISOString(),
                        'relative_time' => 'hace 5 días',
                    ],
                    [
                        'author' => 'Jennifer L.',
                        'rating' => 5,
                        'text' => 'Love the Combo Familiar! Perfect for family dinners. Will definitely order again.',
                        'time' => now()->subDays(8)->toISOString(),
                        'relative_time' => 'hace 1 semana',
                    ],
                    [
                        'author' => 'David M.',
                        'rating' => 4,
                        'text' => 'Solid sushi place. The Philadelphia Roll is my go-to. Wish they had more vegetarian options.',
                        'time' => now()->subDays(12)->toISOString(),
                        'relative_time' => 'hace 2 semanas',
                    ],
                    [
                        'author' => 'Ana P.',
                        'rating' => 5,
                        'text' => 'Increíble! El mejor sushi de la zona. El Spicy Tuna Roll es espectacular.',
                        'time' => now()->subDays(15)->toISOString(),
                        'relative_time' => 'hace 2 semanas',
                    ],
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $reviews,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reviews',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }

    /**
     * GET /api/admin/insights/sales-trends
     *
     * Returns sales trend metrics aggregated from MongoDB.
     * Includes daily sales for last 30 days, top products this month,
     * and sales by channel.
     */
    public function salesTrends(Request $request): JsonResponse
    {
        try {
            $thirtyDaysAgo = Carbon::now()->subDays(30);
            $monthStart = Carbon::now()->startOfMonth();

            // Daily sales for last 30 days
            $dailySales = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $daySales = Order::whereDate('created_at', $date->toDateString())
                    ->whereNotIn('status', ['cancelled'])
                    ->sum('total');
                $dayOrders = Order::whereDate('created_at', $date->toDateString())
                    ->whereNotIn('status', ['cancelled'])
                    ->count();

                $dailySales[] = [
                    'date' => $date->toDateString(),
                    'label' => $date->format('M d'),
                    'sales' => round((float) $daySales, 2),
                    'orders' => $dayOrders,
                ];
            }

            // Top products this month
            $orders = Order::where('created_at', '>=', $monthStart)
                ->whereNotIn('status', ['cancelled'])
                ->get();

            $itemCounts = [];
            foreach ($orders as $order) {
                $items = $order->items ?? [];
                foreach ($items as $item) {
                    $name = $item['name'] ?? 'Unknown';
                    if (!isset($itemCounts[$name])) {
                        $itemCounts[$name] = ['name' => $name, 'quantity' => 0, 'revenue' => 0];
                    }
                    $itemCounts[$name]['quantity'] += $item['quantity'] ?? 1;
                    $itemCounts[$name]['revenue'] += ($item['price'] ?? 0) * ($item['quantity'] ?? 1);
                }
            }
            usort($itemCounts, fn($a, $b) => $b['quantity'] - $a['quantity']);
            $topProducts = array_slice($itemCounts, 0, 5);

            // Sales by channel/source
            $sources = ['tables', 'counter', 'delivery', 'express', 'web', 'whatsapp'];
            $salesByChannel = [];
            foreach ($sources as $source) {
                $channelOrders = Order::where('created_at', '>=', $monthStart)
                    ->where('source', $source)
                    ->whereNotIn('status', ['cancelled']);

                $total = round((float) $channelOrders->sum('total'), 2);
                $count = $channelOrders->count();

                if ($count > 0) {
                    $salesByChannel[] = [
                        'channel' => $source,
                        'total' => $total,
                        'orders' => $count,
                    ];
                }
            }

            // Summary metrics
            $totalSalesMonth = Order::where('created_at', '>=', $monthStart)
                ->whereNotIn('status', ['cancelled'])
                ->sum('total');
            $totalOrdersMonth = Order::where('created_at', '>=', $monthStart)
                ->whereNotIn('status', ['cancelled'])
                ->count();
            $avgTicket = $totalOrdersMonth > 0 ? round((float) $totalSalesMonth / $totalOrdersMonth, 2) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'daily_sales' => $dailySales,
                    'top_products' => $topProducts,
                    'sales_by_channel' => $salesByChannel,
                    'summary' => [
                        'total_sales_month' => round((float) $totalSalesMonth, 2),
                        'total_orders_month' => $totalOrdersMonth,
                        'avg_ticket' => $avgTicket,
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sales trends',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }

    /**
     * POST /api/admin/insights/track
     *
     * Track a custom analytics event from the frontend.
     */
    public function track(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event' => 'required|string|max:100',
            'data' => 'nullable|array',
        ]);

        $this->analyticsService->trackEvent(
            $validated['event'],
            $validated['data'] ?? []
        );

        return response()->json([
            'success' => true,
            'message' => 'Event tracked',
        ]);
    }

    /**
     * Map insight period to Cloudflare relative date format.
     */
    private function mapPeriodToCloudflare(string $period): string
    {
        return match ($period) {
            'today' => '-1d',
            'week'  => '-7d',
            'month' => '-30d',
            'year'  => '-12m',
            default => '-30d',
        };
    }
}

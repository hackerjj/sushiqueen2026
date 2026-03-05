<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AnalyticsService
{
    // ─── Event Tracking ──────────────────────────────────────────────

    /**
     * Log an analytics event for internal tracking.
     *
     * @param string $event  Event name (e.g., 'purchase', 'page_view', 'add_to_cart')
     * @param array  $data   Event data payload
     */
    public function trackEvent(string $event, array $data = []): void
    {
        Log::channel('analytics')->info($event, array_merge($data, [
            'timestamp' => now()->toISOString(),
            'event' => $event,
        ]));
    }

    // ─── Insights Aggregation ────────────────────────────────────────

    /**
     * Get aggregated insights data for a given period.
     *
     * @param string $period  'today', 'week', 'month', 'year'
     * @return array
     */
    public function getInsights(string $period = 'month'): array
    {
        $startDate = $this->getStartDate($period);
        $endDate = now();

        return [
            'period' => $period,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'visits' => $this->getVisits($period),
            'conversions' => $this->getConversions($startDate, $endDate),
            'revenue' => $this->getRevenue($startDate, $endDate),
            'revenue_by_source' => $this->getRevenueBySource($startDate, $endDate),
            'top_referrers' => $this->getTopReferrers($startDate, $endDate),
            'customer_acquisition' => $this->getCustomerAcquisition($startDate, $endDate),
            'orders_by_status' => $this->getOrdersByStatus($startDate, $endDate),
            'avg_order_value' => $this->getAvgOrderValue($startDate, $endDate),
            'top_items' => $this->getTopItems($startDate, $endDate),
        ];
    }

    // ─── Private Helpers ─────────────────────────────────────────────

    private function getStartDate(string $period): Carbon
    {
        return match ($period) {
            'today' => Carbon::today(),
            'week' => Carbon::now()->subWeek(),
            'month' => Carbon::now()->subMonth(),
            'year' => Carbon::now()->subYear(),
            default => Carbon::now()->subMonth(),
        };
    }

    /**
     * Total visits — placeholder for Cloudflare Analytics API integration.
     * Returns estimated visits based on order count * multiplier.
     */
    private function getVisits(string $period): array
    {
        // TODO: Integrate with Cloudflare Analytics API using CLOUDFLARE_API_TOKEN
        // For now, estimate based on order volume
        $startDate = $this->getStartDate($period);
        $orderCount = Order::where('created_at', '>=', $startDate)->count();
        $estimatedVisits = $orderCount * 15; // ~6.7% conversion rate estimate

        return [
            'total' => $estimatedVisits,
            'source' => 'estimated',
            'note' => 'Connect Cloudflare Analytics API for real visit data',
        ];
    }

    /**
     * Conversions = orders created in the period.
     */
    private function getConversions(Carbon $start, Carbon $end): array
    {
        $total = Order::where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->count();

        $completed = Order::where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->where('status', 'delivered')
            ->count();

        $cancelled = Order::where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->where('status', 'cancelled')
            ->count();

        return [
            'total_orders' => $total,
            'completed' => $completed,
            'cancelled' => $cancelled,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
        ];
    }

    /**
     * Total revenue in the period.
     */
    private function getRevenue(Carbon $start, Carbon $end): array
    {
        $orders = Order::where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->whereNotIn('status', ['cancelled']);

        return [
            'total' => round($orders->sum('total'), 2),
            'subtotal' => round($orders->sum('subtotal'), 2),
            'tax' => round($orders->sum('tax'), 2),
            'order_count' => $orders->count(),
        ];
    }

    /**
     * Revenue broken down by order source (web, whatsapp, facebook).
     */
    private function getRevenueBySource(Carbon $start, Carbon $end): array
    {
        $sources = ['web', 'whatsapp', 'facebook'];
        $result = [];

        foreach ($sources as $source) {
            $orders = Order::where('created_at', '>=', $start)
                ->where('created_at', '<=', $end)
                ->where('source', $source)
                ->whereNotIn('status', ['cancelled']);

            $result[] = [
                'source' => $source,
                'revenue' => round($orders->sum('total'), 2),
                'orders' => $orders->count(),
            ];
        }

        return $result;
    }

    /**
     * Top referrers — based on order source distribution.
     * For detailed referrer data, integrate with Cloudflare/GA API.
     */
    private function getTopReferrers(Carbon $start, Carbon $end): array
    {
        $sources = Order::where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->groupBy('source')
            ->get()
            ->groupBy('source')
            ->map(fn ($group) => $group->count())
            ->sortDesc()
            ->take(10)
            ->toArray();

        $result = [];
        foreach ($sources as $source => $count) {
            $result[] = [
                'referrer' => $source,
                'count' => $count,
            ];
        }

        return $result;
    }

    /**
     * Customer acquisition by source in the period.
     */
    private function getCustomerAcquisition(Carbon $start, Carbon $end): array
    {
        $sources = ['web', 'whatsapp', 'facebook'];
        $result = [];

        foreach ($sources as $source) {
            $count = Customer::where('created_at', '>=', $start)
                ->where('created_at', '<=', $end)
                ->where('source', $source)
                ->count();

            $result[] = [
                'source' => $source,
                'new_customers' => $count,
            ];
        }

        $totalNew = Customer::where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->count();

        return [
            'total_new' => $totalNew,
            'by_source' => $result,
        ];
    }

    /**
     * Orders grouped by status.
     */
    private function getOrdersByStatus(Carbon $start, Carbon $end): array
    {
        $statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        $result = [];

        foreach ($statuses as $status) {
            $result[$status] = Order::where('created_at', '>=', $start)
                ->where('created_at', '<=', $end)
                ->where('status', $status)
                ->count();
        }

        return $result;
    }

    /**
     * Average order value.
     */
    private function getAvgOrderValue(Carbon $start, Carbon $end): float
    {
        $avg = Order::where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->whereNotIn('status', ['cancelled'])
            ->avg('total');

        return round($avg ?? 0, 2);
    }

    /**
     * Top ordered items in the period.
     */
    private function getTopItems(Carbon $start, Carbon $end): array
    {
        $orders = Order::where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->whereNotIn('status', ['cancelled'])
            ->get();

        $itemCounts = [];

        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $name = $item['name'] ?? 'Unknown';
                if (!isset($itemCounts[$name])) {
                    $itemCounts[$name] = ['name' => $name, 'count' => 0, 'revenue' => 0];
                }
                $itemCounts[$name]['count'] += $item['quantity'] ?? 1;
                $itemCounts[$name]['revenue'] += ($item['price'] ?? 0) * ($item['quantity'] ?? 1);
            }
        }

        usort($itemCounts, fn ($a, $b) => $b['count'] - $a['count']);

        return array_slice($itemCounts, 0, 10);
    }
}

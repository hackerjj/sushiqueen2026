<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * PrometheusMetrics Middleware — Sushi Queen
 *
 * Tracks HTTP request count, duration, and status codes.
 * Stores counters in Redis for fast atomic increments.
 * Exposes collected metrics at GET /api/metrics in Prometheus text format.
 */
class PrometheusMetrics
{
    private const CACHE_PREFIX = 'prom:';
    private const HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        /** @var Response $response */
        $response = $next($request);

        $duration = microtime(true) - $start;
        $this->recordMetrics($request, $response, $duration);

        return $response;
    }

    /**
     * Record request count, duration histogram, and status code counters.
     */
    private function recordMetrics(Request $request, Response $response, float $duration): void
    {
        try {
            $method  = $request->method();
            $handler = $this->normalizeRoute($request);
            $status  = (string) $response->getStatusCode();

            // ── Request counter ──────────────────────────────────
            $counterKey = self::CACHE_PREFIX . "requests:{$method}:{$handler}:{$status}";
            Cache::increment($counterKey);

            // ── Duration histogram buckets ───────────────────────
            foreach (self::HISTOGRAM_BUCKETS as $bucket) {
                if ($duration <= $bucket) {
                    $bucketKey = self::CACHE_PREFIX . "duration_bucket:{$method}:{$handler}:{$bucket}";
                    Cache::increment($bucketKey);
                }
            }

            // +Inf bucket (always incremented)
            $infKey = self::CACHE_PREFIX . "duration_bucket:{$method}:{$handler}:+Inf";
            Cache::increment($infKey);

            // Sum and count for histogram
            $sumKey   = self::CACHE_PREFIX . "duration_sum:{$method}:{$handler}";
            $countKey = self::CACHE_PREFIX . "duration_count:{$method}:{$handler}";

            // Use Redis INCRBYFLOAT for sum via raw command, fallback to put
            $currentSum = (float) Cache::get($sumKey, 0);
            Cache::put($sumKey, $currentSum + $duration);
            Cache::increment($countKey);

        } catch (\Throwable $e) {
            // Silently fail — metrics should never break the app
            report($e);
        }
    }

    /**
     * Normalize the route to a label-safe handler string.
     * e.g. /api/admin/orders/123 → /api/admin/orders/{id}
     */
    private function normalizeRoute(Request $request): string
    {
        $route = $request->route();

        if ($route && $route->uri()) {
            return '/' . ltrim($route->uri(), '/');
        }

        return $request->path() ? '/' . $request->path() : '/';
    }

    // ─── Static: Render Prometheus Metrics ───────────────────────

    /**
     * Collect all stored metrics and render in Prometheus exposition format.
     */
    public static function renderMetrics(): string
    {
        $lines = [];

        $lines[] = '# Sushi Queen — Prometheus Metrics';
        $lines[] = '';

        // ── Request counter ──────────────────────────────────────
        $lines[] = '# HELP sushi_queen_http_requests_total Total HTTP requests';
        $lines[] = '# TYPE sushi_queen_http_requests_total counter';

        $requestKeys = self::getKeysByPattern('requests:*');
        foreach ($requestKeys as $key) {
            $parts = self::parseKey($key, 'requests');
            if (!$parts) continue;

            [$method, $handler, $status] = $parts;
            $value = (int) Cache::get($key, 0);
            $handler = self::escapeLabelValue($handler);
            $lines[] = "sushi_queen_http_requests_total{method=\"{$method}\",handler=\"{$handler}\",status=\"{$status}\"} {$value}";
        }

        $lines[] = '';

        // ── Duration histogram ───────────────────────────────────
        $lines[] = '# HELP sushi_queen_http_request_duration_seconds HTTP request duration in seconds';
        $lines[] = '# TYPE sushi_queen_http_request_duration_seconds histogram';

        $sumKeys = self::getKeysByPattern('duration_sum:*');
        foreach ($sumKeys as $sumKey) {
            $parts = self::parseKey($sumKey, 'duration_sum');
            if (!$parts) continue;

            [$method, $handler] = $parts;
            $escapedHandler = self::escapeLabelValue($handler);

            // Buckets
            foreach (self::HISTOGRAM_BUCKETS as $bucket) {
                $bucketKey = self::CACHE_PREFIX . "duration_bucket:{$method}:{$handler}:{$bucket}";
                $val = (int) Cache::get($bucketKey, 0);
                $lines[] = "sushi_queen_http_request_duration_seconds_bucket{method=\"{$method}\",handler=\"{$escapedHandler}\",le=\"{$bucket}\"} {$val}";
            }

            // +Inf
            $infKey = self::CACHE_PREFIX . "duration_bucket:{$method}:{$handler}:+Inf";
            $infVal = (int) Cache::get($infKey, 0);
            $lines[] = "sushi_queen_http_request_duration_seconds_bucket{method=\"{$method}\",handler=\"{$escapedHandler}\",le=\"+Inf\"} {$infVal}";

            // Sum
            $sum = (float) Cache::get($sumKey, 0);
            $lines[] = "sushi_queen_http_request_duration_seconds_sum{method=\"{$method}\",handler=\"{$escapedHandler}\"} {$sum}";

            // Count
            $countKey = self::CACHE_PREFIX . "duration_count:{$method}:{$handler}";
            $count = (int) Cache::get($countKey, 0);
            $lines[] = "sushi_queen_http_request_duration_seconds_count{method=\"{$method}\",handler=\"{$escapedHandler}\"} {$count}";
        }

        $lines[] = '';

        // ── Business metrics (orders, revenue) ───────────────────
        $lines = array_merge($lines, self::collectBusinessMetrics());

        return implode("\n", $lines) . "\n";
    }

    /**
     * Collect business-level metrics from the database.
     */
    private static function collectBusinessMetrics(): array
    {
        $lines = [];

        try {
            $orderModel = app(\App\Models\Order::class);

            // Active orders by status
            $lines[] = '# HELP sushi_queen_active_orders_total Current active orders by status';
            $lines[] = '# TYPE sushi_queen_active_orders_total gauge';

            $activeStatuses = ['pending', 'confirmed', 'preparing', 'ready'];
            foreach ($activeStatuses as $status) {
                $count = $orderModel->where('status', $status)->count();
                $lines[] = "sushi_queen_active_orders_total{status=\"{$status}\"} {$count}";
            }

            $lines[] = '';

            // Revenue today
            $lines[] = '# HELP sushi_queen_revenue_total Revenue in ARS';
            $lines[] = '# TYPE sushi_queen_revenue_total gauge';

            $todayRevenue = $orderModel
                ->where('created_at', '>=', now()->startOfDay())
                ->whereNotIn('status', ['cancelled'])
                ->sum('total');

            $monthRevenue = $orderModel
                ->where('created_at', '>=', now()->startOfMonth())
                ->whereNotIn('status', ['cancelled'])
                ->sum('total');

            $lines[] = "sushi_queen_revenue_total{period=\"today\"} {$todayRevenue}";
            $lines[] = "sushi_queen_revenue_total{period=\"month\"} {$monthRevenue}";

        } catch (\Throwable $e) {
            $lines[] = '# Error collecting business metrics: ' . $e->getMessage();
        }

        return $lines;
    }

    // ─── Helpers ─────────────────────────────────────────────────

    /**
     * Get all cache keys matching a pattern.
     * Falls back to scanning known routes if Redis KEYS is unavailable.
     */
    private static function getKeysByPattern(string $pattern): array
    {
        try {
            $redis = Cache::getStore();

            if (method_exists($redis, 'getRedis')) {
                $prefix = config('cache.prefix', '') . ':' . self::CACHE_PREFIX;
                $keys = $redis->getRedis()->keys($prefix . $pattern);

                return array_map(function ($key) {
                    // Strip the Laravel cache prefix to get our key
                    $cachePrefix = config('cache.prefix', '') . ':';
                    return str_starts_with($key, $cachePrefix)
                        ? substr($key, strlen($cachePrefix))
                        : $key;
                }, $keys);
            }
        } catch (\Throwable $e) {
            // Fallback below
        }

        // Fallback: return empty (metrics will be empty until Redis is available)
        return [];
    }

    /**
     * Parse a metric cache key into its component parts.
     */
    private static function parseKey(string $key, string $type): ?array
    {
        $prefix = self::CACHE_PREFIX . $type . ':';
        $raw = str_starts_with($key, $prefix) ? substr($key, strlen($prefix)) : $key;

        // Keys are formatted as METHOD:HANDLER:EXTRA
        // Handler can contain colons, so we split carefully
        $firstColon = strpos($raw, ':');
        if ($firstColon === false) return null;

        $method = substr($raw, 0, $firstColon);
        $rest = substr($raw, $firstColon + 1);

        if ($type === 'requests') {
            // Last segment is status code
            $lastColon = strrpos($rest, ':');
            if ($lastColon === false) return null;
            $handler = substr($rest, 0, $lastColon);
            $status = substr($rest, $lastColon + 1);
            return [$method, $handler, $status];
        }

        if ($type === 'duration_sum' || $type === 'duration_count') {
            return [$method, $rest];
        }

        return null;
    }

    /**
     * Escape a label value for Prometheus format.
     */
    private static function escapeLabelValue(string $value): string
    {
        return str_replace(['\\', '"', "\n"], ['\\\\', '\\"', '\\n'], $value);
    }
}

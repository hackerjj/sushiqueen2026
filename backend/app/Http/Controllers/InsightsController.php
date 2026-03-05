<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use App\Services\CloudflareService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsightsController extends Controller
{
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

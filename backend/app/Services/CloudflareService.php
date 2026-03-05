<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * CloudflareService — Sushi Queen
 *
 * Fetches analytics data from the Cloudflare GraphQL Analytics API.
 * Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID in .env.
 *
 * @see https://developers.cloudflare.com/analytics/graphql-api/
 */
class CloudflareService
{
    private string $apiToken;
    private string $baseUrl = 'https://api.cloudflare.com/client/v4';

    public function __construct()
    {
        $this->apiToken = config('services.cloudflare.api_token', env('CLOUDFLARE_API_TOKEN', ''));
    }

    /**
     * Check if Cloudflare integration is configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiToken) && !empty($this->getZoneId());
    }

    /**
     * Get analytics data for a Cloudflare zone.
     *
     * @param string      $zoneId  Cloudflare Zone ID (or null to use env default)
     * @param string      $since   ISO 8601 date string or relative (e.g., '-1d', '-7d', '-30d')
     * @return array{visits: int, unique_visitors: int, bandwidth: int, threats_blocked: int, source: string}
     */
    public function getAnalytics(?string $zoneId = null, string $since = '-30d'): array
    {
        $zoneId = $zoneId ?? $this->getZoneId();

        if (empty($this->apiToken) || empty($zoneId)) {
            return $this->emptyAnalytics('not_configured');
        }

        try {
            $sinceDate = $this->resolveSinceDate($since);
            $untilDate = now()->toDateString();

            // Use Cloudflare GraphQL Analytics API
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiToken}",
                'Content-Type'  => 'application/json',
            ])->post("{$this->baseUrl}/graphql", [
                'query' => $this->buildAnalyticsQuery(),
                'variables' => [
                    'zoneTag'  => $zoneId,
                    'since'    => $sinceDate,
                    'until'    => $untilDate,
                ],
            ]);

            if (!$response->successful()) {
                Log::warning('Cloudflare Analytics API error', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return $this->emptyAnalytics('api_error');
            }

            return $this->parseGraphQLResponse($response->json());

        } catch (\Throwable $e) {
            Log::error('Cloudflare Analytics fetch failed', [
                'error' => $e->getMessage(),
            ]);
            return $this->emptyAnalytics('error');
        }
    }

    /**
     * Get zone-level summary (bandwidth, requests, threats) via REST API.
     */
    public function getZoneSummary(?string $zoneId = null, string $since = '-30d'): array
    {
        $zoneId = $zoneId ?? $this->getZoneId();

        if (empty($this->apiToken) || empty($zoneId)) {
            return [];
        }

        try {
            $sinceDate = $this->resolveSinceDate($since) . 'T00:00:00Z';
            $untilDate = now()->toISOString();

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiToken}",
                'Content-Type'  => 'application/json',
            ])->get("{$this->baseUrl}/zones/{$zoneId}/analytics/dashboard", [
                'since'      => $sinceDate,
                'until'      => $untilDate,
                'continuous'  => true,
            ]);

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json('result.totals') ?? [];

            return [
                'requests'   => $data['requests']['all'] ?? 0,
                'bandwidth'  => $data['bandwidth']['all'] ?? 0,
                'threats'    => $data['threats']['all'] ?? 0,
                'pageviews'  => $data['pageviews']['all'] ?? 0,
                'uniques'    => $data['uniques']['all'] ?? 0,
            ];

        } catch (\Throwable $e) {
            Log::error('Cloudflare zone summary failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private function getZoneId(): string
    {
        return config('services.cloudflare.zone_id', env('CLOUDFLARE_ZONE_ID', ''));
    }

    /**
     * Resolve a relative date string to an ISO date.
     */
    private function resolveSinceDate(string $since): string
    {
        if (preg_match('/^-(\d+)([dhm])$/', $since, $matches)) {
            $amount = (int) $matches[1];
            return match ($matches[2]) {
                'd' => now()->subDays($amount)->toDateString(),
                'h' => now()->subHours($amount)->toDateString(),
                'm' => now()->subMonths($amount)->toDateString(),
                default => now()->subDays(30)->toDateString(),
            };
        }

        // Assume ISO date string
        return $since;
    }

    /**
     * Build the GraphQL query for zone analytics.
     */
    private function buildAnalyticsQuery(): string
    {
        return <<<'GRAPHQL'
        query GetZoneAnalytics($zoneTag: String!, $since: Date!, $until: Date!) {
            viewer {
                zones(filter: { zoneTag: $zoneTag }) {
                    httpRequests1dGroups(
                        limit: 1000
                        filter: { date_geq: $since, date_leq: $until }
                    ) {
                        sum {
                            requests
                            bytes
                            threats
                            pageViews
                        }
                        uniq {
                            uniques
                        }
                    }
                }
            }
        }
        GRAPHQL;
    }

    /**
     * Parse the GraphQL response into a normalized analytics array.
     */
    private function parseGraphQLResponse(array $response): array
    {
        $zones = $response['data']['viewer']['zones'] ?? [];

        if (empty($zones)) {
            return $this->emptyAnalytics('no_data');
        }

        $groups = $zones[0]['httpRequests1dGroups'] ?? [];

        $totalRequests  = 0;
        $totalBytes     = 0;
        $totalThreats   = 0;
        $totalPageViews = 0;
        $totalUniques   = 0;

        foreach ($groups as $group) {
            $totalRequests  += $group['sum']['requests'] ?? 0;
            $totalBytes     += $group['sum']['bytes'] ?? 0;
            $totalThreats   += $group['sum']['threats'] ?? 0;
            $totalPageViews += $group['sum']['pageViews'] ?? 0;
            $totalUniques   += $group['uniq']['uniques'] ?? 0;
        }

        return [
            'visits'           => $totalPageViews,
            'unique_visitors'  => $totalUniques,
            'bandwidth'        => $totalBytes,
            'threats_blocked'  => $totalThreats,
            'total_requests'   => $totalRequests,
            'source'           => 'cloudflare',
        ];
    }

    /**
     * Return an empty analytics response with a source indicator.
     */
    private function emptyAnalytics(string $source): array
    {
        return [
            'visits'           => 0,
            'unique_visitors'  => 0,
            'bandwidth'        => 0,
            'threats_blocked'  => 0,
            'total_requests'   => 0,
            'source'           => $source,
        ];
    }
}

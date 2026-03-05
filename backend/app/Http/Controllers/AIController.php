<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    private AIService $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * POST /api/ai/recommend/{customer_id}
     *
     * Generate personalized menu recommendations for a customer.
     * JWT protected (admin).
     */
    public function recommend(string $customer_id): JsonResponse
    {
        $customer = Customer::find($customer_id);

        if (!$customer) {
            return response()->json([
                'error' => 'Customer not found',
                'message' => "No customer found with ID: {$customer_id}",
            ], 404);
        }

        try {
            $result = $this->aiService->getRecommendations($customer);

            return response()->json([
                'customer_id' => $customer_id,
                'customer_name' => $customer->name,
                'source' => $result['source'],
                'recommendations' => $result['recommendations'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Failed to generate recommendations',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/ai/analyze/{customer_id}
     *
     * Analyze customer preferences and update ai_profile.
     * JWT protected (admin).
     */
    public function analyzePreferences(string $customer_id): JsonResponse
    {
        $customer = Customer::find($customer_id);

        if (!$customer) {
            return response()->json([
                'error' => 'Customer not found',
                'message' => "No customer found with ID: {$customer_id}",
            ], 404);
        }

        try {
            $profile = $this->aiService->analyzeCustomerPreferences($customer);

            return response()->json([
                'customer_id' => $customer_id,
                'customer_name' => $customer->name,
                'ai_profile' => $profile,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Failed to analyze preferences',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class PromotionController extends Controller
{
    use ApiResponse;
    /**
     * List active non-expired promotions (public).
     */
    public function active(): JsonResponse
    {
        $data = Cache::remember('promotions:active', 1800, function () {
            $promotions = Promotion::active()
                ->orderBy('starts_at', 'desc')
                ->get();

            return [
                'data' => $promotions,
                'total' => $promotions->count(),
            ];
        });

        return response()->json($data);
    }

    /**
     * List all promotions (admin).
     */
    public function index(): JsonResponse
    {
        $promotions = Promotion::orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $promotions,
            'total' => $promotions->count(),
        ]);
    }

    /**
     * Create a new promotion (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'discount_type' => 'required|string|in:percentage,fixed,2x1,bogo',
            'discount_value' => 'required|numeric|min:0',
            'applicable_items' => 'nullable|array',
            'image_url' => 'nullable|string',
            'starts_at' => 'required|date',
            'expires_at' => 'required|date|after:starts_at',
            'active' => 'boolean',
            'code' => 'nullable|string|max:50',
            'max_usage' => 'nullable|integer|min:0',
        ]);

        $validated['active'] = $validated['active'] ?? true;
        $validated['usage_count'] = 0;

        $promotion = Promotion::create($validated);

        Cache::forget('promotions:active');

        return response()->json([
            'message' => 'Promotion created',
            'data' => $promotion,
        ], 201);
    }

    /**
     * Update a promotion (admin).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $promotion = Promotion::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'discount_type' => 'sometimes|string|in:percentage,fixed,2x1,bogo',
            'discount_value' => 'sometimes|numeric|min:0',
            'applicable_items' => 'nullable|array',
            'image_url' => 'nullable|string',
            'starts_at' => 'sometimes|date',
            'expires_at' => 'sometimes|date',
            'active' => 'boolean',
            'code' => 'nullable|string|max:50',
            'max_usage' => 'nullable|integer|min:0',
        ]);

        $promotion->update($validated);

        Cache::forget('promotions:active');

        return response()->json([
            'message' => 'Promotion updated',
            'data' => $promotion,
        ]);
    }

    /**
     * Delete a promotion (admin).
     */
    public function destroy(string $id): JsonResponse
    {
        $promotion = Promotion::findOrFail($id);
        $promotion->delete();

        Cache::forget('promotions:active');

        return response()->json([
            'message' => 'Promotion deleted',
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MenuController extends Controller
{
    /**
     * List all available menu items (public).
     */
    public function index(): JsonResponse
    {
        $items = MenuItem::where('available', true)
            ->orderBy('category')
            ->orderBy('sort_order')
            ->get();

        $grouped = $items->groupBy('category');

        return response()->json([
            'data' => $grouped,
            'total' => $items->count(),
        ]);
    }

    /**
     * Filter menu items by category (public).
     */
    public function byCategory(string $category): JsonResponse
    {
        $items = MenuItem::where('available', true)
            ->where('category', $category)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $items,
            'category' => $category,
            'total' => $items->count(),
        ]);
    }

    /**
     * Create a new menu item (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'image_url' => 'nullable|string|url',
            'modifiers' => 'nullable|array',
            'available' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $validated['available'] = $validated['available'] ?? true;
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        $item = MenuItem::create($validated);

        return response()->json([
            'message' => 'Menu item created',
            'data' => $item,
        ], 201);
    }

    /**
     * Update a menu item (admin).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $item = MenuItem::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'category' => 'sometimes|string|max:100',
            'image_url' => 'nullable|string',
            'modifiers' => 'nullable|array',
            'available' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $item->update($validated);

        return response()->json([
            'message' => 'Menu item updated',
            'data' => $item,
        ]);
    }

    /**
     * Delete a menu item (admin).
     */
    public function destroy(string $id): JsonResponse
    {
        $item = MenuItem::findOrFail($id);
        $item->delete();

        return response()->json([
            'message' => 'Menu item deleted',
        ]);
    }
}

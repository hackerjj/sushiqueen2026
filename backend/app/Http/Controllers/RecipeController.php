<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class RecipeController extends Controller
{
    use ApiResponse;
    public function index(): JsonResponse
    {
        $recipes = Recipe::all();
        return response()->json(['data' => $recipes]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'menu_item_id' => 'required|string',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.ingredient_id' => 'required|string',
            'ingredients.*.quantity' => 'required|numeric|min:0.001',
            'ingredients.*.unit' => 'required|string',
            'yield' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $totalCost = $this->calculateCost($validated['ingredients']);

        $recipe = Recipe::create([
            'menu_item_id' => $validated['menu_item_id'],
            'ingredients' => $validated['ingredients'],
            'total_cost' => $totalCost,
            'yield' => $validated['yield'] ?? 1,
            'notes' => $validated['notes'] ?? '',
        ]);

        // Update menu item cost
        MenuItem::where('_id', $validated['menu_item_id'])->update([
            'cost' => $totalCost,
            'recipe_id' => (string) $recipe->_id,
        ]);

        return response()->json(['message' => 'Receta creada', 'data' => $recipe], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $recipe = Recipe::findOrFail($id);

        $validated = $request->validate([
            'ingredients' => 'sometimes|array|min:1',
            'ingredients.*.ingredient_id' => 'required|string',
            'ingredients.*.quantity' => 'required|numeric|min:0.001',
            'ingredients.*.unit' => 'required|string',
            'yield' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['ingredients'])) {
            $validated['total_cost'] = $this->calculateCost($validated['ingredients']);
            MenuItem::where('_id', $recipe->menu_item_id)->update(['cost' => $validated['total_cost']]);
        }

        $recipe->update($validated);
        return response()->json(['message' => 'Receta actualizada', 'data' => $recipe->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        $recipe = Recipe::findOrFail($id);
        MenuItem::where('_id', $recipe->menu_item_id)->update(['cost' => null, 'recipe_id' => null]);
        $recipe->delete();
        return response()->json(['message' => 'Receta eliminada']);
    }

    public function cost(string $id): JsonResponse
    {
        $recipe = Recipe::findOrFail($id);
        $menuItem = MenuItem::find($recipe->menu_item_id);

        $details = [];
        $totalCost = 0;

        foreach ($recipe->ingredients as $ri) {
            $ingredient = Ingredient::find($ri['ingredient_id']);
            $lineCost = $ingredient ? $ingredient->cost_per_unit * $ri['quantity'] : 0;
            $totalCost += $lineCost;
            $details[] = [
                'ingredient' => $ingredient?->name ?? 'Desconocido',
                'quantity' => $ri['quantity'],
                'unit' => $ri['unit'],
                'cost_per_unit' => $ingredient?->cost_per_unit ?? 0,
                'line_cost' => round($lineCost, 2),
            ];
        }

        return response()->json([
            'data' => [
                'recipe_id' => $id,
                'menu_item' => $menuItem?->name ?? '',
                'price' => $menuItem?->price ?? 0,
                'total_cost' => round($totalCost, 2),
                'margin' => $menuItem ? round($menuItem->price - $totalCost, 2) : 0,
                'margin_pct' => $menuItem && $menuItem->price > 0 ? round((($menuItem->price - $totalCost) / $menuItem->price) * 100, 1) : 0,
                'details' => $details,
            ],
        ]);
    }

    private function calculateCost(array $ingredients): float
    {
        $total = 0;
        foreach ($ingredients as $ri) {
            $ingredient = Ingredient::find($ri['ingredient_id']);
            if ($ingredient) {
                $total += $ingredient->cost_per_unit * $ri['quantity'];
            }
        }
        return round($total, 2);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\InventoryMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class InventoryController extends Controller
{
    public function ingredients(Request $request): JsonResponse
    {
        $query = Ingredient::query();
        if ($request->has('category')) $query->where('category', $request->input('category'));
        if ($request->has('low_stock')) $query->whereRaw(['$expr' => ['$lte' => ['$current_stock', '$min_stock']]]);
        if ($request->has('search')) $query->where('name', 'like', '%' . $request->input('search') . '%');

        $items = $query->orderBy('name')->get();
        return response()->json(['data' => $items]);
    }

    public function storeIngredient(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|in:kg,g,l,ml,pza,paq',
            'current_stock' => 'required|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|string',
            'category' => 'nullable|string|max:100',
        ]);

        $ingredient = Ingredient::create($validated);
        return response()->json(['message' => 'Ingrediente creado', 'data' => $ingredient], 201);
    }

    public function updateIngredient(Request $request, string $id): JsonResponse
    {
        $ingredient = Ingredient::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'unit' => 'sometimes|string|in:kg,g,l,ml,pza,paq',
            'current_stock' => 'sometimes|numeric|min:0',
            'min_stock' => 'sometimes|numeric|min:0',
            'cost_per_unit' => 'sometimes|numeric|min:0',
            'supplier_id' => 'nullable|string',
            'category' => 'nullable|string|max:100',
        ]);

        $ingredient->update($validated);
        return response()->json(['message' => 'Ingrediente actualizado', 'data' => $ingredient]);
    }

    public function destroyIngredient(string $id): JsonResponse
    {
        Ingredient::findOrFail($id)->delete();
        return response()->json(['message' => 'Ingrediente eliminado']);
    }

    public function addMovement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|string',
            'type' => 'required|string|in:purchase,sale,waste,adjustment,count',
            'quantity' => 'required|numeric',
            'cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $ingredient = Ingredient::findOrFail($validated['ingredient_id']);
        $previousStock = $ingredient->current_stock;

        $delta = in_array($validated['type'], ['purchase', 'adjustment'])
            ? abs($validated['quantity'])
            : -abs($validated['quantity']);

        if ($validated['type'] === 'count') {
            $delta = $validated['quantity'] - $previousStock;
        }

        $newStock = max(0, $previousStock + $delta);
        $ingredient->update(['current_stock' => $newStock]);

        $movement = InventoryMovement::create([
            'ingredient_id' => $validated['ingredient_id'],
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'cost' => $validated['cost'] ?? null,
            'notes' => $validated['notes'] ?? '',
            'created_by' => $request->user()?->id ?? 'admin',
        ]);

        return response()->json(['message' => 'Movimiento registrado', 'data' => $movement]);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = InventoryMovement::query();
        if ($request->has('ingredient_id')) $query->where('ingredient_id', $request->input('ingredient_id'));
        if ($request->has('type')) $query->where('type', $request->input('type'));

        $movements = $query->orderBy('created_at', 'desc')->limit(100)->get();
        return response()->json(['data' => $movements]);
    }

    public function lowStockAlerts(): JsonResponse
    {
        $alerts = Ingredient::whereRaw([
            '$expr' => ['$lte' => ['$current_stock', '$min_stock']]
        ])->get();

        return response()->json(['data' => $alerts, 'count' => $alerts->count()]);
    }
}

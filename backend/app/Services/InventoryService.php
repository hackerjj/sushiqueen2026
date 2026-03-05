<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Recipe;
use Illuminate\Support\Facades\Log;

/**
 * InventoryService - Descuento automático de inventario al vender.
 */
class InventoryService
{
    /**
     * Descuenta ingredientes del inventario basado en los items de una orden.
     */
    public function deductForOrder(Order $order): array
    {
        $deducted = [];

        foreach ($order->items as $item) {
            $recipe = Recipe::where('menu_item_id', $item['menu_item_id'])->first();
            if (!$recipe) continue;

            foreach ($recipe->ingredients as $ri) {
                $ingredient = Ingredient::find($ri['ingredient_id']);
                if (!$ingredient) continue;

                $qty = $ri['quantity'] * $item['quantity'];
                $previousStock = $ingredient->current_stock;
                $newStock = max(0, $previousStock - $qty);

                $ingredient->update(['current_stock' => $newStock]);

                InventoryMovement::create([
                    'ingredient_id' => $ri['ingredient_id'],
                    'type' => 'sale',
                    'quantity' => $qty,
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'order_id' => (string) $order->_id,
                    'notes' => "Orden {$order->order_number}: {$item['quantity']}x {$item['name']}",
                    'created_by' => 'system',
                ]);

                $deducted[] = [
                    'ingredient' => $ingredient->name,
                    'quantity' => $qty,
                    'new_stock' => $newStock,
                    'low' => $newStock <= $ingredient->min_stock,
                ];
            }
        }

        if (!empty($deducted)) {
            Log::info('InventoryService: Stock deducted for order', [
                'order_id' => (string) $order->_id,
                'items' => count($deducted),
            ]);
        }

        return $deducted;
    }

    /**
     * Verifica si hay stock suficiente para una orden antes de crearla.
     */
    public function checkStockForOrder(array $items): array
    {
        $warnings = [];

        foreach ($items as $item) {
            $recipe = Recipe::where('menu_item_id', $item['menu_item_id'])->first();
            if (!$recipe) continue;

            foreach ($recipe->ingredients as $ri) {
                $ingredient = Ingredient::find($ri['ingredient_id']);
                if (!$ingredient) continue;

                $needed = $ri['quantity'] * $item['quantity'];
                if ($ingredient->current_stock < $needed) {
                    $warnings[] = [
                        'ingredient' => $ingredient->name,
                        'needed' => $needed,
                        'available' => $ingredient->current_stock,
                        'unit' => $ingredient->unit,
                    ];
                }
            }
        }

        return $warnings;
    }
}

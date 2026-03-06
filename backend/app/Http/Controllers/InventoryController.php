<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\InventoryMovement;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    public function ingredients(Request $request): JsonResponse
    {
        $query = Ingredient::query();
        if ($request->has('category')) $query->where('category', $request->input('category'));
        if ($request->has('low_stock')) $query->whereRaw(['$expr' => ['$lte' => ['$current_stock', '$min_stock']]]);
        if ($request->has('search')) $query->where('name', 'like', '%' . $request->input('search') . '%');

        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');
        $allowed = ['name', 'category', 'cost_per_unit', 'current_stock'];
        if (in_array($sortBy, $allowed)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('name', 'asc');
        }

        $perPage = (int) $request->input('per_page', 200);
        $items = $query->paginate($perPage);
        return response()->json($items);
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

    /**
     * Import ingredientes and proveedores from FUDO JSON data files.
     * POST /admin/inventory/import-fudo
     */
    public function importFudo(): JsonResponse
    {
        $basePath = storage_path('app/fudo_data');
        $results = [
            'ingredients' => ['created' => 0, 'updated' => 0, 'errors' => []],
            'suppliers' => ['created' => 0, 'updated' => 0, 'errors' => []],
        ];

        // --- Import Suppliers ---
        $suppliersFile = $basePath . '/proveedores.json';
        if (file_exists($suppliersFile)) {
            $suppliersData = json_decode(file_get_contents($suppliersFile), true);
            if (is_array($suppliersData)) {
                foreach ($suppliersData as $index => $row) {
                    try {
                        $name = trim($row['Nombre'] ?? '');
                        if (empty($name)) {
                            $results['suppliers']['errors'][] = "Row " . ($index + 1) . ": missing Nombre";
                            continue;
                        }

                        $phone = $row['Teléfono'] ?? null;
                        if (is_numeric($phone)) {
                            $phone = (string) (int) $phone;
                        }

                        $address = $row['Dirección'] ?? null;
                        // Clean up malformed address arrays from FUDO export
                        if (is_string($address) && str_starts_with($address, '[')) {
                            $decoded = json_decode($address, true);
                            if (is_array($decoded)) {
                                $address = implode(', ', array_filter($decoded, fn($v) => $v !== null));
                            }
                            if (empty($address)) {
                                $address = null;
                            }
                        }

                        $supplierData = [
                            'name' => $name,
                            'phone' => $phone,
                            'email' => $row['Email'] ?? null,
                            'address' => $address,
                            'notes' => $row['Comentario'] ?? null,
                            'fudo_id' => $row['Id'] ?? null,
                            'tax_id' => $row['Nro. Fiscal'] ?? null,
                            'active' => ($row['Activo'] ?? 'Sí') === 'Sí',
                        ];

                        $existing = Supplier::where('fudo_id', $supplierData['fudo_id'])->first();
                        if ($existing) {
                            $existing->update($supplierData);
                            $results['suppliers']['updated']++;
                        } else {
                            Supplier::create($supplierData);
                            $results['suppliers']['created']++;
                        }
                    } catch (\Throwable $e) {
                        $results['suppliers']['errors'][] = "Row " . ($index + 1) . ": " . $e->getMessage();
                    }
                }
            }
        } else {
            $results['suppliers']['errors'][] = "File not found: proveedores.json";
        }

        // --- Import Ingredients ---
        $ingredientsFile = $basePath . '/ingredientes.json';
        if (file_exists($ingredientsFile)) {
            $ingredientsData = json_decode(file_get_contents($ingredientsFile), true);
            if (is_array($ingredientsData)) {
                // Build supplier name → ID lookup
                $supplierMap = [];
                foreach (Supplier::all() as $s) {
                    $supplierMap[mb_strtolower(trim($s->name))] = (string) $s->_id;
                }

                foreach ($ingredientsData as $index => $row) {
                    try {
                        $name = trim($row['Nombre'] ?? '');
                        if (empty($name)) {
                            $results['ingredients']['errors'][] = "Row " . ($index + 1) . ": missing Nombre";
                            continue;
                        }

                        $unit = $this->mapFudoUnit($row['Unidad'] ?? '');
                        $cost = is_numeric($row['Costo'] ?? null) ? (float) $row['Costo'] : 0;
                        $stock = is_numeric($row['Stock'] ?? null) ? max(0, (float) $row['Stock']) : 0;

                        $supplierId = null;
                        $supplierName = trim($row['Proveedor'] ?? '');
                        if (!empty($supplierName)) {
                            $supplierId = $supplierMap[mb_strtolower($supplierName)] ?? null;
                        }

                        $ingredientData = [
                            'name' => $name,
                            'unit' => $unit,
                            'current_stock' => $stock,
                            'min_stock' => 0,
                            'cost_per_unit' => $cost,
                            'supplier_id' => $supplierId,
                            'category' => $row['Categoría'] ?? null,
                            'fudo_id' => $row['ID'] ?? null,
                            'stock_control' => ($row['Control de Stock'] ?? 'Si') === 'Si',
                        ];

                        $existing = Ingredient::where('fudo_id', $ingredientData['fudo_id'])->first();
                        if ($existing) {
                            $existing->update($ingredientData);
                            $results['ingredients']['updated']++;
                        } else {
                            Ingredient::create($ingredientData);
                            $results['ingredients']['created']++;
                        }
                    } catch (\Throwable $e) {
                        $results['ingredients']['errors'][] = "Row " . ($index + 1) . ": " . $e->getMessage();
                    }
                }
            }
        } else {
            $results['ingredients']['errors'][] = "File not found: ingredientes.json";
        }

        $totalCreated = $results['ingredients']['created'] + $results['suppliers']['created'];
        $totalUpdated = $results['ingredients']['updated'] + $results['suppliers']['updated'];
        $totalErrors = count($results['ingredients']['errors']) + count($results['suppliers']['errors']);

        Log::info("FUDO import completed: created=$totalCreated, updated=$totalUpdated, errors=$totalErrors");

        return response()->json([
            'success' => true,
            'message' => "Importación FUDO completada: $totalCreated creados, $totalUpdated actualizados, $totalErrors errores",
            'data' => $results,
        ]);
    }

    /**
     * Map FUDO unit strings to system-recognized units.
     */
    private function mapFudoUnit(string $fudoUnit): string
    {
        $map = [
            'L' => 'l',
            'l' => 'l',
            'kg' => 'kg',
            'Kg' => 'kg',
            'KG' => 'kg',
            'g' => 'g',
            'ml' => 'ml',
            'ML' => 'ml',
            'unid.' => 'pza',
            'unid' => 'pza',
            'pza' => 'pza',
            'paq' => 'paq',
        ];

        return $map[$fudoUnit] ?? 'pza';
    }

}

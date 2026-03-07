<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MenuController extends Controller
{
    /**
     * List all available menu items (public).
     */
    private const CATEGORY_ORDER = [
        'Especialidades', 'Sopas y Ramen', 'Entradas', 'Kushiages',
        'Makis', 'Makis Especiales', 'Yakimeshi', 'Yakisoba',
        'Teppanyaki', 'Tempuras', 'Paquetes', 'Pastas Queen',
        'Postres', 'Bebidas',
    ];

    public function index(): JsonResponse
    {
        $items = MenuItem::where('available', true)
            ->orderBy('sort_order')
            ->get();

        $grouped = $items->groupBy('category');

        // Reorder categories using fixed business order
        $ordered = collect();
        foreach (self::CATEGORY_ORDER as $cat) {
            if ($grouped->has($cat)) {
                $ordered[$cat] = $grouped[$cat];
            }
        }
        // Append any categories not in the fixed list
        foreach ($grouped as $cat => $catItems) {
            if (!$ordered->has($cat)) {
                $ordered[$cat] = $catItems;
            }
        }

        return response()->json([
            'data' => $ordered,
            'total' => $items->count(),
        ]);
    }

    /**
     * List all menu items for admin (available + unavailable) as flat array.
     */
    public function adminIndex(): JsonResponse
    {
        $items = MenuItem::orderBy('category')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $items->values(),
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

    /**
     * Export all menu items as CSV.
     */
    public function exportCsv(): StreamedResponse
    {
        $items = MenuItem::orderBy('category')->orderBy('name')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="menu-products.csv"',
        ];

        return response()->stream(function () use ($items) {
            $handle = fopen('php://output', 'w');
            // BOM for Excel UTF-8 compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
            // Header row
            fputcsv($handle, ['_id', 'name', 'description', 'price', 'category', 'image_url', 'available']);
            foreach ($items as $item) {
                fputcsv($handle, [
                    (string) $item->_id,
                    $item->name,
                    $item->description ?? '',
                    $item->price,
                    $item->category ?? '',
                    $item->image_url ?? '',
                    $item->available ? '1' : '0',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Import menu items from CSV (upsert).
     */
    public function importCsv(Request $request): JsonResponse
    {
        $request->validate([
            'csv' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('csv');
        $rows = array_map('str_getcsv', file($file->getPathname()));

        if (count($rows) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'CSV file is empty or has no data rows',
            ], 422);
        }

        $headers = array_map('trim', $rows[0]);
        // Remove BOM from first header if present
        $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
        array_shift($rows);

        $created = 0;
        $updated = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            $lineNumber = $index + 2; // +2 because header is line 1, index is 0-based

            if (count($row) !== count($headers)) {
                $errors[] = "Row {$lineNumber}: column count mismatch";
                continue;
            }

            $data = array_combine($headers, $row);

            // Validate required fields
            $name = trim($data['name'] ?? '');
            $price = $data['price'] ?? '';

            if (empty($name)) {
                $errors[] = "Row {$lineNumber}: missing name";
                continue;
            }

            if (!is_numeric($price)) {
                $errors[] = "Row {$lineNumber}: invalid price";
                continue;
            }

            $menuItem = [
                'name' => $name,
                'description' => $data['description'] ?? '',
                'price' => (float) $price,
                'category' => $data['category'] ?? 'General',
                'available' => ($data['available'] ?? '1') === '1',
            ];

            // Include image_url if present
            if (!empty($data['image_url'])) {
                $menuItem['image_url'] = $data['image_url'];
            }

            // Upsert: update if _id exists, create otherwise
            $id = trim($data['_id'] ?? '');
            if (!empty($id)) {
                $existing = MenuItem::find($id);
                if ($existing) {
                    $existing->update($menuItem);
                    $updated++;
                } else {
                    MenuItem::create($menuItem);
                    $created++;
                }
            } else {
                MenuItem::create($menuItem);
                $created++;
            }
        }

        return response()->json([
            'success' => true,
            'data' => compact('created', 'updated', 'errors'),
        ]);
    }

    /**
     * Upload image for a menu item.
     */
    public function uploadImage(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $menuItem = MenuItem::findOrFail($id);
        $path = $request->file('image')->store('menu', 'public');
        $url = asset('storage/' . $path);

        $menuItem->update(['image_url' => $url]);

        return response()->json([
            'success' => true,
            'data' => ['image_url' => $url],
        ]);
    }

    /**
     * Seed menu items from menuData.ts JSON payload (admin).
     */
    public function seed(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.category' => 'required|string',
        ]);

        $result = \App\Console\Commands\SeedMenuFromData::seedMenu($validated['items']);

        return response()->json([
            'success' => true,
            'message' => 'Menu seeded successfully',
            'data' => $result,
        ]);
    }
}

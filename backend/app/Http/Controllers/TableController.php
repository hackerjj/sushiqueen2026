<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class TableController extends Controller
{
    use ApiResponse;
    public function index(): JsonResponse
    {
        return response()->json(['data' => Table::orderBy('number')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'number' => 'required|integer|min:1',
            'name' => 'nullable|string|max:100',
            'capacity' => 'required|integer|min:1',
            'zone' => 'nullable|string|max:100',
            'position_x' => 'nullable|numeric',
            'position_y' => 'nullable|numeric',
            'shape' => 'nullable|string|in:square,circle,star',
            'size' => 'nullable|string|in:small,medium,large',
        ]);

        $validated['status'] = 'free';
        $table = Table::create($validated);
        return response()->json(['message' => 'Mesa creada', 'data' => $table], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $table = Table::findOrFail($id);
        $validated = $request->validate([
            'number' => 'sometimes|integer|min:1',
            'name' => 'nullable|string|max:100',
            'capacity' => 'sometimes|integer|min:1',
            'zone' => 'nullable|string|max:100',
            'position_x' => 'nullable|numeric',
            'position_y' => 'nullable|numeric',
            'shape' => 'nullable|string|in:square,circle,star',
            'size' => 'nullable|string|in:small,medium,large',
        ]);

        $table->update($validated);
        return response()->json(['message' => 'Mesa actualizada', 'data' => $table]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $table = Table::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|string|in:free,occupied,reserved,billing',
            'current_order_id' => 'nullable|string',
        ]);

        $table->update($validated);
        return response()->json(['message' => 'Estado actualizado', 'data' => $table]);
    }

    public function destroy(string $id): JsonResponse
    {
        Table::findOrFail($id)->delete();
        return response()->json(['message' => 'Mesa eliminada']);
    }
}

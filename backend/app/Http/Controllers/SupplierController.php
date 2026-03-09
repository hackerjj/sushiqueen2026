<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SupplierController extends Controller
{
    use ApiResponse;
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::orderBy('name')
            ->paginate(min($request->input('per_page', 20), 100));

        return response()->json($suppliers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $supplier = Supplier::create($validated);
        return response()->json(['message' => 'Proveedor creado', 'data' => $supplier], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $supplier->update($validated);
        return response()->json(['message' => 'Proveedor actualizado', 'data' => $supplier]);
    }

    public function destroy(string $id): JsonResponse
    {
        Supplier::findOrFail($id)->delete();
        return response()->json(['message' => 'Proveedor eliminado']);
    }
}

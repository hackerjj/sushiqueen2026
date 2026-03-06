<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CashRegisterController extends Controller
{
    public function current(): JsonResponse
    {
        $register = CashRegister::where('status', 'open')->orderBy('opened_at', 'desc')->first();
        return response()->json(['data' => $register]);
    }

    public function open(Request $request): JsonResponse
    {
        $existing = CashRegister::where('status', 'open')->first();
        if ($existing) {
            return response()->json(['error' => 'Ya hay una caja abierta'], 422);
        }

        $validated = $request->validate([
            'initial_amount' => 'required|numeric|min:0',
        ]);

        $register = CashRegister::create([
            'name' => 'Caja Principal',
            'opened_by' => $request->user()?->id ?? 'admin',
            'opened_at' => now(),
            'initial_amount' => $validated['initial_amount'],
            'expected_amount' => $validated['initial_amount'],
            'status' => 'open',
            'movements' => [],
            'summary' => [
                'total_sales' => 0,
                'total_cash' => 0,
                'total_card' => 0,
                'total_transfer' => 0,
                'total_tips' => 0,
                'total_expenses' => 0,
                'total_withdrawals' => 0,
            ],
        ]);

        return response()->json(['message' => 'Caja abierta', 'data' => $register], 201);
    }

    public function close(Request $request): JsonResponse
    {
        $register = CashRegister::where('status', 'open')->first();
        if (!$register) {
            return response()->json(['error' => 'No hay caja abierta'], 422);
        }

        $validated = $request->validate([
            'actual_amount' => 'required|numeric|min:0',
        ]);

        $register->update([
            'actual_amount' => $validated['actual_amount'],
            'closed_at' => now(),
            'status' => 'closed',
        ]);

        return response()->json(['message' => 'Caja cerrada', 'data' => $register->fresh()]);
    }

    public function movement(Request $request): JsonResponse
    {
        $register = CashRegister::where('status', 'open')->first();
        if (!$register) {
            return response()->json(['error' => 'No hay caja abierta'], 422);
        }

        $validated = $request->validate([
            'type' => 'required|string|in:sale,expense,withdrawal,deposit,tip',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
            'payment_method' => 'nullable|string|in:cash,card,transfer',
            'order_id' => 'nullable|string',
        ]);

        $movement = [
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'payment_method' => $validated['payment_method'] ?? 'cash',
            'order_id' => $validated['order_id'] ?? null,
            'created_at' => now()->toISOString(),
        ];

        $movements = $register->movements ?? [];
        $movements[] = $movement;

        $summary = $register->summary ?? [];
        $method = $validated['payment_method'] ?? 'cash';

        switch ($validated['type']) {
            case 'sale':
                $summary['total_sales'] = ($summary['total_sales'] ?? 0) + $validated['amount'];
                $summary['total_' . $method] = ($summary['total_' . $method] ?? 0) + $validated['amount'];
                $register->expected_amount += $validated['amount'];
                break;
            case 'tip':
                $summary['total_tips'] = ($summary['total_tips'] ?? 0) + $validated['amount'];
                $register->expected_amount += $validated['amount'];
                break;
            case 'expense':
                $summary['total_expenses'] = ($summary['total_expenses'] ?? 0) + $validated['amount'];
                $register->expected_amount -= $validated['amount'];
                break;
            case 'withdrawal':
                $summary['total_withdrawals'] = ($summary['total_withdrawals'] ?? 0) + $validated['amount'];
                $register->expected_amount -= $validated['amount'];
                break;
            case 'deposit':
                $register->expected_amount += $validated['amount'];
                break;
        }

        $register->update([
            'movements' => $movements,
            'summary' => $summary,
            'expected_amount' => $register->expected_amount,
        ]);

        return response()->json(['message' => 'Movimiento registrado', 'data' => $register->fresh()]);
    }

    public function history(): JsonResponse
    {
        $registers = CashRegister::orderBy('opened_at', 'desc')->limit(30)->get();
        return response()->json(['data' => $registers]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = CashRegister::query();

        if ($request->has('status')) {
            $status = $request->input('status');
            $query->where('status', $status === 'cerrado' ? 'closed' : ($status === 'abierto' ? 'open' : $status));
        }

        if ($request->has('name')) {
            $query->where('name', $request->input('name'));
        }

        $registers = $query->orderBy('opened_at', 'desc')
            ->paginate($request->input('per_page', 50));

        return response()->json($registers);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ExpenseController extends Controller
{
    use ApiResponse;
    /**
     * List expenses with optional filters by period and category.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Expense::query();

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by period
        if ($request->has('period') && $request->period) {
            $startDate = match ($request->period) {
                'today' => Carbon::today(),
                'week' => Carbon::now()->startOfWeek(),
                'month' => Carbon::now()->startOfMonth(),
                'year' => Carbon::now()->startOfYear(),
                default => null,
            };
            if ($startDate) {
                $query->where('date', '>=', $startDate);
            }
        }

        // Filter by custom date range
        if ($request->has('start_date') && $request->start_date) {
            $query->where('date', '>=', Carbon::parse($request->start_date)->startOfDay());
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('date', '<=', Carbon::parse($request->end_date)->endOfDay());
        }

        $perPage = (int) $request->input('per_page', 50);
        $expenses = $query->orderBy('date', 'desc')->paginate($perPage);

        return response()->json($expenses);
    }

    /**
     * Create a new expense.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|gt:0',
            'category' => 'required|string|in:' . implode(',', Expense::CATEGORIES),
            'date' => 'required|date',
            'payment_method' => 'required|string',
            'receipt_url' => 'nullable|string',
            'notes' => 'nullable|string',
            'created_by' => 'nullable|string',
        ]);

        $expense = Expense::create($validated);

        return response()->json([
            'message' => 'Expense created',
            'data' => $expense,
        ], 201);
    }

    /**
     * Update an existing expense.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'description' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|gt:0',
            'category' => 'sometimes|string|in:' . implode(',', Expense::CATEGORIES),
            'date' => 'sometimes|date',
            'payment_method' => 'sometimes|string',
            'receipt_url' => 'nullable|string',
            'notes' => 'nullable|string',
            'created_by' => 'nullable|string',
        ]);

        $expense->update($validated);

        return response()->json([
            'message' => 'Expense updated',
            'data' => $expense,
        ]);
    }

    /**
     * Delete an expense.
     */
    public function destroy(string $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted',
        ]);
    }

    /**
     * Get expense summary grouped by category for a period.
     */
    public function summary(Request $request): JsonResponse
    {
        $query = Expense::query();

        // Filter by period
        if ($request->has('period') && $request->period) {
            $startDate = match ($request->period) {
                'today' => Carbon::today(),
                'week' => Carbon::now()->startOfWeek(),
                'month' => Carbon::now()->startOfMonth(),
                'year' => Carbon::now()->startOfYear(),
                default => null,
            };
            if ($startDate) {
                $query->where('date', '>=', $startDate);
            }
        }

        if ($request->has('start_date') && $request->start_date) {
            $query->where('date', '>=', Carbon::parse($request->start_date)->startOfDay());
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('date', '<=', Carbon::parse($request->end_date)->endOfDay());
        }

        $expenses = $query->get();

        $grouped = $expenses->groupBy('category');
        $byCategory = [];
        $total = 0;

        foreach ($grouped as $cat => $catExpenses) {
            $catTotal = $catExpenses->sum('amount');
            $byCategory[] = [
                'category' => $cat,
                'total' => round($catTotal, 2),
                'count' => $catExpenses->count(),
            ];
            $total += $catTotal;
        }

        // Sort by total descending
        usort($byCategory, fn($a, $b) => $b['total'] <=> $a['total']);

        return response()->json([
            'data' => [
                'by_category' => $byCategory,
                'total' => round($total, 2),
            ],
        ]);
    }
}

<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * POSService - Motor interno de punto de venta MealLi.
 * Reemplaza toda la funcionalidad que antes proveía Fudo POS.
 */
class POSService
{
    /**
     * Genera número de orden secuencial por día.
     * Formato: #001, #002, etc. Se reinicia cada día.
     */
    public function generateOrderNumber(): string
    {
        $today = Carbon::today();

        $lastOrder = Order::where('created_at', '>=', $today)
            ->whereNotNull('order_number')
            ->orderBy('order_number', 'desc')
            ->first();

        if ($lastOrder && $lastOrder->order_number) {
            $lastNum = (int) ltrim($lastOrder->order_number, '#0');
            $nextNum = $lastNum + 1;
        } else {
            $nextNum = 1;
        }

        return '#' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Confirma una orden internamente (reemplaza webhook ORDER-CONFIRMED de Fudo).
     */
    public function confirmOrder(Order $order): Order
    {
        $order->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        Log::info('POSService: Order confirmed internally', [
            'order_id' => (string) $order->_id,
            'order_number' => $order->order_number,
        ]);

        return $order->fresh();
    }

    /**
     * Cambia el estado de una orden con validación de transiciones.
     */
    public function updateOrderStatus(Order $order, string $newStatus): Order
    {
        $validTransitions = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['preparing', 'cancelled'],
            'preparing' => ['ready', 'cancelled'],
            'ready' => ['delivered', 'delivering', 'cancelled'],
            'delivering' => ['delivered', 'cancelled'],
        ];

        $allowed = $validTransitions[$order->status] ?? [];

        if (!in_array($newStatus, $allowed)) {
            Log::warning('POSService: Invalid status transition', [
                'order_id' => (string) $order->_id,
                'from' => $order->status,
                'to' => $newStatus,
            ]);
        }

        $updateData = ['status' => $newStatus];

        if ($newStatus === 'confirmed') {
            $updateData['confirmed_at'] = now();
        }

        $order->update($updateData);

        return $order->fresh();
    }

    /**
     * Registra el pago de una orden.
     */
    /**
     * Registra el pago de una orden y lo agrega a la caja abierta.
     */
    public function registerPayment(Order $order, string $paymentMethod, float $tip = 0): Order
    {
        $order->update([
            'payment_method' => $paymentMethod,
            'payment_status' => 'paid',
            'tip' => $tip,
        ]);

        // Register in open cash register
        $register = \App\Models\CashRegister::where('status', 'open')->first();
        if ($register) {
            $movements = $register->movements ?? [];
            $summary = $register->summary ?? [];

            // Sale movement
            $movements[] = [
                'type' => 'sale',
                'amount' => $order->total,
                'description' => "Orden {$order->order_number}",
                'order_id' => (string) $order->_id,
                'payment_method' => $paymentMethod,
                'created_at' => now()->toISOString(),
            ];
            $summary['total_sales'] = ($summary['total_sales'] ?? 0) + $order->total;
            $summary['total_' . $paymentMethod] = ($summary['total_' . $paymentMethod] ?? 0) + $order->total;
            $expectedDelta = $order->total;

            // Tip movement
            if ($tip > 0) {
                $movements[] = [
                    'type' => 'tip',
                    'amount' => $tip,
                    'description' => "Propina orden {$order->order_number}",
                    'order_id' => (string) $order->_id,
                    'payment_method' => $paymentMethod,
                    'created_at' => now()->toISOString(),
                ];
                $summary['total_tips'] = ($summary['total_tips'] ?? 0) + $tip;
                $expectedDelta += $tip;
            }

            $register->update([
                'movements' => $movements,
                'summary' => $summary,
                'expected_amount' => $register->expected_amount + $expectedDelta,
            ]);

            $order->update(['cash_register_id' => (string) $register->_id]);
        }

        Log::info('POSService: Payment registered', [
            'order_id' => (string) $order->_id,
            'method' => $paymentMethod,
            'total' => $order->total,
            'tip' => $tip,
        ]);

        return $order->fresh();
    }

    /**
     * Marca un item específico como preparado en la cocina.
     */
    public function markItemPrepared(Order $order, int $itemIndex): Order
    {
        $preparedItems = $order->prepared_items ?? [];

        if (!in_array($itemIndex, $preparedItems)) {
            $preparedItems[] = $itemIndex;
            $order->update(['prepared_items' => $preparedItems]);
        }

        // Si todos los items están preparados, cambiar estado a ready
        if (count($preparedItems) >= count($order->items)) {
            $order->update(['status' => 'ready']);
        }

        return $order->fresh();
    }
}

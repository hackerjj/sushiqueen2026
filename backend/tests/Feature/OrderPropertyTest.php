<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Order;
use App\Models\Customer;
use PHPUnit\Framework\Attributes\DataProvider;

class OrderPropertyTest extends TestCase
{
    private static array $createdOrderIds = [];
    private static ?string $customerId = null;

    protected function tearDown(): void
    {
        foreach (self::$createdOrderIds as $id) {
            Order::where('_id', $id)->forceDelete();
        }
        self::$createdOrderIds = [];
        if (self::$customerId) {
            Customer::where('_id', self::$customerId)->forceDelete();
            self::$customerId = null;
        }
        parent::tearDown();
    }

    public static function randomItemCombinationsProvider(): array
    {
        $datasets = [];
        for ($i = 0; $i < 20; $i++) {
            $numItems = rand(1, 8);
            $items = [];
            $expectedTotal = 0;
            for ($j = 0; $j < $numItems; $j++) {
                $price = round(rand(100, 5000) / 100, 2);
                $quantity = rand(1, 10);
                $lineTotal = round($price * $quantity, 2);
                $expectedTotal += $lineTotal;
                $items[] = [
                    'menu_item_id' => "prop-{$i}-{$j}", 'name' => "Item {$i}-{$j}",
                    'price' => $price, 'quantity' => $quantity, 'modifiers' => [], 'line_total' => $lineTotal,
                ];
            }
            $datasets["combo_{$i}"] = [$items, round($expectedTotal, 2)];
        }
        return $datasets;
    }

    #[DataProvider('randomItemCombinationsProvider')]
    public function test_order_total_equals_sum_of_line_totals(array $items, float $expectedTotal): void
    {
        $customer = Customer::firstOrCreate(
            ['phone' => '+5491100009999'],
            ['name' => 'Prop Test', 'source' => 'web', 'tier' => 'new', 'total_orders' => 0, 'total_spent' => 0.0]
        );
        self::$customerId = (string) $customer->_id;

        $order = Order::create([
            'customer_id' => (string) $customer->_id, 'items' => $items,
            'subtotal' => $expectedTotal, 'tax' => 0, 'total' => $expectedTotal,
            'status' => 'pending', 'source' => 'web', 'notes' => '', 'delivery_address' => 'Test',
        ]);
        self::$createdOrderIds[] = (string) $order->_id;

        $saved = Order::find($order->_id);
        $sum = array_sum(array_column($saved->items, 'line_total'));
        $this->assertEqualsWithDelta($sum, $saved->total, 0.01);
        $this->assertGreaterThanOrEqual(0, $saved->total);
    }
}

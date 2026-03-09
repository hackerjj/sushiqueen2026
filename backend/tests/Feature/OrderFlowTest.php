<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Customer;
use App\Models\Order;

class OrderFlowTest extends TestCase
{
    private array $createdCustomerPhones = [];
    private array $createdOrderIds = [];

    protected function tearDown(): void
    {
        foreach ($this->createdOrderIds as $id) {
            Order::where('_id', $id)->forceDelete();
        }
        foreach ($this->createdCustomerPhones as $phone) {
            Customer::where('phone', $phone)->forceDelete();
        }
        parent::tearDown();
    }

    public function test_order_creation_creates_customer_and_updates_stats(): void
    {
        $phone = '+5491100001111';
        $this->createdCustomerPhones[] = $phone;
        Customer::where('phone', $phone)->forceDelete();

        $response = $this->postJson('/api/orders', [
            'customer' => ['name' => 'Integration Test', 'phone' => $phone, 'address' => 'Test 123'],
            'items' => [['menu_item_id' => 'test-001', 'name' => 'Test Roll', 'quantity' => 2, 'price' => 10.00, 'modifiers' => []]],
            'source' => 'web',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 201]));
        if ($response->json('data._id')) { $this->createdOrderIds[] = $response->json('data._id'); }

        $customer = Customer::where('phone', $phone)->first();
        $this->assertNotNull($customer);
        $this->assertEquals(1, $customer->total_orders);
        $this->assertEquals(20.00, $customer->total_spent);
    }

    public function test_customer_tier_upgrades_with_orders(): void
    {
        $phone = '+5491100003333';
        $this->createdCustomerPhones[] = $phone;
        Customer::where('phone', $phone)->forceDelete();

        Customer::create([
            'name' => 'Tier Test', 'phone' => $phone, 'source' => 'web',
            'tier' => 'new', 'total_orders' => 4, 'total_spent' => 100.00,
        ]);

        $response = $this->postJson('/api/orders', [
            'customer' => ['name' => 'Tier Test', 'phone' => $phone, 'address' => 'Test'],
            'items' => [['menu_item_id' => 'test-003', 'name' => 'Tempura', 'quantity' => 1, 'price' => 15.00, 'modifiers' => []]],
            'source' => 'web',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 201]));
        if ($response->json('data._id')) { $this->createdOrderIds[] = $response->json('data._id'); }

        $customer = Customer::where('phone', $phone)->first();
        $this->assertEquals(5, $customer->total_orders);
        $this->assertEquals('regular', $customer->tier);
    }
}

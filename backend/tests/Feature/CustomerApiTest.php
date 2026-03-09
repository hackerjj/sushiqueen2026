<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CustomerApiTest extends TestCase
{
    private ?User $user = null;
    private ?string $token = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::create([
            'name' => 'Customer Test Admin',
            'email' => 'customer-test@sushiqueen.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
        if ($this->user) {
            $loginResponse = $this->postJson('/api/auth/login', [
                'email' => 'customer-test@sushiqueen.com',
                'password' => 'password123',
            ]);
            $this->token = $loginResponse->json('access_token');
        }
    }

    protected function tearDown(): void
    {
        if ($this->user) { $this->user->forceDelete(); }
        parent::tearDown();
    }

    public function test_customers_requires_authentication(): void
    {
        $this->getJson('/api/admin/customers')->assertStatus(401);
    }

    public function test_customers_returns_paginated_results(): void
    {
        if (!$this->token) { $this->markTestSkipped('No auth token'); }
        $response = $this->getJson('/api/admin/customers', ['Authorization' => "Bearer {$this->token}"]);
        $response->assertStatus(200)->assertJsonStructure(['data', 'current_page', 'per_page', 'total', 'last_page']);
    }
}

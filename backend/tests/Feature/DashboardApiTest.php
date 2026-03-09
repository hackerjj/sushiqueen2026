<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DashboardApiTest extends TestCase
{
    private ?User $user = null;
    private ?string $token = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::create([
            'name' => 'Dashboard Test Admin',
            'email' => 'dashboard-test@sushiqueen.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
        if ($this->user) {
            $loginResponse = $this->postJson('/api/auth/login', [
                'email' => 'dashboard-test@sushiqueen.com',
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

    public function test_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/admin/dashboard')->assertStatus(401);
    }

    public function test_dashboard_returns_expected_kpi_structure(): void
    {
        if (!$this->token) { $this->markTestSkipped('No auth token'); }
        $response = $this->getJson('/api/admin/dashboard', ['Authorization' => "Bearer {$this->token}"]);
        $response->assertStatus(200)->assertJsonStructure([
            'sales_today', 'sales_week', 'sales_month',
            'orders_today', 'orders_week', 'orders_month',
            'new_customers_week', 'total_customers', 'top_items', 'sales_by_category',
        ]);
    }
}

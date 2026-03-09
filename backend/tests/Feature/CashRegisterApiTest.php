<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CashRegisterApiTest extends TestCase
{
    private ?User $user = null;
    private ?string $token = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::create([
            'name' => 'CashRegister Test Admin',
            'email' => 'cashregister-test@sushiqueen.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
        if ($this->user) {
            $loginResponse = $this->postJson('/api/auth/login', [
                'email' => 'cashregister-test@sushiqueen.com',
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

    public function test_cash_register_requires_authentication(): void
    {
        $this->getJson('/api/admin/cash-register')->assertStatus(401);
    }

    public function test_cash_register_returns_data(): void
    {
        if (!$this->token) { $this->markTestSkipped('No auth token'); }
        $this->getJson('/api/admin/cash-register', ['Authorization' => "Bearer {$this->token}"])->assertStatus(200);
    }
}

<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthFlowTest extends TestCase
{
    private ?User $user = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::create([
            'name' => 'Auth Flow Admin',
            'email' => 'authflow-test@sushiqueen.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
    }

    protected function tearDown(): void
    {
        if ($this->user) { $this->user->forceDelete(); }
        parent::tearDown();
    }

    public function test_full_auth_flow(): void
    {
        if (!$this->user) { $this->markTestSkipped('No test user'); }

        $login = $this->postJson('/api/auth/login', [
            'email' => 'authflow-test@sushiqueen.com', 'password' => 'password123',
        ]);
        $login->assertStatus(200)->assertJsonStructure(['access_token', 'token_type', 'expires_in']);
        $token = $login->json('access_token');

        $this->getJson('/api/admin/dashboard', ['Authorization' => "Bearer {$token}"])->assertStatus(200);

        $refresh = $this->postJson('/api/auth/refresh', [], ['Authorization' => "Bearer {$token}"]);
        $refresh->assertStatus(200)->assertJsonStructure(['access_token']);
        $newToken = $refresh->json('access_token');

        $this->postJson('/api/auth/logout', [], ['Authorization' => "Bearer {$newToken}"])->assertStatus(200);
    }

    public function test_invalid_credentials_returns_401(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'authflow-test@sushiqueen.com', 'password' => 'wrong',
        ])->assertStatus(401);
    }
}

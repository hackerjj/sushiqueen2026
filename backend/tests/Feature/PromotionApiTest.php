<?php

namespace Tests\Feature;

use Tests\TestCase;

class PromotionApiTest extends TestCase
{
    public function test_active_promotions_returns_data(): void
    {
        $response = $this->getJson('/api/promotions');
        $response->assertStatus(200)->assertJsonStructure(['data', 'total']);
    }

    public function test_active_promotions_data_is_array(): void
    {
        $response = $this->getJson('/api/promotions');
        $response->assertStatus(200);
        $this->assertIsArray($response->json('data'));
    }
}

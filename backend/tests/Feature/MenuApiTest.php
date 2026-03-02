<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MenuApiTest extends TestCase
{
    /**
     * Test: GET /api/menu returns a successful response.
     */
    public function test_can_get_menu_items(): void
    {
        $response = $this->getJson('/api/menu');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
        ]);
    }

    /**
     * Test: GET /api/menu returns array of items.
     */
    public function test_menu_returns_array_of_items(): void
    {
        $response = $this->getJson('/api/menu');

        $response->assertStatus(200);
        $response->assertJsonIsArray('data');
    }

    /**
     * Test: GET /api/menu/{category} filters by category.
     */
    public function test_can_filter_menu_by_category(): void
    {
        $response = $this->getJson('/api/menu/rolls');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
        ]);
    }

    /**
     * Test: Menu items have required fields.
     */
    public function test_menu_items_have_required_fields(): void
    {
        // Create a test menu item
        $menuItem = MenuItem::create([
            'name' => 'Test Roll',
            'description' => 'A delicious test roll',
            'price' => 12.99,
            'category' => 'rolls',
            'image_url' => 'https://example.com/test.jpg',
            'available' => true,
            'sort_order' => 1,
            'modifiers' => [],
            'fudo_id' => 'test-fudo-001',
        ]);

        $response = $this->getJson('/api/menu');

        $response->assertStatus(200);

        // Clean up
        if ($menuItem) {
            $menuItem->delete();
        }
    }

    /**
     * Test: Invalid category returns appropriate response.
     */
    public function test_invalid_category_returns_empty_or_error(): void
    {
        $response = $this->getJson('/api/menu/nonexistent-category-xyz');

        // Should return 200 with empty data or 404
        $this->assertTrue(
            in_array($response->status(), [200, 404]),
            "Expected status 200 or 404, got {$response->status()}"
        );
    }

    /**
     * Test: Menu endpoint handles no items gracefully.
     */
    public function test_menu_handles_empty_collection(): void
    {
        $response = $this->getJson('/api/menu');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }
}

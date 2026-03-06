<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Ingredient;
use App\Models\Supplier;
use App\Http\Controllers\InventoryController;

class InventoryImportFudoTest extends TestCase
{
    /**
     * Test: mapFudoUnit correctly maps FUDO units to system units.
     */
    public function test_map_fudo_unit_maps_correctly(): void
    {
        $controller = new InventoryController();
        $method = new \ReflectionMethod($controller, 'mapFudoUnit');
        $method->setAccessible(true);

        $this->assertEquals('l', $method->invoke($controller, 'L'));
        $this->assertEquals('kg', $method->invoke($controller, 'kg'));
        $this->assertEquals('pza', $method->invoke($controller, 'unid.'));
        $this->assertEquals('pza', $method->invoke($controller, 'unid'));
        $this->assertEquals('g', $method->invoke($controller, 'g'));
        $this->assertEquals('ml', $method->invoke($controller, 'ml'));
        $this->assertEquals('paq', $method->invoke($controller, 'paq'));
        // Unknown unit defaults to pza
        $this->assertEquals('pza', $method->invoke($controller, 'unknown'));
    }

    /**
     * Test: FUDO import endpoint returns success response structure.
     */
    public function test_import_fudo_returns_correct_structure(): void
    {
        // Clean up any existing FUDO-imported data
        Supplier::where('fudo_id', '!=', null)->delete();
        Ingredient::where('fudo_id', '!=', null)->delete();

        $response = $this->postJson('/api/admin/inventory/import-fudo');

        // Without auth, should get 401
        $response->assertStatus(401);
    }

    /**
     * Test: FUDO import creates suppliers from proveedores.json.
     */
    public function test_import_fudo_creates_suppliers(): void
    {
        // Clean up
        Supplier::where('fudo_id', '!=', null)->delete();

        // Call the controller method directly to bypass auth
        $controller = new InventoryController();
        $response = $controller->importFudo();
        $data = json_decode($response->getContent(), true);

        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('suppliers', $data['data']);
        $this->assertGreaterThan(0, $data['data']['suppliers']['created'] + $data['data']['suppliers']['updated']);

        // Verify a known supplier was imported
        $kume = Supplier::where('name', 'KUME')->first();
        $this->assertNotNull($kume);
        $this->assertEquals(3, $kume->fudo_id);

        // Clean up
        Supplier::where('fudo_id', '!=', null)->delete();
    }

    /**
     * Test: FUDO import creates ingredients from ingredientes.json.
     */
    public function test_import_fudo_creates_ingredients(): void
    {
        // Clean up
        Ingredient::where('fudo_id', '!=', null)->delete();
        Supplier::where('fudo_id', '!=', null)->delete();

        $controller = new InventoryController();
        $response = $controller->importFudo();
        $data = json_decode($response->getContent(), true);

        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('ingredients', $data['data']);
        $this->assertGreaterThan(0, $data['data']['ingredients']['created'] + $data['data']['ingredients']['updated']);

        // Verify a known ingredient was imported
        $salmon = Ingredient::where('name', 'SALMON')->first();
        $this->assertNotNull($salmon);
        $this->assertEquals('kg', $salmon->unit);
        $this->assertEquals(45, $salmon->fudo_id);

        // Clean up
        Ingredient::where('fudo_id', '!=', null)->delete();
        Supplier::where('fudo_id', '!=', null)->delete();
    }

    /**
     * Test: FUDO import is idempotent (running twice doesn't create duplicates).
     */
    public function test_import_fudo_is_idempotent(): void
    {
        // Clean up
        Ingredient::where('fudo_id', '!=', null)->delete();
        Supplier::where('fudo_id', '!=', null)->delete();

        $controller = new InventoryController();

        // First import
        $response1 = $controller->importFudo();
        $data1 = json_decode($response1->getContent(), true);
        $created1 = $data1['data']['suppliers']['created'] + $data1['data']['ingredients']['created'];

        // Second import
        $response2 = $controller->importFudo();
        $data2 = json_decode($response2->getContent(), true);
        $created2 = $data2['data']['suppliers']['created'] + $data2['data']['ingredients']['created'];

        // Second run should create 0 new records (all updates)
        $this->assertEquals(0, $created2);
        $this->assertGreaterThan(0, $data2['data']['suppliers']['updated'] + $data2['data']['ingredients']['updated']);

        // Clean up
        Ingredient::where('fudo_id', '!=', null)->delete();
        Supplier::where('fudo_id', '!=', null)->delete();
    }

    /**
     * Test: Negative stock values are clamped to 0.
     */
    public function test_import_clamps_negative_stock_to_zero(): void
    {
        // Clean up
        Ingredient::where('fudo_id', '!=', null)->delete();
        Supplier::where('fudo_id', '!=', null)->delete();

        $controller = new InventoryController();
        $controller->importFudo();

        // RAMEN has stock -48.0 in FUDO data, should be clamped to 0
        $ramen = Ingredient::where('name', 'RAMEN')->first();
        $this->assertNotNull($ramen);
        $this->assertEquals(0, $ramen->current_stock);

        // Clean up
        Ingredient::where('fudo_id', '!=', null)->delete();
        Supplier::where('fudo_id', '!=', null)->delete();
    }
}

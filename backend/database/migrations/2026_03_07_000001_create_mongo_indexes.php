<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $db = DB::connection('mongodb')->getMongoDB();

        // Orders indexes
        $db->selectCollection('orders')->createIndex(['created_at' => -1, 'status' => 1]);
        $db->selectCollection('orders')->createIndex(['customer_id' => 1]);

        // Customers indexes
        $db->selectCollection('customers')->createIndex(['phone' => 1], ['unique' => true, 'sparse' => true]);

        // Menu items indexes
        $db->selectCollection('menu_items')->createIndex(['category' => 1, 'available' => 1]);

        // Product sales indexes
        $db->selectCollection('product_sales')->createIndex(['date' => -1]);
    }

    public function down(): void
    {
        $db = DB::connection('mongodb')->getMongoDB();

        $db->selectCollection('orders')->dropIndex('created_at_-1_status_1');
        $db->selectCollection('orders')->dropIndex('customer_id_1');
        $db->selectCollection('customers')->dropIndex('phone_1');
        $db->selectCollection('menu_items')->dropIndex('category_1_available_1');
        $db->selectCollection('product_sales')->dropIndex('date_-1');
    }
};

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Ingredient;
use App\Models\Supplier;
use App\Models\CashRegister;

class MigrateFudoToMongo extends Command
{
    protected $signature = 'fudo:migrate {--fresh : Drop existing collections first}';
    protected $description = 'Migrate all Fudo JSON data into MongoDB collections';

    private $dataPath;

    private function toMongoDate(?string $dateStr): ?\MongoDB\BSON\UTCDateTime
    {
        if (!$dateStr) return null;
        try { return new \MongoDB\BSON\UTCDateTime(new \DateTime($dateStr)); }
        catch (\Exception $e) { return null; }
    }

    public function handle()
    {
        $this->dataPath = storage_path('app/fudo_data');
        if ($this->option('fresh')) {
            $this->warn('Dropping existing collections...');
            Customer::truncate(); MenuItem::truncate(); Order::truncate();
            Ingredient::truncate(); Supplier::truncate(); CashRegister::truncate();
        }
        $this->migrateMenu();
        $this->migrateCustomers();
        $this->migrateOrders();
        $this->updateCustomerStats();
        $this->migrateIngredients();
        $this->migrateSuppliers();
        $this->migrateCashRegisters();
        $this->info('✅ Migration complete!');
    }

    private function migrateMenu()
    {
        $file = $this->dataPath . '/sushi_queen_menu.json';
        if (!file_exists($file)) { $this->warn('No menu file'); return; }
        $items = json_decode(file_get_contents($file), true);
        foreach ($items as $item) {
            MenuItem::updateOrCreate(['name' => $item['name']], [
                'description' => $item['description'] ?? '', 'price' => floatval($item['price']),
                'category' => $item['category'] ?? 'General', 'image_url' => $item['image_url'] ?? '',
                'modifiers' => $item['modifiers'] ?? [], 'available' => true, 'sort_order' => $item['sort_order'] ?? 0,
            ]);
        }
        $this->info("  Menu: " . count($items) . " items");
    }

    private function migrateCustomers()
    {
        $file = $this->dataPath . '/clientes.json';
        if (!file_exists($file)) { $this->warn('No clientes file'); return; }
        $clientes = json_decode(file_get_contents($file), true);
        $count = 0;
        foreach ($clientes as $c) {
            $nombre = $c['Nombre'] ?? null;
            if (!$nombre || ($c['Activo'] ?? '') !== 'Sí') continue;
            $lastOrder = $c['Última compra'] ?? null;
            Customer::updateOrCreate(['name' => $nombre], [
                'phone' => $c['Teléfono'] ?? '', 'email' => $c['Email'] ?? '',
                'address' => trim(($c['Calle'] ?? '') . ' ' . ($c['Número'] ?? '')),
                'source' => 'pos', 'tier' => 'regular',
                'total_orders' => intval($c['Cant. de compras'] ?? 0),
                'total_spent' => 0, 'preferences' => [],
                'ai_profile' => ['favorite_items' => [], 'order_frequency' => '', 'avg_order_value' => 0, 'last_recommendations' => []],
                'last_order_at' => $lastOrder ? $this->toMongoDate($lastOrder) : null,
            ]);
            $count++;
        }
        $this->info("  Customers: {$count}");
    }

    private function migrateOrders()
    {
        $file = $this->dataPath . '/ventas.json';
        if (!file_exists($file)) { $this->warn('No ventas file'); return; }
        $ventas = json_decode(file_get_contents($file), true);
        $payMap = ['Efectivo'=>'cash','Tarj. Débito'=>'card','Tarj. Crédito'=>'card','Transferencia'=>'transfer','Mercado Pago'=>'transfer'];
        $typeMap = ['Local'=>'dine_in','Mostrador'=>'takeout','Delivery'=>'delivery','Para llevar'=>'takeout'];
        $statusMap = ['Cerrada'=>'delivered','Cancelada'=>'cancelled','Abierta'=>'pending'];
        $count = 0; $batch = [];

        foreach ($ventas as $v) {
            if (!isset($v['Desde']) || !is_numeric($v['Desde'])) continue;
            $total = floatval($v['Unnamed: 12'] ?? 0);
            if ($total <= 0) continue;
            $creacion = $v['Unnamed: 2'] ?? $v['01/01/2021 00:00'] ?? null;
            $cerrada = $v['Unnamed: 3'] ?? null;
            $tipoVenta = $v['Unnamed: 14'] ?? 'Local';
            $estado = $v['Unnamed: 5'] ?? 'Cerrada';
            $metodoPago = $v['Unnamed: 11'] ?? 'Efectivo';

            $batch[] = [
                'order_number' => strval($v['Desde']),
                'customer' => ['name' => $v['Unnamed: 6'] ?? '', 'phone' => $v['Unnamed: 20'] ?? '', 'email' => $v['Unnamed: 19'] ?? ''],
                'items' => [['name' => 'Venta #' . $v['Desde'], 'quantity' => 1, 'price' => $total, 'menu_item_id' => '', 'modifiers' => []]],
                'subtotal' => $total, 'tax' => 0, 'total' => $total,
                'status' => $statusMap[$estado] ?? 'delivered',
                'source' => 'fudo', 'type' => $typeMap[$tipoVenta] ?? 'dine_in',
                'notes' => $v['Unnamed: 15'] ?? '', 'delivery_address' => '',
                'payment_method' => $payMap[$metodoPago] ?? 'cash', 'payment_status' => 'paid',
                'tip' => 0, 'prepared_items' => [],
                'guest_count' => is_numeric($v['Unnamed: 9'] ?? null) ? intval($v['Unnamed: 9']) : null,
                'created_at' => $this->toMongoDate($creacion) ?? new \MongoDB\BSON\UTCDateTime(),
                'updated_at' => $this->toMongoDate($cerrada) ?? $this->toMongoDate($creacion) ?? new \MongoDB\BSON\UTCDateTime(),
                'closed_at' => $this->toMongoDate($cerrada),
                'channel' => strtolower($tipoVenta),
            ];
            if (count($batch) >= 500) { Order::insert($batch); $count += count($batch); $batch = []; $this->output->write("\r  Orders: {$count}..."); }
        }
        if (count($batch) > 0) { Order::insert($batch); $count += count($batch); }
        $this->info("\n  Orders: {$count} total");
    }

    private function updateCustomerStats()
    {
        $this->info("  Calculating customer stats from orders...");
        $customers = Customer::all();
        $updated = 0;
        foreach ($customers as $customer) {
            $name = $customer->name;
            if (!$name) continue;
            // Count orders and sum totals for this customer
            $orders = Order::where('customer.name', $name)->get();
            $totalOrders = $orders->count();
            $totalSpent = $orders->sum('total');
            $lastOrder = $orders->sortByDesc('created_at')->first();
            $customer->update([
                'total_orders' => $totalOrders,
                'total_spent' => round($totalSpent, 2),
                'last_order_at' => $lastOrder ? $lastOrder->created_at : null,
            ]);
            $updated++;
            if ($updated % 100 === 0) $this->output->write("\r  Customer stats: {$updated}...");
        }
        $this->info("\n  Customer stats: {$updated} updated");
    }

    private function migrateIngredients()
    {
        $file = $this->dataPath . '/ingredientes.json';
        if (!file_exists($file)) { $this->warn('No ingredientes file'); return; }
        $data = json_decode(file_get_contents($file), true);
        $count = 0;
        foreach ($data as $i) {
            $nombre = $i['Nombre'] ?? null;
            if (!$nombre) continue;
            Ingredient::updateOrCreate(['name' => $nombre], [
                'category' => $i['Categoría'] ?? '', 'unit' => $i['Unidad'] ?? 'kg',
                'cost_per_unit' => floatval($i['Costo'] ?? 0),
                'current_stock' => floatval($i['Stock'] ?? 0), 'min_stock' => 0,
            ]);
            $count++;
        }
        $this->info("  Ingredients: {$count}");
    }

    private function migrateSuppliers()
    {
        $file = $this->dataPath . '/proveedores.json';
        if (!file_exists($file)) { $this->warn('No proveedores file'); return; }
        $data = json_decode(file_get_contents($file), true);
        $count = 0;
        foreach ($data as $s) {
            $nombre = $s['Nombre'] ?? null;
            if (!$nombre || ($s['Activo'] ?? '') !== 'Sí') continue;
            Supplier::updateOrCreate(['name' => $nombre], [
                'email' => $s['Email'] ?? '', 'phone' => $s['Teléfono'] ?? '',
                'address' => $s['Dirección'] ?? '', 'tax_id' => $s['Nro. Fiscal'] ?? '',
                'notes' => $s['Comentario'] ?? '', 'active' => true,
            ]);
            $count++;
        }
        $this->info("  Suppliers: {$count}");
    }

    private function migrateCashRegisters()
    {
        $file = $this->dataPath . '/arqueos_caja.json';
        if (!file_exists($file)) { $this->warn('No arqueos file'); return; }
        $data = json_decode(file_get_contents($file), true);
        $count = 0; $batch = [];
        foreach ($data as $a) {
            if (($a['status'] ?? '') === 'eliminado') continue;
            $batch[] = [
                'name' => $a['name'] ?? 'Principal', 'opened_by' => 'admin',
                'opened_at' => $this->toMongoDate($a['opened_at']),
                'closed_at' => $this->toMongoDate($a['closed_at']),
                'initial_amount' => 0, 'expected_amount' => $a['system_amount'] ?? 0,
                'actual_amount' => $a['user_amount'] ?? 0,
                'system_amount' => $a['system_amount'] ?? 0, 'user_amount' => $a['user_amount'] ?? 0,
                'difference' => $a['difference'] ?? 0,
                'status' => ($a['status'] ?? '') === 'cerrado' ? 'closed' : 'open',
                'movements' => [],
                'summary' => ['total_sales' => $a['system_amount'] ?? 0, 'total_cash' => 0, 'total_card' => 0, 'total_transfer' => 0, 'total_tips' => 0, 'total_expenses' => 0, 'total_withdrawals' => 0],
                'created_at' => $this->toMongoDate($a['opened_at']) ?? new \MongoDB\BSON\UTCDateTime(),
                'updated_at' => $this->toMongoDate($a['closed_at']) ?? new \MongoDB\BSON\UTCDateTime(),
            ];
            if (count($batch) >= 500) { CashRegister::insert($batch); $count += count($batch); $batch = []; $this->output->write("\r  Cash: {$count}..."); }
        }
        if (count($batch) > 0) { CashRegister::insert($batch); $count += count($batch); }
        $this->info("\n  Cash Registers: {$count}");
    }
}

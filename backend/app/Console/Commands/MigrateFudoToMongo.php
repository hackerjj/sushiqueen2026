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

    public function handle()
    {
        $this->dataPath = storage_path('app/fudo_data');
        $fresh = $this->option('fresh');

        if ($fresh) {
            $this->warn('Dropping existing collections...');
            Customer::truncate();
            MenuItem::truncate();
            Order::truncate();
            Ingredient::truncate();
            Supplier::truncate();
            CashRegister::truncate();
        }

        $this->migrateMenu();
        $this->migrateCustomers();
        $this->migrateOrders();
        $this->migrateIngredients();
        $this->migrateSuppliers();
        $this->migrateCashRegisters();

        $this->info('✅ Migration complete!');
    }

    private function migrateMenu()
    {
        $file = $this->dataPath . '/sushi_queen_menu.json';
        if (!file_exists($file)) { $this->warn('sushi_queen_menu.json not found, skipping menu'); return; }

        $items = json_decode(file_get_contents($file), true);
        $count = 0;

        foreach ($items as $item) {
            MenuItem::updateOrCreate(
                ['name' => $item['name']],
                [
                    'description' => $item['description'] ?? '',
                    'price' => floatval($item['price']),
                    'category' => $item['category'] ?? 'General',
                    'image_url' => $item['image_url'] ?? '',
                    'modifiers' => $item['modifiers'] ?? [],
                    'available' => $item['available'] ?? true,
                    'sort_order' => $item['sort_order'] ?? 0,
                ]
            );
            $count++;
        }

        $this->info("  Menu: {$count} items migrated");
    }

    private function migrateCustomers()
    {
        $file = $this->dataPath . '/clientes.json';
        if (!file_exists($file)) { $this->warn('clientes.json not found, skipping customers'); return; }

        $clientes = json_decode(file_get_contents($file), true);
        $count = 0;

        foreach ($clientes as $c) {
            $nombre = $c['Nombre'] ?? null;
            if (!$nombre || ($c['Activo'] ?? '') !== 'Sí') continue;

            Customer::updateOrCreate(
                ['name' => $nombre],
                [
                    'phone' => $c['Teléfono'] ?? '',
                    'email' => $c['Email'] ?? '',
                    'address' => trim(($c['Calle'] ?? '') . ' ' . ($c['Número'] ?? '')),
                    'source' => strtolower($c['Origen'] ?? 'pos'),
                    'tier' => 'regular',
                    'total_orders' => intval($c['Cant. de compras'] ?? 0),
                    'total_spent' => floatval($c['Balance'] ?? 0),
                    'preferences' => [],
                    'ai_profile' => ['favorite_items' => [], 'order_frequency' => '', 'avg_order_value' => 0, 'last_recommendations' => []],
                    'last_order_at' => $c['Última compra'] ?? null,
                ]
            );
            $count++;
        }

        $this->info("  Customers: {$count} migrated");
    }

    private function migrateOrders()
    {
        $file = $this->dataPath . '/ventas.json';
        if (!file_exists($file)) { $this->warn('ventas.json not found, skipping orders'); return; }

        $ventas = json_decode(file_get_contents($file), true);
        $count = 0;
        $batch = [];

        // Column mapping from header row
        // Desde=Id, 01/01/2021=Fecha, Unnamed:2=Creación, Unnamed:3=Cerrada,
        // Unnamed:4=Caja, Unnamed:5=Estado, Unnamed:6=Cliente, Unnamed:7=Mesa,
        // Unnamed:8=Sala, Unnamed:9=Personas, Unnamed:10=Camarero,
        // Unnamed:11=Medio de Pago, Unnamed:12=Total, Unnamed:13=Fiscal,
        // Unnamed:14=Tipo de Venta, Unnamed:15=Comentario, Unnamed:16=Id.Cliente,
        // Unnamed:17=Origen, Unnamed:19=Email, Unnamed:20=Teléfono

        foreach ($ventas as $v) {
            if (!isset($v['Desde']) || !is_numeric($v['Desde'])) continue;

            $total = floatval($v['Unnamed: 12'] ?? 0);
            if ($total <= 0) continue;

            $creacion = $v['Unnamed: 2'] ?? $v['01/01/2021 00:00'] ?? null;
            $cerrada = $v['Unnamed: 3'] ?? null;
            $cliente = $v['Unnamed: 6'] ?? null;
            $tipoVenta = $v['Unnamed: 14'] ?? 'Local';
            $metodoPago = $v['Unnamed: 11'] ?? 'Efectivo';
            $estado = $v['Unnamed: 5'] ?? 'Cerrada';
            $mesa = $v['Unnamed: 7'] ?? null;
            $personas = $v['Unnamed: 9'] ?? null;
            $comentario = $v['Unnamed: 15'] ?? null;
            $telefonoCliente = $v['Unnamed: 20'] ?? null;
            $emailCliente = $v['Unnamed: 19'] ?? null;

            // Map Fudo payment methods
            $payMap = ['Efectivo' => 'cash', 'Tarj. Débito' => 'card', 'Tarj. Crédito' => 'card', 'Transferencia' => 'transfer', 'Mercado Pago' => 'transfer'];
            $payment = $payMap[$metodoPago] ?? 'cash';

            // Map Fudo sale types
            $typeMap = ['Local' => 'dine_in', 'Mostrador' => 'takeout', 'Delivery' => 'delivery', 'Para llevar' => 'takeout'];
            $type = $typeMap[$tipoVenta] ?? 'dine_in';

            // Map status
            $statusMap = ['Cerrada' => 'delivered', 'Cancelada' => 'cancelled', 'Abierta' => 'pending'];
            $status = $statusMap[$estado] ?? 'delivered';

            $batch[] = [
                'order_number' => strval($v['Desde']),
                'customer' => ['name' => $cliente ?? '', 'phone' => $telefonoCliente ?? '', 'email' => $emailCliente ?? ''],
                'items' => [['name' => 'Venta Fudo #' . $v['Desde'], 'quantity' => 1, 'price' => $total, 'menu_item_id' => '', 'modifiers' => []]],
                'subtotal' => $total,
                'tax' => 0,
                'total' => $total,
                'status' => $status,
                'source' => 'fudo',
                'type' => $type,
                'notes' => $comentario ?? '',
                'delivery_address' => '',
                'payment_method' => $payment,
                'payment_status' => 'paid',
                'tip' => 0,
                'prepared_items' => [],
                'table_id' => $mesa,
                'guest_count' => is_numeric($personas) ? intval($personas) : null,
                'created_at' => $creacion ? new \DateTime($creacion) : now(),
                'updated_at' => $cerrada ? new \DateTime($cerrada) : now(),
                'closed_at' => $cerrada,
                'channel' => strtolower($tipoVenta),
            ];

            if (count($batch) >= 500) {
                Order::insert($batch);
                $count += count($batch);
                $batch = [];
                $this->output->write("\r  Orders: {$count} migrated...");
            }
        }

        if (count($batch) > 0) {
            Order::insert($batch);
            $count += count($batch);
        }

        $this->info("\n  Orders: {$count} total migrated");
    }

    private function migrateIngredients()
    {
        $file = $this->dataPath . '/ingredientes.json';
        if (!file_exists($file)) { $this->warn('ingredientes.json not found'); return; }

        $data = json_decode(file_get_contents($file), true);
        $count = 0;

        foreach ($data as $i) {
            $nombre = $i['Nombre'] ?? null;
            if (!$nombre) continue;

            Ingredient::updateOrCreate(
                ['name' => $nombre],
                [
                    'category' => $i['Categoría'] ?? '',
                    'unit' => $i['Unidad'] ?? 'kg',
                    'cost_per_unit' => floatval($i['Costo'] ?? 0),
                    'current_stock' => floatval($i['Stock'] ?? 0),
                    'min_stock' => 0,
                    'supplier' => $i['Proveedor'] ?? '',
                ]
            );
            $count++;
        }

        $this->info("  Ingredients: {$count} migrated");
    }

    private function migrateSuppliers()
    {
        $file = $this->dataPath . '/proveedores.json';
        if (!file_exists($file)) { $this->warn('proveedores.json not found'); return; }

        $data = json_decode(file_get_contents($file), true);
        $count = 0;

        foreach ($data as $s) {
            $nombre = $s['Nombre'] ?? null;
            if (!$nombre || ($s['Activo'] ?? '') !== 'Sí') continue;

            Supplier::updateOrCreate(
                ['name' => $nombre],
                [
                    'email' => $s['Email'] ?? '',
                    'phone' => $s['Teléfono'] ?? '',
                    'address' => $s['Dirección'] ?? '',
                    'tax_id' => $s['Nro. Fiscal'] ?? '',
                    'notes' => $s['Comentario'] ?? '',
                    'active' => true,
                ]
            );
            $count++;
        }

        $this->info("  Suppliers: {$count} migrated");
    }

    private function migrateCashRegisters()
    {
        $file = $this->dataPath . '/arqueos_caja.json';
        if (!file_exists($file)) { $this->warn('arqueos_caja.json not found, skipping cash registers'); return; }

        $data = json_decode(file_get_contents($file), true);
        $count = 0;
        $batch = [];

        foreach ($data as $a) {
            $status = $a['status'] ?? 'cerrado';
            if ($status === 'eliminado') continue;

            $batch[] = [
                'name' => $a['name'] ?? 'Principal',
                'opened_by' => 'admin',
                'opened_at' => $a['opened_at'] ? new \DateTime($a['opened_at']) : now(),
                'closed_at' => $a['closed_at'] ? new \DateTime($a['closed_at']) : null,
                'initial_amount' => 0,
                'expected_amount' => $a['system_amount'] ?? 0,
                'actual_amount' => $a['user_amount'] ?? 0,
                'system_amount' => $a['system_amount'] ?? 0,
                'user_amount' => $a['user_amount'] ?? 0,
                'difference' => $a['difference'] ?? 0,
                'status' => $status === 'cerrado' ? 'closed' : 'open',
                'movements' => [],
                'summary' => [
                    'total_sales' => $a['system_amount'] ?? 0,
                    'total_cash' => 0,
                    'total_card' => 0,
                    'total_transfer' => 0,
                    'total_tips' => 0,
                    'total_expenses' => 0,
                    'total_withdrawals' => 0,
                ],
                'created_at' => $a['opened_at'] ? new \DateTime($a['opened_at']) : now(),
                'updated_at' => $a['closed_at'] ? new \DateTime($a['closed_at']) : now(),
            ];

            if (count($batch) >= 500) {
                CashRegister::insert($batch);
                $count += count($batch);
                $batch = [];
                $this->output->write("\r  Cash Registers: {$count} migrated...");
            }
        }

        if (count($batch) > 0) {
            CashRegister::insert($batch);
            $count += count($batch);
        }

        $this->info("\n  Cash Registers: {$count} total migrated");
    }
}

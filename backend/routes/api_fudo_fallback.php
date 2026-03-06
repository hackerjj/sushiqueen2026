<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/**
 * Rutas de fallback que sirven datos desde JSON cuando MongoDB no está disponible
 * Estas rutas se usan temporalmente hasta que se configure MongoDB
 */

$dataPath = storage_path('app/fudo_data');

// Clientes desde JSON
Route::get('/admin/customers-json', function () use ($dataPath) {
    $clientesFile = $dataPath . '/clientes.json';
    $ventasFile = $dataPath . '/ventas.json';
    
    if (!file_exists($clientesFile)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $clientes = json_decode(file_get_contents($clientesFile), true);
    
    // Cargar ventas para calcular totales
    $ventas = [];
    if (file_exists($ventasFile)) {
        $ventas = json_decode(file_get_contents($ventasFile), true);
    }
    
    // Calcular totales por cliente (usando nombre como clave)
    $totalesPorCliente = [];
    foreach ($ventas as $venta) {
        // El nombre del cliente está en Unnamed: 10
        $clienteNombre = $venta['Unnamed: 10'] ?? null;
        $total = floatval($venta['Unnamed: 12'] ?? 0);
        $fecha = $venta['01/01/2021 00:00'] ?? null;
        
        if ($clienteNombre && $total > 0) {
            $nombreNormalizado = strtoupper(trim($clienteNombre));
            if (!isset($totalesPorCliente[$nombreNormalizado])) {
                $totalesPorCliente[$nombreNormalizado] = ['ordenes' => 0, 'gastado' => 0, 'ultima_orden' => null];
            }
            $totalesPorCliente[$nombreNormalizado]['ordenes']++;
            $totalesPorCliente[$nombreNormalizado]['gastado'] += $total;
            if ($fecha && (!$totalesPorCliente[$nombreNormalizado]['ultima_orden'] || $fecha > $totalesPorCliente[$nombreNormalizado]['ultima_orden'])) {
                $totalesPorCliente[$nombreNormalizado]['ultima_orden'] = $fecha;
            }
        }
    }
    
    // Transformar a formato esperado
    $transformed = array_map(function($c) use ($totalesPorCliente) {
        $nombre = strtoupper(trim($c['Nombre'] ?? ''));
        $totales = $totalesPorCliente[$nombre] ?? ['ordenes' => 0, 'gastado' => 0, 'ultima_orden' => null];
        
        return [
            '_id' => strval($c['Id'] ?? uniqid()),
            'name' => $c['Nombre'] ?? 'Cliente',
            'phone' => $c['Teléfono'] ?? '',
            'email' => $c['Email'] ?? '',
            'address' => trim(($c['Calle'] ?? '') . ' ' . ($c['Número'] ?? '') . ' ' . ($c['Ciudad'] ?? '')),
            'source' => 'fudo',
            'tier' => 'regular',
            'total_orders' => $totales['ordenes'],
            'total_spent' => $totales['gastado'],
            'last_order_at' => $totales['ultima_orden'],
            'created_at' => now(),
        ];
    }, $clientes);
    
    return response()->json(['data' => $transformed]);
});

// Dashboard KPIs desde JSON de ventas
Route::get('/admin/dashboard-json', function () use ($dataPath) {
    $file = $dataPath . '/ventas.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [
            'sales_today' => 0, 'sales_week' => 0, 'sales_month' => 0,
            'orders_today' => 0, 'orders_week' => 0, 'new_customers_week' => 0, 'top_items' => [],
        ]]);
    }
    
    $ventas = json_decode(file_get_contents($file), true);
    $now = new \DateTime();
    $todayStr = $now->format('Y-m-d');
    $weekAgo = (clone $now)->modify('-7 days');
    $monthStart = new \DateTime($now->format('Y-m-01'));
    
    $salesToday = 0; $salesWeek = 0; $salesMonth = 0;
    $ordersToday = 0; $ordersWeek = 0;
    $customers = [];
    
    foreach ($ventas as $v) {
        if (!isset($v['Desde']) || !is_numeric($v['Desde'])) continue;
        $total = floatval($v['Unnamed: 12'] ?? 0);
        if ($total <= 0) continue;
        
        $creacion = $v['Unnamed: 2'] ?? $v['01/01/2021 00:00'] ?? null;
        if (!$creacion) continue;
        
        try {
            $fecha = new \DateTime($creacion);
        } catch (\Exception $e) { continue; }
        
        if ($fecha->format('Y-m-d') === $todayStr) { $salesToday += $total; $ordersToday++; }
        if ($fecha >= $weekAgo) { $salesWeek += $total; $ordersWeek++; }
        if ($fecha >= $monthStart) { $salesMonth += $total; }
        
        $cliente = $v['Unnamed: 6'] ?? null;
        if ($cliente && $fecha >= $weekAgo) { $customers[$cliente] = true; }
    }
    
    return response()->json(['data' => [
        'sales_today' => round($salesToday),
        'sales_week' => round($salesWeek),
        'sales_month' => round($salesMonth),
        'orders_today' => $ordersToday,
        'orders_week' => $ordersWeek,
        'new_customers_week' => count($customers),
        'top_items' => [],
    ]]);
});

// Ventas/Órdenes desde JSON
Route::get('/admin/orders-json', function (Request $request) use ($dataPath) {
    $file = $dataPath . '/ventas.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $ventas = json_decode(file_get_contents($file), true);
    
    // Transformar a formato esperado con campos reales de Fudo
    $transformed = [];
    foreach ($ventas as $v) {
        // Skip header rows
        if (!isset($v['Desde']) || !is_numeric($v['Desde'])) {
            continue;
        }
        
        $id = $v['Desde'];
        $fecha = $v['01/01/2021 00:00'] ?? null;
        $creacion = $v['Unnamed: 2'] ?? null;
        $cerrada = $v['Unnamed: 3'] ?? null;
        $cliente = $v['Unnamed: 6'] ?? null;
        $total = floatval($v['Unnamed: 12'] ?? 0);
        $tipoVenta = $v['Unnamed: 14'] ?? 'Local';
        $metodoPago = $v['Unnamed: 11'] ?? 'Efectivo';
        
        // Skip if no total
        if ($total <= 0) {
            continue;
        }
        
        // Calcular tiempo de entrega en minutos
        $tiempoEntrega = null;
        if ($creacion && $cerrada) {
            try {
                $tCreacion = new \DateTime($creacion);
                $tCerrada = new \DateTime($cerrada);
                $diff = $tCerrada->getTimestamp() - $tCreacion->getTimestamp();
                if ($diff > 0 && $diff < 86400) { // menos de 24h
                    $tiempoEntrega = round($diff / 60);
                }
            } catch (\Exception $e) {}
        }
        
        $transformed[] = [
            '_id' => strval($id),
            'order_number' => $id,
            'created_at' => $creacion ?? $fecha,
            'closed_at' => $cerrada,
            'delivery_time_min' => $tiempoEntrega,
            'customer_name' => $cliente,
            'type' => $tipoVenta,
            'total' => $total,
            'payment_method' => $metodoPago,
            'source' => 'fudo',
            'status' => 'delivered',
            'items' => [
                ['name' => 'Venta', 'quantity' => 1, 'price' => $total]
            ],
        ];
    }
    
    // Filtrar por nombre de cliente si se proporciona customer_name
    if ($customerName = $request->input('customer_name')) {
        $transformed = array_filter($transformed, function ($v) use ($customerName) {
            return $v['customer_name'] && stripos($v['customer_name'], $customerName) !== false;
        });
        $transformed = array_values($transformed);
    }

    // Ordenar por fecha de creación descendente (más recientes primero)
    usort($transformed, function($a, $b) {
        return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
    });
    
    // Paginación
    $page = intval($request->input('page', 1));
    $perPage = intval($request->input('per_page', 50));
    if ($perPage > 400) $perPage = 400;
    
    $totalCount = count($transformed);
    $offset = ($page - 1) * $perPage;
    $paginated = array_slice($transformed, $offset, $perPage);
    
    return response()->json([
        'data' => array_values($paginated),
        'meta' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $totalCount,
            'last_page' => ceil($totalCount / $perPage),
        ]
    ]);
});

// Productos/Menú — Sushi Queen menu con fotos (fuente de verdad)
Route::get('/admin/menu-json', function () use ($dataPath) {
    // Primero intentar el menú curado de Sushi Queen con fotos
    $sqFile = $dataPath . '/sushi_queen_menu.json';
    if (file_exists($sqFile)) {
        $items = json_decode(file_get_contents($sqFile), true);
        if (is_array($items) && count($items) > 0) {
            return response()->json(['data' => $items]);
        }
    }
    
    // Fallback al archivo de Fudo si no existe el curado
    $file = $dataPath . '/productos.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $productos = json_decode(file_get_contents($file), true);
    
    $unique = [];
    foreach ($productos as $p) {
        if (($p['Activo'] ?? 'No') !== 'Si') continue;
        $nombre = $p['Nombre'] ?? '';
        if (!$nombre || isset($unique[$nombre])) continue;
        
        $tieneModificadores = ($p['Contiene modificadores'] ?? 'No') === 'Si';
        
        $unique[$nombre] = [
            '_id' => strval($p['ID'] ?? uniqid()),
            'name' => $nombre,
            'description' => $p['Descripción'] ?? '',
            'price' => floatval($p['Precio'] ?? 0),
            'cost' => floatval($p['Costo'] ?? 0),
            'category' => $p['Categoría'] ?? 'General',
            'subcategory' => $p['Subcategoría'] ?? '',
            'code' => $p['Código'] ?? '',
            'available' => true,
            'image_url' => '',
            'stock' => $p['Stock'] ?? null,
            'stock_control' => ($p['Control de Stock'] ?? 'No') === 'Si',
            'has_modifiers' => $tieneModificadores,
            'modifiers' => $tieneModificadores ? [] : null,
            'allow_sell_alone' => ($p['Permitir vender solo'] ?? 'Si') === 'Si',
            'favorite' => ($p['Favorito'] ?? 'No') === 'Si',
            'supplier' => $p['Proveedor'] ?? '',
            'margin' => floatval($p['Margen'] ?? 0),
            'position' => intval($p['Posición'] ?? 0),
        ];
    }
    
    return response()->json(['data' => array_values($unique)]);
});

// Ingredientes desde JSON
Route::get('/admin/ingredients-json', function () use ($dataPath) {
    $file = $dataPath . '/ingredientes.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $ingredientes = json_decode(file_get_contents($file), true);
    
    $transformed = array_map(function($i) {
        return [
            '_id' => $i['id'] ?? uniqid(),
            'name' => $i['nombre'] ?? $i['name'] ?? 'Ingrediente',
            'unit' => $i['unidad'] ?? 'kg',
            'current_stock' => $i['stock_actual'] ?? 0,
            'min_stock' => $i['stock_minimo'] ?? 0,
            'cost_per_unit' => $i['costo_unitario'] ?? 0,
            'category' => $i['categoria'] ?? '',
        ];
    }, $ingredientes);
    
    return response()->json(['data' => $transformed]);
});

// Proveedores desde JSON
Route::get('/admin/suppliers-json', function () use ($dataPath) {
    $file = $dataPath . '/proveedores.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $proveedores = json_decode(file_get_contents($file), true);
    
    $transformed = array_map(function($p) {
        return [
            '_id' => $p['id'] ?? uniqid(),
            'name' => $p['nombre'] ?? $p['name'] ?? 'Proveedor',
            'contact' => $p['contacto'] ?? '',
            'phone' => $p['telefono'] ?? $p['phone'] ?? '',
            'email' => $p['email'] ?? '',
            'address' => $p['direccion'] ?? '',
            'products' => $p['productos'] ?? [],
        ];
    }, $proveedores);
    
    return response()->json(['data' => $transformed]);
});

// Movimientos de caja desde JSON
Route::get('/admin/cash-register-json', function () use ($dataPath) {
    $file = $dataPath . '/movimientos_caja.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $movimientos = json_decode(file_get_contents($file), true);
    
    $transformed = array_map(function($m) {
        return [
            '_id' => $m['id'] ?? uniqid(),
            'type' => $m['tipo'] ?? 'sale',
            'amount' => $m['monto'] ?? 0,
            'description' => $m['descripcion'] ?? '',
            'created_at' => $m['fecha'] ?? now(),
        ];
    }, $movimientos);
    
    return response()->json(['data' => $transformed]);
});

// Detalle de cliente con órdenes desde JSON
Route::get('/admin/customers-json/{id}', function ($id) use ($dataPath) {
    $clientesFile = $dataPath . '/clientes.json';
    $ventasFile = $dataPath . '/ventas.json';
    
    if (!file_exists($clientesFile) || !file_exists($ventasFile)) {
        return response()->json(['error' => 'Data not found'], 404);
    }
    
    $clientes = json_decode(file_get_contents($clientesFile), true);
    $ventas = json_decode(file_get_contents($ventasFile), true);
    
    // Find customer by ID
    $customer = null;
    $customerNombre = null;
    foreach ($clientes as $c) {
        if (strval($c['Id'] ?? '') === strval($id)) {
            $customerNombre = strtoupper(trim($c['Nombre'] ?? ''));
            $customer = [
                '_id' => strval($c['Id']),
                'name' => $c['Nombre'] ?? 'Cliente',
                'phone' => $c['Teléfono'] ?? '',
                'email' => $c['Email'] ?? '',
                'address' => trim(($c['Calle'] ?? '') . ' ' . ($c['Número'] ?? '') . ' ' . ($c['Ciudad'] ?? '')),
                'source' => 'fudo',
                'tier' => 'regular',
                'total_orders' => 0,
                'total_spent' => 0,
                'preferences' => [],
                'ai_profile' => ['avg_order_value' => 0],
                'last_order_at' => null,
            ];
            break;
        }
    }
    
    if (!$customer) {
        return response()->json(['error' => 'Customer not found'], 404);
    }
    
    // Find customer orders by name
    $orders = [];
    $totalOrders = 0;
    $totalSpent = 0;
    
    foreach ($ventas as $v) {
        // Skip header rows
        if (!isset($v['Desde']) || !is_numeric($v['Desde'])) {
            continue;
        }
        
        $ventaNombre = strtoupper(trim($v['Unnamed: 10'] ?? ''));
        $total = floatval($v['Unnamed: 12'] ?? 0);
        
        if ($ventaNombre === $customerNombre && $total > 0) {
            $orderNumber = $v['Desde'] ?? rand(1000, 9999);
            $fecha = $v['01/01/2021 00:00'] ?? null;
            $metodoPago = $v['Unnamed: 11'] ?? 'Efectivo';
            $tipo = $v['Unnamed: 14'] ?? 'Local';
            
            // Map tipo to our format
            $orderType = 'dine_in';
            if (stripos($tipo, 'delivery') !== false || stripos($tipo, 'domicilio') !== false) {
                $orderType = 'delivery';
            } elseif (stripos($tipo, 'llevar') !== false || stripos($tipo, 'mostrador') !== false) {
                $orderType = 'takeout';
            }
            
            // Map payment method
            $paymentMethod = 'cash';
            if (stripos($metodoPago, 'tarj') !== false || stripos($metodoPago, 'card') !== false) {
                $paymentMethod = 'card';
            }
            
            $orders[] = [
                '_id' => uniqid(),
                'order_number' => $orderNumber,
                'customer_id' => $id,
                'items' => [
                    ['name' => 'Venta', 'quantity' => 1, 'price' => $total]
                ],
                'subtotal' => $total,
                'tax' => 0,
                'total' => $total,
                'status' => 'delivered',
                'source' => 'fudo',
                'type' => $orderType,
                'payment_method' => $paymentMethod,
                'created_at' => $fecha ?? now(),
            ];
            
            $totalOrders++;
            $totalSpent += $total;
            
            if ($fecha && (!$customer['last_order_at'] || $fecha > $customer['last_order_at'])) {
                $customer['last_order_at'] = $fecha;
            }
        }
    }
    
    // Update customer totals
    $customer['total_orders'] = $totalOrders;
    $customer['total_spent'] = $totalSpent;
    $customer['ai_profile']['avg_order_value'] = $totalOrders > 0 ? ($totalSpent / $totalOrders) : 0;
    
    return response()->json([
        'data' => array_merge($customer, ['orders' => $orders])
    ]);
});

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

// Ventas/Órdenes desde JSON
Route::get('/admin/orders-json', function (Request $request) use ($dataPath) {
    $file = $dataPath . '/ventas.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $ventas = json_decode(file_get_contents($file), true);
    
    // Transformar a formato esperado
    $transformed = [];
    foreach ($ventas as $v) {
        // Skip header rows
        if (!isset($v['Desde']) || !is_numeric($v['Desde'])) {
            continue;
        }
        
        $orderNumber = $v['Desde'] ?? rand(1000, 9999);
        $fecha = $v['01/01/2021 00:00'] ?? null;
        $clienteNombre = $v['Unnamed: 10'] ?? 'Cliente';
        $metodoPago = $v['Unnamed: 11'] ?? 'Efectivo';
        $total = floatval($v['Unnamed: 12'] ?? 0);
        $tipo = $v['Unnamed: 14'] ?? 'Local';
        
        // Skip if no total
        if ($total <= 0) {
            continue;
        }
        
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
        
        $transformed[] = [
            '_id' => uniqid(),
            'order_number' => $orderNumber,
            'customer_name' => $clienteNombre,
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
    }
    
    // Filtros
    if ($status = $request->input('status')) {
        $transformed = array_filter($transformed, fn($o) => $o['status'] === $status);
    }
    
    // Paginación simple
    $page = $request->input('page', 1);
    $perPage = $request->input('per_page', 20);
    $offset = ($page - 1) * $perPage;
    
    $paginated = array_slice($transformed, $offset, $perPage);
    
    return response()->json([
        'data' => array_values($paginated),
        'meta' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => count($transformed),
            'last_page' => ceil(count($transformed) / $perPage),
        ]
    ]);
});

// Productos/Menú desde JSON
Route::get('/admin/menu-json', function () use ($dataPath) {
    $file = $dataPath . '/productos.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $productos = json_decode(file_get_contents($file), true);
    
    // Agrupar productos únicos por nombre (solo activos)
    $unique = [];
    foreach ($productos as $p) {
        // Skip if not active
        if (($p['Activo'] ?? 'No') !== 'Si') {
            continue;
        }
        
        $nombre = $p['Nombre'] ?? '';
        if (!$nombre || isset($unique[$nombre])) {
            continue;
        }
        
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

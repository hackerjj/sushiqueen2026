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
    $file = $dataPath . '/clientes.json';
    if (!file_exists($file)) {
        return response()->json(['data' => [], 'message' => 'No data'], 404);
    }
    
    $clientes = json_decode(file_get_contents($file), true);
    
    // Transformar a formato esperado
    $transformed = array_map(function($c) {
        return [
            '_id' => $c['id'] ?? uniqid(),
            'name' => $c['nombre'] ?? $c['name'] ?? 'Cliente',
            'phone' => $c['telefono'] ?? $c['phone'] ?? '',
            'email' => $c['email'] ?? '',
            'address' => $c['direccion'] ?? $c['address'] ?? '',
            'source' => 'fudo',
            'tier' => 'regular',
            'total_orders' => $c['total_ordenes'] ?? 0,
            'total_spent' => $c['total_gastado'] ?? 0,
            'created_at' => $c['fecha_registro'] ?? now(),
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
    $transformed = array_map(function($v) {
        return [
            '_id' => $v['id'] ?? uniqid(),
            'order_number' => $v['numero_orden'] ?? $v['id'] ?? rand(1000, 9999),
            'customer_id' => $v['cliente_id'] ?? null,
            'items' => json_decode($v['productos'] ?? '[]', true) ?: [
                ['name' => $v['producto'] ?? 'Producto', 'quantity' => $v['cantidad'] ?? 1, 'price' => $v['precio'] ?? 0]
            ],
            'subtotal' => $v['subtotal'] ?? $v['total'] ?? 0,
            'tax' => $v['impuesto'] ?? 0,
            'total' => $v['total'] ?? 0,
            'status' => $v['estado'] ?? 'delivered',
            'source' => 'fudo',
            'type' => $v['tipo'] ?? 'dine_in',
            'payment_method' => $v['metodo_pago'] ?? 'cash',
            'created_at' => $v['fecha'] ?? $v['created_at'] ?? now(),
        ];
    }, $ventas);
    
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
    
    // Agrupar productos únicos por nombre
    $unique = [];
    foreach ($productos as $p) {
        $nombre = $p['nombre'] ?? $p['name'] ?? 'Producto';
        if (!isset($unique[$nombre])) {
            $unique[$nombre] = [
                '_id' => $p['id'] ?? uniqid(),
                'name' => $nombre,
                'description' => $p['descripcion'] ?? '',
                'price' => $p['precio'] ?? 0,
                'category' => $p['categoria'] ?? 'General',
                'available' => true,
                'image_url' => $p['imagen'] ?? '',
                'modifiers' => [],
            ];
        }
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
    
    // Find customer
    $customer = null;
    foreach ($clientes as $c) {
        if (($c['id'] ?? '') === $id || ($c['_id'] ?? '') === $id) {
            $customer = [
                '_id' => $c['id'] ?? $id,
                'name' => $c['nombre'] ?? $c['name'] ?? 'Cliente',
                'phone' => $c['telefono'] ?? $c['phone'] ?? '',
                'email' => $c['email'] ?? '',
                'address' => $c['direccion'] ?? $c['address'] ?? '',
                'source' => 'fudo',
                'tier' => 'regular',
                'total_orders' => $c['total_ordenes'] ?? 0,
                'total_spent' => $c['total_gastado'] ?? 0,
                'preferences' => [],
                'ai_profile' => ['avg_order_value' => $c['total_ordenes'] > 0 ? ($c['total_gastado'] / $c['total_ordenes']) : 0],
                'last_order_at' => $c['ultima_orden'] ?? null,
            ];
            break;
        }
    }
    
    if (!$customer) {
        return response()->json(['error' => 'Customer not found'], 404);
    }
    
    // Find customer orders
    $orders = [];
    foreach ($ventas as $v) {
        if (($v['cliente_id'] ?? '') === $id) {
            $orders[] = [
                '_id' => $v['id'] ?? uniqid(),
                'order_number' => $v['numero_orden'] ?? $v['id'] ?? rand(1000, 9999),
                'customer_id' => $id,
                'items' => json_decode($v['productos'] ?? '[]', true) ?: [
                    ['name' => $v['producto'] ?? 'Producto', 'quantity' => $v['cantidad'] ?? 1, 'price' => $v['precio'] ?? 0]
                ],
                'subtotal' => $v['subtotal'] ?? $v['total'] ?? 0,
                'tax' => $v['impuesto'] ?? 0,
                'total' => $v['total'] ?? 0,
                'status' => $v['estado'] ?? 'delivered',
                'source' => 'fudo',
                'type' => $v['tipo'] ?? 'dine_in',
                'payment_method' => $v['metodo_pago'] ?? 'cash',
                'created_at' => $v['fecha'] ?? $v['created_at'] ?? now(),
            ];
        }
    }
    
    return response()->json([
        'data' => array_merge($customer, ['orders' => $orders])
    ]);
});

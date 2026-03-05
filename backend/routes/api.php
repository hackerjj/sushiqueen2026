<?php

use App\Http\Controllers\AIController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\InsightsController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PromotionController;
use App\Http\Middleware\PrometheusMetrics;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Sushi Queen
|--------------------------------------------------------------------------
|
| Public and admin API endpoints.
|
*/

// ─── Prometheus Metrics Endpoint ──────────────────────────────────

Route::get('/metrics', function () {
    $metrics = PrometheusMetrics::renderMetrics();

    return response($metrics, 200, [
        'Content-Type' => 'text/plain; version=0.0.4; charset=utf-8',
    ]);
});

// ─── Health Check ────────────────────────────────────────────────

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'Sushi Queen API',
        'timestamp' => now()->toISOString(),
    ]);
});

// Debug endpoint - remove after testing
Route::get('/debug/db', function () {
    try {
        $connection = \Illuminate\Support\Facades\DB::connection('mongodb');
        $connection->command(['ping' => 1]);
        $count = \App\Models\MenuItem::count();
        return response()->json([
            'mongodb' => 'connected',
            'menu_items_count' => $count,
            'database' => config('database.connections.mongodb.database'),
            'dsn_set' => !empty(config('database.connections.mongodb.dsn')),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'mongodb' => 'error',
            'message' => $e->getMessage(),
            'dsn_set' => !empty(config('database.connections.mongodb.dsn')),
            'database' => config('database.connections.mongodb.database'),
        ], 500);
    }
});

// Seed endpoint - remove after use
Route::get('/debug/seed', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $count = \App\Models\MenuItem::count();
        return response()->json([
            'status' => 'seeded',
            'menu_items_count' => $count,
            'output' => \Illuminate\Support\Facades\Artisan::output(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// ─── Public Routes ───────────────────────────────────────────────

Route::prefix('menu')->group(function () {
    Route::get('/', [MenuController::class, 'index']);
    Route::get('/{category}', [MenuController::class, 'byCategory']);
});

Route::get('/promotions', [PromotionController::class, 'active']);

Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{id}/status', [OrderController::class, 'status']);

// ─── Fudo Test (temporary - remove after validating) ─────────────

Route::get('/fudo/test-connection', function () {
    try {
        $fudoService = new \App\Services\FudoService();
        $token = $fudoService->authenticate();

        return response()->json([
            'status' => 'ok',
            'message' => 'Fudo OAuth2 authentication successful',
            'token_preview' => substr($token, 0, 20) . '...',
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Fudo authentication failed: ' . $e->getMessage(),
        ], 500);
    }
});

Route::get('/fudo/test-menu', function () {
    try {
        $fudoService = new \App\Services\FudoService();
        $menu = $fudoService->getMenu();

        return response()->json([
            'status' => 'ok',
            'items_count' => count($menu),
            'sample' => array_slice($menu, 0, 3),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch Fudo menu: ' . $e->getMessage(),
        ], 500);
    }
});

Route::post('/fudo/sync-menu-public', function () {
    try {
        $fudoService = new \App\Services\FudoService();
        $result = $fudoService->syncMenuFromFudo();

        return response()->json([
            'status' => 'ok',
            'message' => 'Menu synced from Fudo',
            'data' => $result,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Sync failed: ' . $e->getMessage(),
        ], 500);
    }
});

// ─── Auth Routes ─────────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('jwt.auth')->group(function () {
        Route::post('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

// ─── Admin Routes (JWT Protected) ───────────────────────────────

Route::prefix('admin')->middleware(['jwt.auth'])->group(function () {

    Route::get('/dashboard', [OrderController::class, 'dashboard']);

    // Menu CRUD
    Route::get('/menu', [MenuController::class, 'index']);
    Route::post('/menu', [MenuController::class, 'store']);
    Route::put('/menu/{id}', [MenuController::class, 'update']);
    Route::delete('/menu/{id}', [MenuController::class, 'destroy']);

    // Promotions CRUD
    Route::get('/promotions', [PromotionController::class, 'index']);
    Route::post('/promotions', [PromotionController::class, 'store']);
    Route::put('/promotions/{id}', [PromotionController::class, 'update']);
    Route::delete('/promotions/{id}', [PromotionController::class, 'destroy']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::patch('/orders/{id}', [OrderController::class, 'update']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);

    // Leads
    Route::get('/leads', [CustomerController::class, 'leads']);

    // Insights / Analytics (Task 58)
    Route::get('/insights', [InsightsController::class, 'index']);
    Route::post('/insights/track', [InsightsController::class, 'track']);
});

// ─── Integration Routes (JWT Protected) ─────────────────────────

Route::prefix('fudo')->middleware(['jwt.auth'])->group(function () {
    Route::post('/sync-menu', function () {
        try {
            $fudoService = new \App\Services\FudoService();
            $result = $fudoService->syncMenuFromFudo();

            return response()->json([
                'message' => 'Menu synced from Fudo successfully',
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Menu sync failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    });
});

Route::prefix('whatsapp')->middleware(['jwt.auth'])->group(function () {
    // Send a WhatsApp message (admin)
    Route::post('/send', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'to' => 'required|string',
            'message' => 'required|string',
        ]);

        try {
            $whatsapp = new \App\Services\WhatsAppService();
            $result = $whatsapp->sendTextMessage($validated['to'], $validated['message']);

            return response()->json([
                'message' => 'WhatsApp message sent',
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Failed to send WhatsApp message',
                'message' => $e->getMessage(),
            ], 500);
        }
    });

    // Send interactive menu to a customer (admin)
    Route::post('/send-menu', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'to' => 'required|string',
        ]);

        try {
            $whatsapp = new \App\Services\WhatsAppService();
            $result = $whatsapp->sendInteractiveMenu($validated['to']);

            return response()->json([
                'message' => 'Interactive menu sent',
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Failed to send menu',
                'message' => $e->getMessage(),
            ], 500);
        }
    });
});

Route::prefix('ai')->middleware(['jwt.auth'])->group(function () {
    Route::post('/recommend/{customer_id}', [AIController::class, 'recommend']);
    Route::post('/analyze/{customer_id}', [AIController::class, 'analyzePreferences']);
});

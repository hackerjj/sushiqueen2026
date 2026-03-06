<?php

use App\Http\Controllers\AIController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\InsightsController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\WebhookController;
use App\Http\Middleware\PrometheusMetrics;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - MealLi POS (formerly Sushi Queen + Fudo)
|--------------------------------------------------------------------------
*/

// ─── Prometheus Metrics ──────────────────────────────────────────

Route::get('/metrics', function () {
    return response(PrometheusMetrics::renderMetrics(), 200, [
        'Content-Type' => 'text/plain; version=0.0.4; charset=utf-8',
    ]);
});

// ─── Health Check ────────────────────────────────────────────────

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'MealLi POS API',
        'timestamp' => now()->toISOString(),
    ]);
});

// ─── Seed Endpoint (for initial data population) ─────────────────

Route::get('/seed', function () {
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    return response()->json(['message' => 'Database seeded successfully']);
});

// ─── Public Routes ───────────────────────────────────────────────

Route::prefix('menu')->group(function () {
    Route::get('/', [MenuController::class, 'index']);
    Route::get('/{category}', [MenuController::class, 'byCategory']);
});

Route::get('/promotions', [PromotionController::class, 'active']);

Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{id}/status', [OrderController::class, 'status']);

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

    // Dashboard
    Route::get('/dashboard', [OrderController::class, 'dashboard']);

    // Menu CRUD
    Route::get('/menu', [MenuController::class, 'index']);
    Route::get('/menu/export-csv', [MenuController::class, 'exportCsv']);
    Route::post('/menu/import-csv', [MenuController::class, 'importCsv']);
    Route::post('/menu', [MenuController::class, 'store']);
    Route::put('/menu/{id}', [MenuController::class, 'update']);
    Route::post('/menu/{id}/image', [MenuController::class, 'uploadImage']);
    Route::delete('/menu/{id}', [MenuController::class, 'destroy']);

    // Promotions CRUD
    Route::get('/promotions', [PromotionController::class, 'index']);
    Route::post('/promotions', [PromotionController::class, 'store']);
    Route::put('/promotions/{id}', [PromotionController::class, 'update']);
    Route::delete('/promotions/{id}', [PromotionController::class, 'destroy']);

    // Orders (MealLi POS)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::patch('/orders/{id}', [OrderController::class, 'update']);
    Route::post('/orders/{id}/pay', [OrderController::class, 'pay']);
    Route::get('/orders/kitchen', [OrderController::class, 'kitchen']);
    Route::patch('/orders/{id}/items/{itemIndex}/prepared', [OrderController::class, 'markItemPrepared']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::get('/leads', [CustomerController::class, 'leads']);

    // Insights / Analytics
    Route::get('/insights', [InsightsController::class, 'index']);
    Route::get('/insights/reviews', [InsightsController::class, 'reviews']);
    Route::get('/insights/sales-trends', [InsightsController::class, 'salesTrends']);
    Route::post('/insights/track', [InsightsController::class, 'track']);

    // Cash Register (Caja)
    Route::get('/cash-register/current', [CashRegisterController::class, 'current']);
    Route::post('/cash-register/open', [CashRegisterController::class, 'open']);
    Route::post('/cash-register/close', [CashRegisterController::class, 'close']);
    Route::post('/cash-register/movement', [CashRegisterController::class, 'movement']);
    Route::get('/cash-register/history', [CashRegisterController::class, 'history']);

    // Inventory
    Route::get('/ingredients', [InventoryController::class, 'ingredients']);
    Route::post('/ingredients', [InventoryController::class, 'storeIngredient']);
    Route::put('/ingredients/{id}', [InventoryController::class, 'updateIngredient']);
    Route::delete('/ingredients/{id}', [InventoryController::class, 'destroyIngredient']);
    Route::post('/inventory/movement', [InventoryController::class, 'addMovement']);
    Route::get('/inventory/movements', [InventoryController::class, 'movements']);
    Route::get('/inventory/low-stock', [InventoryController::class, 'lowStockAlerts']);
    Route::post('/inventory/import-fudo', [InventoryController::class, 'importFudo']);

    // Recipes
    Route::get('/recipes', [RecipeController::class, 'index']);
    Route::post('/recipes', [RecipeController::class, 'store']);
    Route::put('/recipes/{id}', [RecipeController::class, 'update']);
    Route::delete('/recipes/{id}', [RecipeController::class, 'destroy']);
    Route::get('/recipes/{id}/cost', [RecipeController::class, 'cost']);

    // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

    // Tables
    Route::get('/tables', [TableController::class, 'index']);
    Route::post('/tables', [TableController::class, 'store']);
    Route::put('/tables/{id}', [TableController::class, 'update']);
    Route::patch('/tables/{id}/status', [TableController::class, 'updateStatus']);
    Route::delete('/tables/{id}', [TableController::class, 'destroy']);

    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::get('/expenses/summary', [ExpenseController::class, 'summary']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

    // Reports
    Route::get('/reports/sales', [ReportController::class, 'salesReport']);
    Route::get('/reports/customers', [ReportController::class, 'customerReport']);
    Route::get('/reports/products', [ReportController::class, 'productReport']);
    Route::get('/reports/revenue', [ReportController::class, 'revenueReport']);
});

// ─── WhatsApp Integration (JWT Protected) ───────────────────────

Route::prefix('whatsapp')->middleware(['jwt.auth'])->group(function () {
    Route::post('/send', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate(['to' => 'required|string', 'message' => 'required|string']);
        try {
            $whatsapp = new \App\Services\WhatsAppService();
            $result = $whatsapp->sendTextMessage($validated['to'], $validated['message']);
            return response()->json(['message' => 'WhatsApp message sent', 'data' => $result]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to send', 'message' => $e->getMessage()], 500);
        }
    });

    Route::post('/send-menu', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate(['to' => 'required|string']);
        try {
            $whatsapp = new \App\Services\WhatsAppService();
            $result = $whatsapp->sendInteractiveMenu($validated['to']);
            return response()->json(['message' => 'Interactive menu sent', 'data' => $result]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to send menu', 'message' => $e->getMessage()], 500);
        }
    });
});

// ─── AI Integration (JWT Protected) ─────────────────────────────

Route::prefix('ai')->middleware(['jwt.auth'])->group(function () {
    Route::post('/recommend/{customer_id}', [AIController::class, 'recommend']);
    Route::post('/analyze/{customer_id}', [AIController::class, 'analyzePreferences']);
});

// ─── Webhooks (Public - verified by service) ────────────────────

Route::prefix('webhooks')->group(function () {
    Route::get('/whatsapp', [WebhookController::class, 'whatsappVerify']);
    Route::post('/whatsapp', [WebhookController::class, 'whatsappIncoming']);
});

// ─── Fudo Data Fallback (JSON) ──────────────────────────────────
// Sirve datos desde JSON cuando MongoDB no está disponible
if (file_exists(__DIR__ . '/api_fudo_fallback.php')) {
    require __DIR__ . '/api_fudo_fallback.php';
}

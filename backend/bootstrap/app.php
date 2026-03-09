<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        health: '/up',
        then: function () {
            Route::prefix('webhooks')
                ->group(base_path('routes/webhooks.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \App\Http\Middleware\CorrelationId::class,
            \App\Http\Middleware\SecurityHeaders::class,
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\PrometheusMetrics::class,
        ]);

        $middleware->alias([
            'jwt.auth' => \App\Http\Middleware\JwtAuth::class,
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'metrics.auth' => \App\Http\Middleware\MetricsAuth::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->renderable(function (ModelNotFoundException $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found',
                ], 404);
            }
        });

        $exceptions->renderable(function (NotFoundHttpException $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Endpoint not found',
                ], 404);
            }
        });

        $exceptions->renderable(function (ValidationException $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->renderable(function (\Throwable $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                $isProduction = app()->environment('production');

                return response()->json([
                    'success' => false,
                    'message' => $isProduction ? 'Internal server error' : $e->getMessage(),
                ], 500);
            }
        });
    })
    ->create();

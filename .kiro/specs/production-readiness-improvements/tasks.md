# Tareas: Mejoras de Preparación para Producción

## Fase 1: Seguridad Crítica (Prioridad Máxima)

- [x] 1.1 Eliminar endpoint `/api/seed` de `backend/routes/api.php` y crear comando Artisan `SeedProductionCommand` en `backend/app/Console/Commands/` que ejecute `db:seed --force` con confirmación interactiva
  > Requisito: 1.1, 1.4

- [x] 1.2 Eliminar endpoint `/api/migrate-fudo` de `backend/routes/api.php` y crear comando Artisan `MigrateFudoProductionCommand` en `backend/app/Console/Commands/` con la lógica existente
  > Requisito: 1.2, 1.5

- [x] 1.3 Eliminar endpoint `/api/post-deploy` de `backend/routes/api.php` y crear comando Artisan `PostDeployCommand` en `backend/app/Console/Commands/` con la lógica de seed de menú y recálculo de stats de clientes
  > Requisito: 1.3, 1.6

- [x] 1.4 Limpiar secretos de `render.yaml`: reemplazar valores literales de JWT_SECRET, APP_KEY y MONGO_URI con `sync: false` para que se configuren como secretos en el dashboard de Render
  > Requisito: 2.1

- [x] 1.5 Eliminar la clave hardcodeada `sushiqueen2026migrate` de todo el repositorio y remover credenciales de admin del README.md
  > Requisito: 2.2, 2.3

- [x] 1.6 Crear archivo `SECURITY_ROTATION.md` con instrucciones para rotar JWT_SECRET, APP_KEY, credenciales MongoDB, tokens de WhatsApp y Gemini AI
  > Requisito: 2.4

- [x] 1.7 Crear middleware `MetricsAuth` en `backend/app/Http/Middleware/` que proteja `/api/metrics` con Bearer token desde variable de entorno `METRICS_TOKEN`, y aplicarlo en la ruta de métricas en `api.php`
  > Requisito: 4.1, 4.2

- [x] 1.8 Actualizar `monitoring/prometheus/prometheus.yml` para incluir header `Authorization: Bearer <token>` en la configuración de scraping
  > Requisito: 4.3

## Fase 2: Rate Limiting y CORS

- [x] 2.1 Crear `RateLimitServiceProvider` en `backend/app/Providers/` con configuraciones: login (5/min por IP), public-orders (10/min por IP), admin-api (60/min por usuario), registrarlo en `bootstrap/app.php`
  > Requisito: 3.1, 3.2, 3.3, 3.5

- [x] 2.2 Aplicar middleware `throttle:login` a la ruta `POST /api/auth/login`, `throttle:public-orders` a `POST /api/orders`, y `throttle:admin-api` al grupo de rutas admin en `backend/routes/api.php`
  > Requisito: 3.1, 3.2, 3.3, 3.4

- [x] 2.3 Configurar Redis como store de rate limiting en `backend/config/cache.php` y asegurar que `CACHE_DRIVER=redis` en producción
  > Requisito: 3.5, 12.5

- [x] 2.4 Actualizar `backend/config/cors.php`: cambiar `allowed_methods` de `['*']` a `['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']` y `allowed_headers` a lista explícita `['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Correlation-ID']`
  > Requisito: 5.1, 5.2

- [x] 2.5 Crear middleware `SecurityHeaders` en `backend/app/Http/Middleware/` que agregue X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security a todas las respuestas, y registrarlo en `bootstrap/app.php`
  > Requisito: 5.3

## Fase 3: Validación y Manejo de Errores (Backend)

- [x] 3.1 Crear trait `ApiResponse` en `backend/app/Http/Traits/` con métodos `success($data, $code)`, `error($message, $code, $errors)`, `notFound($message)`, `validationError($errors)` que retornen JSON con formato consistente
  > Requisito: 7.1

- [x] 3.2 Aplicar trait `ApiResponse` a todos los controllers existentes y reemplazar las respuestas `response()->json()` directas por los métodos del trait, corrigiendo los que retornan 200 en errores (especialmente `OrderController.index()` que retorna 200 con error)
  > Requisito: 7.1, 7.2

- [x] 3.3 Configurar el exception handler en `bootstrap/app.php` para retornar JSON con formato consistente en rutas API: 404 para ModelNotFoundException, 422 para ValidationException, 500 genérico sin stack trace en producción
  > Requisito: 7.3, 7.5

- [x] 3.4 Resolver la referencia a `FudoService` en `OrderController.store()`: crear clase stub `backend/app/Services/FudoService.php` con método `sendOrderToFudo()` que loguee warning y retorne null, o eliminar el bloque si Fudo ya no se usa
  > Requisito: 7.4

- [x] 3.5 Crear Form Requests: `StoreOrderRequest`, `UpdateOrderRequest` en `backend/app/Http/Requests/` con reglas de validación extraídas de `OrderController` y método `prepareForValidation()` con sanitización (trim, strip_tags)
  > Requisito: 6.1, 6.2, 6.3, 6.4

- [x] 3.6 Crear Form Requests: `StoreMenuItemRequest`, `UpdateMenuItemRequest`, `StoreIngredientRequest`, `StoreRecipeRequest`, `StorePromotionRequest`, `StoreExpenseRequest`, `StoreSupplierRequest` en `backend/app/Http/Requests/`
  > Requisito: 6.1, 6.2

- [x] 3.7 Actualizar todos los controllers para usar type-hint de Form Request en lugar de `Illuminate\Http\Request` en los métodos que reciben datos
  > Requisito: 6.3, 6.4

## Fase 4: Retry Logic y Confiabilidad

- [x] 4.1 Crear trait `RetryableHttpCall` en `backend/app/Http/Traits/` con método `retryWithBackoff(callable $fn, int $maxRetries = 3)` que implemente backoff exponencial (1s, 2s, 4s) y loguee cada intento
  > Requisito: 8.1, 8.2, 8.3

- [x] 4.2 Aplicar `RetryableHttpCall` a `WhatsAppService` para todas las llamadas HTTP a la API de WhatsApp Business
  > Requisito: 8.1, 8.4

- [x] 4.3 Aplicar `RetryableHttpCall` a `AIController` / servicio de Gemini AI para todas las llamadas HTTP a Google Gemini
  > Requisito: 8.2, 8.4

## Fase 5: Rendimiento y Base de Datos

- [x] 5.1 Crear migration `CreateMongoIndexes` en `backend/database/migrations/` que cree índices: orders `{created_at: -1, status: 1}`, orders `{customer_id: 1}`, customers `{phone: 1}` (unique), menu_items `{category: 1, available: 1}`, product_sales `{date: -1}`
  > Requisito: 13.1, 13.2, 13.3, 13.4, 13.5

- [x] 5.2 Agregar paginación a `CustomerController.index()`, `InventoryController.ingredients()`, y `SupplierController.index()` usando `->paginate($request->input('per_page', 20))` con máximo de 100
  > Requisito: 11.1, 11.2, 11.3

- [x] 5.3 Implementar caching Redis en `OrderController.dashboard()`: cachear resultado por 5 minutos con key basada en parámetros de fecha, invalidar cache al crear/actualizar órdenes
  > Requisito: 12.1, 12.4

- [x] 5.4 Implementar caching Redis en `MenuController.index()` (menú público, 15 min) y `PromotionController.active()` (30 min), con invalidación al crear/actualizar items de menú o promociones
  > Requisito: 12.2, 12.3, 12.4

- [x] 5.5 Agregar trait `SoftDeletes` a modelos `Order` y `Customer` en `backend/app/Models/`
  > Requisito: 14.1, 14.2, 14.3

## Fase 6: Observabilidad

- [x] 6.1 Configurar canal de logging JSON en `backend/config/logging.php`: agregar canal `json` con formato JSON estructurado y configurarlo como default en producción
  > Requisito: 15.1, 15.4

- [x] 6.2 Crear middleware `CorrelationId` en `backend/app/Http/Middleware/` que genere UUID v4 como `X-Correlation-ID`, lo agregue al request y response, y lo incluya en el contexto de logging de Laravel
  > Requisito: 15.2, 15.3

- [x] 6.3 Registrar middleware `CorrelationId` en `bootstrap/app.php` como middleware global de API
  > Requisito: 15.2

- [x] 6.4 Mejorar endpoint `GET /api/health` en `backend/routes/api.php`: agregar ping a MongoDB (`DB::connection('mongodb')->getMongoClient()->selectDatabase('admin')->command(['ping' => 1])`), ping a Redis, retornar 503 si alguno falla, incluir versión de app y uptime
  > Requisito: 16.1, 16.2, 16.3, 16.4

## Fase 7: Frontend

- [x] 7.1 Crear componente `ErrorBoundary` en `frontend/src/components/ErrorBoundary.tsx` como class component que capture errores de renderizado, muestre UI de fallback con mensaje y botón "Reintentar", y loguee errores a console.error
  > Requisito: 9.1, 9.2, 9.3

- [x] 7.2 Crear componente `AuthGuard` en `frontend/src/components/AuthGuard.tsx` que verifique JWT token en el store de auth y redirija a `/admin/login` si no existe token válido
  > Requisito: 10.1, 10.2, 10.3

- [x] 7.3 Crear página `NotFound` en `frontend/src/pages/NotFound.tsx` con diseño consistente con el resto de la app y link para volver al inicio
  > Requisito: 10.4

- [x] 7.4 Actualizar `frontend/src/App.tsx`: envolver la app con `ErrorBoundary`, envolver rutas admin con `AuthGuard`, agregar ruta catch-all `<Route path="*" element={<NotFound />} />`
  > Requisito: 9.1, 10.2, 10.5

## Fase 8: Testing y CI

- [x] 8.1 Eliminar `|| true` de los comandos de test en `.github/workflows/ci.yml` para que tests fallidos causen fallo del build
  > Requisito: 17.1

- [x] 8.2 Crear tests unitarios en `backend/tests/Feature/` para: DashboardApiTest, CustomerApiTest, InventoryApiTest, PromotionApiTest, CashRegisterApiTest
  > Requisito: 18.1

- [x] 8.3 Crear test de integración `OrderFlowTest` en `backend/tests/Feature/` que verifique: crear orden → customer creado/actualizado → total_orders incrementado → total_spent actualizado → tier recalculado
  > Requisito: 18.2

- [x] 8.4 Crear test de integración `AuthFlowTest` en `backend/tests/Feature/` que verifique: login → obtener token → acceder endpoint admin → refresh token → logout
  > Requisito: 18.3

- [x] 8.5 Crear tests frontend en `frontend/src/__tests__/` para componentes ErrorBoundary.test.tsx y AuthGuard.test.tsx
  > Requisito: 18.4

- [x] 8.6 Crear test property-based en `backend/tests/Feature/OrderPropertyTest.php` que verifique con data providers que Order.total siempre es igual a la suma de items.line_total
  > Requisito: 18.5

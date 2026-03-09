# Requisitos: Mejoras de Preparación para Producción

## Requisito 1: Eliminación de Endpoints Públicos Peligrosos

### Descripción
Eliminar los endpoints `/api/seed`, `/api/migrate-fudo` y `/api/post-deploy` de las rutas públicas y convertirlos en comandos Artisan protegidos que solo se ejecuten desde CLI.

### Criterios de Aceptación
- 1.1 El endpoint `GET /api/seed` ya no existe en las rutas de la API y retorna 404
- 1.2 El endpoint `GET /api/migrate-fudo` ya no existe en las rutas de la API y retorna 404
- 1.3 El endpoint `GET /api/post-deploy` ya no existe en las rutas de la API y retorna 404
- 1.4 Existe un comando Artisan `php artisan db:seed-production` que ejecuta la lógica del antiguo `/api/seed` con confirmación interactiva
- 1.5 Existe un comando Artisan `php artisan fudo:migrate-production` que ejecuta la lógica del antiguo `/api/migrate-fudo`
- 1.6 Existe un comando Artisan `php artisan post-deploy:run` que ejecuta la lógica del antiguo `/api/post-deploy`

---

## Requisito 2: Eliminación de Secretos Hardcodeados y Rotación de Credenciales

### Descripción
Remover todos los secretos expuestos en `render.yaml` y código fuente, reemplazándolos con referencias a variables de entorno seguras. Documentar el proceso de rotación de credenciales.

### Criterios de Aceptación
- 2.1 El archivo `render.yaml` no contiene valores literales para JWT_SECRET, APP_KEY, ni MONGO_URI; usa `sync: false` o referencia a secret groups de Render
- 2.2 La clave hardcodeada `sushiqueen2026migrate` no aparece en ningún archivo del repositorio
- 2.3 Las credenciales de admin (admin@sushiqueen.com / admin123) no aparecen en el README ni en ningún archivo del repositorio
- 2.4 Existe un archivo `SECURITY_ROTATION.md` con instrucciones paso a paso para rotar JWT_SECRET, APP_KEY, credenciales MongoDB y tokens de API externos

---

## Requisito 3: Rate Limiting

### Descripción
Implementar rate limiting en endpoints críticos usando Redis como store para prevenir ataques de fuerza bruta y abuso de la API.

### Criterios de Aceptación
- 3.1 El endpoint `POST /api/auth/login` tiene rate limit de 5 intentos por minuto por IP
- 3.2 Los endpoints públicos de órdenes (`POST /api/orders`) tienen rate limit de 10 por minuto por IP
- 3.3 Los endpoints admin tienen rate limit de 60 requests por minuto por usuario autenticado
- 3.4 Cuando se excede el rate limit, la API retorna HTTP 429 con header `Retry-After`
- 3.5 El rate limiting usa Redis como backend store

---

## Requisito 4: Protección del Endpoint de Métricas

### Descripción
Proteger el endpoint `/api/metrics` de Prometheus para que no sea accesible públicamente.

### Criterios de Aceptación
- 4.1 El endpoint `GET /api/metrics` requiere un Bearer token configurado via variable de entorno `METRICS_TOKEN`
- 4.2 Requests sin token o con token inválido a `/api/metrics` retornan HTTP 401
- 4.3 La configuración de Prometheus (`prometheus.yml`) incluye el header de autorización para scraping

---

## Requisito 5: Restricción de CORS

### Descripción
Restringir la configuración CORS para permitir solo métodos HTTP específicos y headers necesarios en lugar de wildcards.

### Criterios de Aceptación
- 5.1 `allowed_methods` en `cors.php` lista explícitamente: GET, POST, PUT, PATCH, DELETE, OPTIONS
- 5.2 `allowed_headers` en `cors.php` lista explícitamente los headers necesarios: Content-Type, Authorization, X-Requested-With, Accept, X-Correlation-ID
- 5.3 Se agregan headers de seguridad: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security via middleware

---

## Requisito 6: Form Requests y Validación

### Descripción
Extraer la validación inline de los controllers a clases Form Request dedicadas de Laravel, incluyendo sanitización de input.

### Criterios de Aceptación
- 6.1 Existe un Form Request para cada endpoint que recibe datos de entrada (mínimo: StoreOrderRequest, UpdateOrderRequest, StoreMenuItemRequest, UpdateMenuItemRequest, StoreIngredientRequest, StoreRecipeRequest, StorePromotionRequest, StoreExpenseRequest, StoreSupplierRequest)
- 6.2 Cada Form Request incluye sanitización de strings (trim, strip_tags) en el método `prepareForValidation()`
- 6.3 Los controllers usan type-hint de Form Request en lugar de `Request` genérico para endpoints con validación
- 6.4 La validación inline existente en controllers ha sido removida y reemplazada por Form Requests

---

## Requisito 7: Manejo de Errores Consistente (Backend)

### Descripción
Estandarizar las respuestas de error en todos los controllers para usar códigos HTTP correctos y un formato de respuesta consistente.

### Criterios de Aceptación
- 7.1 Existe un trait `ApiResponse` con métodos `success()`, `error()`, `notFound()`, `validationError()` que todos los controllers usan
- 7.2 Ningún controller retorna HTTP 200 cuando ocurre un error; los errores usan códigos 4xx/5xx apropiados
- 7.3 El exception handler global de Laravel retorna JSON con formato consistente para todas las excepciones en rutas API
- 7.4 La referencia a `FudoService` en `OrderController.store()` está resuelta (clase stub creada o referencia eliminada con manejo graceful)
- 7.5 Los errores en producción no exponen stack traces ni detalles internos del sistema

---

## Requisito 8: Retry Logic para Servicios Externos

### Descripción
Implementar lógica de reintentos con backoff exponencial para llamadas a servicios externos (WhatsApp Business API, Google Gemini AI).

### Criterios de Aceptación
- 8.1 Las llamadas a WhatsApp Business API reintentan hasta 3 veces con backoff exponencial (1s, 2s, 4s) antes de fallar
- 8.2 Las llamadas a Google Gemini AI reintentan hasta 3 veces con backoff exponencial antes de fallar
- 8.3 Los reintentos se registran en logs con nivel WARNING incluyendo el número de intento
- 8.4 El fallo final de un servicio externo no bloquea la operación principal del usuario

---

## Requisito 9: Error Boundaries en Frontend

### Descripción
Implementar componentes Error Boundary en React para capturar errores de renderizado y mostrar UI de fallback en lugar de pantalla blanca.

### Criterios de Aceptación
- 9.1 Existe un componente `ErrorBoundary` global que envuelve la aplicación y captura errores de renderizado
- 9.2 Cuando un componente admin falla, se muestra una UI de fallback con mensaje de error y botón "Reintentar"
- 9.3 Los errores capturados se registran en console.error con información del componente que falló

---

## Requisito 10: Auth Guard en Rutas Admin (Frontend)

### Descripción
Proteger todas las rutas `/admin/*` con un componente Auth Guard que verifique la existencia de un JWT válido antes de renderizar.

### Criterios de Aceptación
- 10.1 Existe un componente `AuthGuard` que verifica la presencia de JWT token en el store de autenticación
- 10.2 Todas las rutas `/admin/*` (excepto `/admin/login`) están envueltas por `AuthGuard`
- 10.3 Si no hay token válido, el usuario es redirigido a `/admin/login`
- 10.4 Existe una página 404 (NotFound) que se muestra para rutas no definidas
- 10.5 Existe una ruta catch-all `*` en React Router que renderiza la página 404

---

## Requisito 11: Paginación en Endpoints Admin

### Descripción
Agregar paginación a todos los endpoints de listado admin que actualmente retornan todos los registros sin límite.

### Criterios de Aceptación
- 11.1 Los endpoints `GET /api/admin/customers`, `GET /api/admin/ingredients`, `GET /api/admin/suppliers` retornan resultados paginados
- 11.2 La paginación usa parámetros `page` y `per_page` con default de 20 y máximo de 100
- 11.3 La respuesta paginada incluye metadata: `total`, `per_page`, `current_page`, `last_page`

---

## Requisito 12: Caching con Redis

### Descripción
Implementar caching estratégico usando Redis para reducir carga en MongoDB en endpoints de alto tráfico.

### Criterios de Aceptación
- 12.1 El endpoint de dashboard (`GET /api/admin/dashboard`) cachea resultados en Redis por 5 minutos
- 12.2 El endpoint de menú público (`GET /api/menu`) cachea resultados en Redis por 15 minutos
- 12.3 El endpoint de promociones activas (`GET /api/promotions`) cachea resultados en Redis por 30 minutos
- 12.4 El cache se invalida automáticamente cuando se crean/actualizan órdenes (dashboard) o items de menú (menú público)
- 12.5 La variable de entorno `CACHE_DRIVER` está configurada como `redis` en producción

---

## Requisito 13: Índices MongoDB

### Descripción
Crear índices en MongoDB para optimizar las queries más frecuentes del sistema.

### Criterios de Aceptación
- 13.1 Existe una migration de Laravel que crea índices en la colección `orders`: compuesto `{created_at: -1, status: 1}` y simple `{customer_id: 1}`
- 13.2 Existe un índice unique en `customers.phone`
- 13.3 Existe un índice compuesto en `menu_items`: `{category: 1, available: 1}`
- 13.4 Existe un índice en `product_sales`: `{date: -1}`
- 13.5 Los índices se crean via migration ejecutable con `php artisan migrate`

---

## Requisito 14: Soft Deletes en Modelos Críticos

### Descripción
Implementar soft deletes en modelos de datos críticos para prevenir pérdida accidental de información.

### Criterios de Aceptación
- 14.1 Los modelos `Order` y `Customer` usan el trait `SoftDeletes` de MongoDB/Laravel
- 14.2 Las queries existentes no se ven afectadas (soft deletes filtra automáticamente registros eliminados)
- 14.3 Existe un scope `withTrashed` disponible para consultar registros eliminados cuando sea necesario

---

## Requisito 15: Logging Estructurado y Correlation IDs

### Descripción
Implementar logging en formato JSON estructurado con correlation IDs para trazabilidad de requests.

### Criterios de Aceptación
- 15.1 El canal de logging de Laravel está configurado para formato JSON en producción
- 15.2 Existe un middleware que genera un UUID como `X-Correlation-ID` para cada request y lo incluye en la respuesta
- 15.3 Todos los logs generados durante un request incluyen el correlation ID en su contexto
- 15.4 El formato de log incluye: timestamp, level, correlation_id, message, context

---

## Requisito 16: Health Check Mejorado

### Descripción
Mejorar el endpoint de health check para verificar conectividad real con MongoDB y Redis.

### Criterios de Aceptación
- 16.1 El endpoint `GET /api/health` verifica conectividad a MongoDB ejecutando un ping
- 16.2 El endpoint `GET /api/health` verifica conectividad a Redis ejecutando un ping
- 16.3 Si MongoDB o Redis no responden, el health check retorna HTTP 503 con detalle de qué servicio falló
- 16.4 El health check incluye versión de la aplicación y uptime

---

## Requisito 17: Pipeline CI Robusto

### Descripción
Corregir el pipeline CI para que los tests sean obligatorios y el build falle si no pasan.

### Criterios de Aceptación
- 17.1 Los comandos de test en `.github/workflows/ci.yml` no usan `|| true`; un test fallido causa que el job falle
- 17.2 El pipeline incluye un step de linting (PHP CS Fixer para backend, ESLint para frontend si está configurado)
- 17.3 El pipeline ejecuta todos los tests existentes y nuevos sin ignorar fallos

---

## Requisito 18: Expansión de Tests

### Descripción
Aumentar la cobertura de tests del sistema con tests unitarios, de integración y property-based.

### Criterios de Aceptación
- 18.1 Existen tests unitarios para al menos 5 controllers adicionales del backend (Dashboard, Customer, Inventory, Promotion, CashRegister)
- 18.2 Existen tests de integración para el flujo completo de creación de orden (crear orden → customer actualizado → stats correctos)
- 18.3 Existen tests de integración para el flujo de autenticación (login → token → acceso admin → refresh)
- 18.4 El frontend tiene tests para los componentes ErrorBoundary y AuthGuard
- 18.5 Existe al menos un test property-based en backend que verifica que Order.total == sum(items.line_total)

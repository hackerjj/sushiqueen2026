# Changelog - MealLi POS (Sushi Queen)

## v2.4.1 — 2026-03-06

### Admin Fixes — Revisión Post-Deploy v2.4.0
- **Gastos paginación**: Backend pagina con `per_page`, frontend con selector Por página (50/100/200/400) y botones Anterior/Siguiente arriba de la tabla
- **Menú orden categorías**: Orden fijo de negocio (Especialidades primero, Bebidas al final) en vez de alfabético
- **Dashboard KPIs semanales**: Nuevos indicadores `orders_week`, `sales_week` y `new_customers_week` (últimos 60 días)
- **Ventas detalle**: Nuevo endpoint `GET /admin/orders/{id}` + modal al hacer clic en una fila mostrando items, estatus, cliente, total, método de pago
- **Caja timezone**: Timestamps formateados en `America/Mexico_City` (hora correcta de apertura/cierre)
- **Clientes paginación**: Controles movidos arriba de la tabla junto a filtros
- **Inventario paginación**: Botones Anterior/Siguiente visibles con labels

### Nota de deploy
- Ejecutar `php artisan menu:seed-from-data` en Render para corregir conteo de items del menú (111→104)

### Archivos modificados
- `backend/app/Http/Controllers/ExpenseController.php` — paginate()
- `backend/app/Http/Controllers/MenuController.php` — CATEGORY_ORDER constante
- `backend/app/Http/Controllers/OrderController.php` — dashboard KPIs semanales + show()
- `backend/routes/api.php` — ruta GET /admin/orders/{id}
- `frontend/src/pages/admin/Expenses.tsx` — paginación UI
- `frontend/src/pages/admin/Customers.tsx` — paginación arriba
- `frontend/src/pages/admin/Inventory.tsx` — arrows visibles
- `frontend/src/pages/admin/CashRegister.tsx` — timeZone America/Mexico_City
- `frontend/src/pages/admin/Orders.tsx` — modal detalle de orden
- `frontend/src/components/admin/AdminLayout.tsx` — versión v2.4.1
- `frontend/src/utils/mapDashboardResponse.ts` — orders_week, sales_week, new_customers_week

## v2.4.0 — 2026-03-06

### Menu Unification — Fuente Única de Verdad
- Nuevo comando `php artisan menu:seed-from-data` — upsert de 104 ítems de menuData.ts a MongoDB por nombre, preserva _ids, soft-delete de extras
- Nuevo endpoint `POST /api/admin/menu/seed` — seed vía API protegido con JWT
- Script `frontend/scripts/exportMenuData.cjs` — exporta menuData.ts a JSON para seed
- `useMenu()` hook ahora llama a `/api/menu` en vez de leer menuData.ts estático (fallback a menuData si API falla)
- POS: eliminado `enrichImages()` y dependencia de menuData.ts — MongoDB tiene imágenes correctas después del seed
- AIChatbot: ahora usa datos de API en vez de menuData.ts estático

### Dashboard Top Items — Cantidades Reales
- Filtro de items Fudo "Venta #..." a nivel de pipeline MongoDB (no se cuentan como productos)
- Solo órdenes POS con nombres reales de productos se agregan para Top Items
- Revenue de Fudo se muestra por separado como contexto
- Nota "Sin datos de productos — basado en menú" cuando no hay órdenes POS

### Clientes — Top 5 Productos
- `CustomerController::show()` ahora incluye `top_products` — top 5 productos más pedidos por cliente
- Frontend: sección "Productos Más Pedidos" en modal de detalle de cliente con tabla rankeada

### Archivos modificados
- `backend/app/Console/Commands/SeedMenuFromData.php` (NUEVO)
- `backend/app/Http/Controllers/MenuController.php` — endpoint seed
- `backend/app/Http/Controllers/OrderController.php` — dashboard top items con filtro Fudo
- `backend/app/Http/Controllers/CustomerController.php` — top_products aggregation
- `backend/routes/api.php` — ruta seed
- `backend/storage/app/menu_seed_data.json` (NUEVO)
- `frontend/scripts/exportMenuData.cjs` (NUEVO)
- `frontend/src/hooks/useMenu.ts` — API call con fallback
- `frontend/src/pages/admin/POS.tsx` — eliminado enrichImages
- `frontend/src/pages/admin/Customers.tsx` — top products en detail modal
- `frontend/src/pages/admin/Dashboard.tsx` — top_items_note display
- `frontend/src/components/chat/AIChatbot.tsx` — API call con fallback
- `frontend/src/components/admin/AdminLayout.tsx` — versión v2.4.0
- `frontend/src/types/index.ts` — top_items_note, fudo_revenue types
- `frontend/src/utils/mapDashboardResponse.ts` — nuevos campos

## v2.3.0 — 2026-03-06

### Fixes
- **Menú Admin**: Nuevo endpoint `adminIndex()` devuelve todos los items como flat array (antes mostraba 0 items por filtro `available=true` y formato agrupado)
- **Gastos fechas**: Cast `datetime` en modelo Expense — fechas ya no muestran "—"
- **Gastos categorías**: Resumen dinámico desde BD — muestra TODAS las categorías Fudo (consumibles, verduras, basura, importación, sueldos, cárnicos, abarrotes, mantenimiento, agua, etc.)
- **Gastos filtro fechas**: Nuevo selector "Personalizado" con date pickers y validación máximo 24 meses
- **Caja hora apertura**: Cast `datetime` en modelo CashRegister — hora de apertura/cierre correcta
- **Clientes tipo predominante**: `computePredominantOrderType()` mapea tipos Fudo (mostrador, salon, delivery, etc.) correctamente
- **Clientes ticket promedio**: Calcula `total_spent / total_orders` en vez de leer `ai_profile.avg_order_value` vacío
- **Clientes métricas**: `show()` recomputa total_orders y total_spent desde órdenes en tiempo real
- **Clientes per_page**: Selector con opciones 50/100/200/400 (antes hardcodeado a 50)
- **Inventario paginación**: Server-side pagination con selector 200/400
- **Inventario sorting**: Columnas ordenables (ingrediente, categoría, costo)
- **Ventas tiempo entrega**: `parseMongoDate()` parsea UTCDateTime correctamente, fallback a `delivery_time_min`
- **Dashboard top items**: Fallback a menu items cuando órdenes Fudo no tienen detalle de productos

### Archivos modificados
- `backend/app/Http/Controllers/MenuController.php` — nuevo `adminIndex()`
- `backend/app/Http/Controllers/ExpenseController.php` — summary dinámico
- `backend/app/Http/Controllers/CustomerController.php` — predominant type + show() metrics
- `backend/app/Http/Controllers/InventoryController.php` — pagination + sorting
- `backend/app/Http/Controllers/OrderController.php` — dashboard top items fallback
- `backend/app/Models/Expense.php` — cast date
- `backend/app/Models/CashRegister.php` — cast opened_at/closed_at
- `backend/app/Models/Order.php` — cast closed_at
- `backend/routes/api.php` — admin menu route → adminIndex
- `frontend/src/pages/admin/Expenses.tsx` — date picker, colores categorías dinámicas
- `frontend/src/pages/admin/Customers.tsx` — ticket promedio, per_page selector
- `frontend/src/pages/admin/Inventory.tsx` — pagination, sorting UI
- `frontend/src/pages/admin/Orders.tsx` — parseMongoDate, delivery time fix

## v2.2.0 — 2026-03-06

### Fixes
- Gastos movido debajo de Ventas en menú lateral
- Mesas en POS: cuadros de 70px que respetan grid de configuración
- Fechas "Invalid Date" arregladas en Caja y Gastos (parseo de formato "YYYY-MM-DD HH:MM:SS")
- Removidos casts 'array' de modelos MongoDB que causaban json_decode error
- Migración usa MongoDB UTCDateTime para todas las fechas
- Gastos migrados desde Excel (3,581 registros de 6 archivos)
- Proveedores: ahora guarda contact_name, phone, address, tax_id, notes
- Versión actualizada a v2.2.0

### Pendientes conocidos
- Inventario: verificar que nombres se muestren correctamente después de re-migración
- Proveedores: verificar datos después de re-migración
- Clientes: total gastado requiere re-correr step=stats después de migración
- Dashboard: Top Items muestra "Venta #" (las órdenes de Fudo no tienen detalle de productos)

## v2.1.0 — 2026-03-06

### POS - Punto de Venta
- **Mostrador**: Tablero estilo Fudo con 4 estados (Pendiente → En curso → A entregar → Cerradas últimas 10)
- **Delivery**: Tablero con 5 estados (Pendientes → En preparación → Listo → Enviados → Entregados últimos 50)
- **Mostrador Express**: Vista rápida con grid de productos con imágenes y categorías, solo pide Cliente + Comentario
- **Mesas**: Grid respeta posiciones de configuración, botones de 70px cuadrados
- **Buscador de productos**: Buscar por nombre en Mostrador/Delivery, botón "+" abre popup con grid de imágenes
- **Autocomplete clientes**: Busca por nombre, teléfono o email con sugerencias
- **Modal Nuevo Cliente**: Nombre, Teléfono, Email, Fecha nacimiento, RFC, Comentario
- **Modal Cerrar Pedido**: Propina + Pago + Vuelta (estilo Fudo)

### Dashboard
- KPIs: Ventas Hoy, Ventas Mes, Órdenes Hoy, Nuevos Clientes — datos de MongoDB
- Tabla Ventas Recientes: ID, Fecha, Cliente, Tipo de Venta (Local/Mostrador/Delivery), Estado, Total
- Top Items del mes

### Ventas (Gestión de Ventas)
- Tabla: ID, Fecha Creación, Tiempo Entrega, Cliente, Tipo de Venta, Total
- Filtro por cliente con autocomplete
- Paginación con selector de registros por página
- Lee directamente de MongoDB

### Caja (Arqueos de Caja)
- Tabla de arqueos: Hora apertura, Hora cierre, Caja, Sistema, Usuario, Diferencia, Estado
- 1,477 arqueos históricos migrados de Fudo
- Filtro por estado (Abierto/Cerrado)
- Paginación
- Fix de fechas "Invalid Date"

### Gastos
- Movido en menú lateral a debajo de Ventas
- Fix de fechas "Invalid Date"

### Menú
- 104 productos de Sushi Queen con fotos (fuente: menuData del frontend)
- Endpoint /admin/menu sirve desde MongoDB

### Base de Datos
- Migración completa de Fudo a MongoDB via `php artisan fudo:migrate --fresh`
- Ruta web de migración: `/api/admin/migrate-fudo?key=sushiqueen2026migrate`
- Datos migrados: 104 menú, 901 clientes, 14,759 órdenes, 178 ingredientes, 61 proveedores, 1,477 arqueos
- Stats de clientes calculados por separado (step=stats)
- Fix: removidos casts 'array' de modelos MongoDB que causaban json_decode error
- Fechas almacenadas como MongoDB UTCDateTime

### Infraestructura
- Frontend: Hostinger (deploy-sushiqueen branch)
- Backend: Render (main branch)
- VITE_API_URL configurado en workflow de Hostinger apuntando a Render
- Base de datos: MongoDB Atlas

### Pendientes conocidos
- Inventario: nombres de ingredientes no se muestran en la vista
- Proveedores: nombres no se muestran en la vista
- Clientes: total gastado $0 en algunos clientes
- Dashboard: Top Items muestra "Venta #" en vez de productos reales

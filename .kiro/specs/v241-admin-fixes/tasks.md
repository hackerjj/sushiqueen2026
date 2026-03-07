# Plan de Implementación — v2.4.1 Admin Fixes

- [ ] 1. Escribir test exploratorio de condición de fallo
  - **Property 1: Fault Condition** — Bugs del admin v2.4.0
  - **CRITICAL**: Este test DEBE FALLAR en código sin corregir — el fallo confirma que los bugs existen
  - **NO intentes arreglar el test ni el código cuando falle**
  - **NOTE**: Este test codifica el comportamiento esperado — validará el fix cuando pase después de la implementación
  - **GOAL**: Generar contraejemplos que demuestren la existencia de los bugs
  - **Scoped PBT Approach**: Enfocar las propiedades en los casos concretos de fallo:
    - `ExpenseController::index()` retorna todos los registros sin metadata de paginación
    - `MenuController::index()` retorna categorías en orden alfabético (Bebidas antes que Especialidades)
    - `OrderController::dashboard()` no incluye `orders_week`, `sales_week`, ni `new_customers_week`
  - Escribir property-based tests que verifiquen:
    - P1a: Para cualquier request a `GET /admin/expenses` con `page` y `per_page`, la respuesta DEBE contener metadata de paginación (`current_page`, `last_page`, `total`) — fallará porque `index()` usa `$query->get()`
    - P1b: Para cualquier request a `GET /api/menu`, la primera categoría DEBE ser "Especialidades" — fallará porque `orderBy('category')` ordena alfabéticamente
    - P1c: Para cualquier request a `GET /admin/dashboard`, la respuesta DEBE incluir `orders_week`, `sales_week` y `new_customers_week` — fallará porque el backend no los calcula
  - Ejecutar tests en código SIN CORREGIR
  - **EXPECTED OUTCOME**: Tests FALLAN (esto es correcto — prueba que los bugs existen)
  - Documentar contraejemplos encontrados para entender la causa raíz
  - Marcar tarea completa cuando los tests estén escritos, ejecutados y el fallo documentado
  - _Requirements: 1.3, 1.4, 1.8, 1.9_

- [ ] 2. Escribir tests de preservación (ANTES de implementar el fix)
  - **Property 2: Preservation** — Funcionalidad existente sin cambios
  - **IMPORTANT**: Seguir metodología observation-first
  - Observar comportamiento en código SIN CORREGIR para inputs no-buggy:
    - Observar: filtros de período en Gastos (today, week, month, year) retornan resultados filtrados correctamente
    - Observar: endpoint `summary` de Gastos retorna totales y porcentajes por categoría
    - Observar: KPIs existentes del Dashboard (`orders_today`, `sales_today`, `orders_month`, `sales_month`) se calculan correctamente
    - Observar: items dentro de cada categoría del menú están ordenados por `sort_order`
    - Observar: Top Items con fallback de menú muestra items con "0 uds"
  - Escribir property-based tests capturando el comportamiento observado:
    - P2a: Para cualquier combinación de filtros de período en Gastos, los resultados filtrados deben coincidir con el comportamiento original
    - P2b: Para cualquier request al Dashboard, `orders_today`, `sales_today`, `orders_month`, `sales_month` deben seguir calculándose correctamente
    - P2c: Para cualquier categoría del menú, los items dentro de ella deben estar ordenados por `sort_order`
  - Ejecutar tests en código SIN CORREGIR
  - **EXPECTED OUTCOME**: Tests PASAN (confirma el comportamiento base a preservar)
  - Marcar tarea completa cuando los tests estén escritos, ejecutados y pasando en código sin corregir
  - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.9, 3.10_

- [-] 3. Cambios backend — Paginación de Gastos, orden de menú, Dashboard KPIs, endpoint de Ventas

  - [x] 3.1 Implementar paginación en ExpenseController::index()
    - En `backend/app/Http/Controllers/ExpenseController.php`
    - Cambiar `$query->get()` por `$query->paginate($request->input('per_page', 50))`
    - Retornar respuesta paginada con `data`, `meta` (current_page, last_page, per_page, total)
    - Asegurar que los filtros de período y categoría siguen funcionando con la paginación
    - _Bug_Condition: input.page == "Gastos" AND paginationAbsent_
    - _Expected_Behavior: Retornar registros paginados con metadata de paginación_
    - _Preservation: Filtros de período (3.5), CRUD de gastos (3.4), resumen por categoría (3.6)_
    - _Requirements: 2.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Implementar orden fijo de categorías en MenuController::index()
    - En `backend/app/Http/Controllers/MenuController.php`
    - Definir array constante con orden fijo: `['Especialidades', 'Sopas y Ramen', 'Entradas', 'Kushiages', 'Makis', 'Makis Especiales', 'Yakimeshi', 'Yakisoba', 'Teppanyaki', 'Tempuras', 'Paquetes', 'Pastas Queen', 'Postres', 'Bebidas']`
    - Después de `$grouped = $items->groupBy('category')`, reordenar keys según el array fijo
    - Categorías no listadas van al final
    - _Bug_Condition: input.page == "Menu" AND categoriesOrderedAlphabetically_
    - _Expected_Behavior: Categorías en orden fijo del negocio, Especialidades primero_
    - _Preservation: Items ordenados por sort_order dentro de cada categoría (3.7)_
    - _Requirements: 2.4, 3.7_

  - [x] 3.3 Agregar KPIs semanales y clientes nuevos en OrderController::dashboard()
    - En `backend/app/Http/Controllers/OrderController.php`
    - Agregar `$startOfWeek = Carbon::now()->startOfWeek();`
    - Agregar query de órdenes de la semana y calcular `orders_week` y `sales_week`
    - Agregar `$newCustomers = Customer::where('created_at', '>=', Carbon::now()->subDays(60))->count();`
    - Incluir `orders_week`, `sales_week` y `new_customers_week` en la respuesta JSON
    - _Bug_Condition: (orders_week == 0 OR sales_week == 0) AND realWeekOrders > 0; new_customers_week == total_customers_
    - _Expected_Behavior: orders_week y sales_week reflejan datos desde el lunes; new_customers_week refleja últimos 60 días_
    - _Preservation: KPIs de hoy y mes siguen calculándose correctamente (3.9), Top Items con fallback (3.10)_
    - _Requirements: 2.8, 2.9, 3.9, 3.10_

  - [x] 3.4 Agregar endpoint show() en OrderController y ruta
    - En `backend/app/Http/Controllers/OrderController.php`: agregar método `show(string $id)` que retorne la orden con items (nombre, cantidad, precio), estatus, número de orden, fecha, cliente, total, método de pago
    - En `backend/routes/api.php`: agregar ruta `GET /admin/orders/{id}`
    - _Bug_Condition: input.page == "Ventas" AND userClicksRow AND noModalOpens_
    - _Expected_Behavior: Endpoint retorna detalle completo de la orden_
    - _Preservation: Filtro por cliente y paginación en Ventas (3.11)_
    - _Requirements: 2.7, 3.11_

  - [ ] 3.5 Verificar que el test exploratorio de condición de fallo ahora pasa (backend)
    - **Property 1: Expected Behavior** — Bugs backend corregidos
    - **IMPORTANT**: Re-ejecutar los MISMOS tests de la tarea 1 — NO escribir tests nuevos
    - Los tests de la tarea 1 codifican el comportamiento esperado
    - Cuando pasen, confirman que los bugs backend están corregidos
    - Ejecutar tests de condición de fallo de la tarea 1 (P1a, P1b, P1c)
    - **EXPECTED OUTCOME**: Tests PASAN (confirma que los bugs están corregidos)
    - _Requirements: 2.3, 2.4, 2.8, 2.9_

  - [ ] 3.6 Verificar que los tests de preservación siguen pasando (backend)
    - **Property 2: Preservation** — Funcionalidad existente sin cambios
    - **IMPORTANT**: Re-ejecutar los MISMOS tests de la tarea 2 — NO escribir tests nuevos
    - Ejecutar tests de preservación de la tarea 2 (P2a, P2b, P2c)
    - **EXPECTED OUTCOME**: Tests PASAN (confirma que no hay regresiones)
    - Confirmar que todos los tests siguen pasando después del fix

- [x] 4. Cambios frontend — Paginación Clientes, Inventario, Gastos, Caja timezone, Ventas modal

  - [x] 4.1 Mover controles de paginación arriba de la tabla en Customers.tsx
    - En `frontend/src/pages/admin/Customers.tsx`
    - Mover el bloque del selector "Por página" y botones Anterior/Siguiente desde debajo de la tabla hacia arriba, junto a los filtros existentes (search, tier, source)
    - Mantener la misma lógica de paginación, solo reposicionar el JSX
    - _Bug_Condition: input.page == "Clientes" AND paginationPosition == "bottom"_
    - _Expected_Behavior: Controles de paginación arriba de la tabla, junto a filtros_
    - _Preservation: Filtros de búsqueda, tier y source siguen funcionando (3.1), modal de detalle de cliente (3.2)_
    - _Requirements: 2.1, 3.1, 3.2_

  - [x] 4.2 Verificar visibilidad de paginación en Inventory.tsx
    - En `frontend/src/pages/admin/Inventory.tsx`
    - Verificar que los controles de paginación (Anterior/Siguiente) sean visibles cuando `lastPage > 1`
    - Si están ocultos por overflow del contenedor de la tabla, moverlos fuera del contenedor
    - NO modificar el selector "Por página" existente con opciones 200/400 (req 3.12)
    - _Bug_Condition: input.page == "Inventario" AND lastPage > 1 AND paginationNotVisibleAboveTable_
    - _Expected_Behavior: Controles de paginación visibles y accesibles cuando lastPage > 1_
    - _Preservation: Búsqueda, ordenamiento y CRUD de ingredientes (3.3), selector Por página 200/400 (3.12)_
    - _Requirements: 2.2, 3.3, 3.12_

  - [x] 4.3 Agregar paginación frontend en Expenses.tsx
    - En `frontend/src/pages/admin/Expenses.tsx`
    - Agregar estados: `page`, `perPage`, `totalPages`
    - Enviar `page` y `per_page` como query params al endpoint
    - Agregar selector "Por página" y botones Anterior/Siguiente arriba de la tabla
    - Parsear `meta` de la respuesta para controlar la paginación
    - _Bug_Condition: input.page == "Gastos" AND paginationAbsent_
    - _Expected_Behavior: Paginación con selector "Por página" arriba de la tabla, controles de navegación_
    - _Preservation: CRUD de gastos (3.4), filtros de período (3.5), resumen por categoría (3.6)_
    - _Requirements: 2.3, 3.4, 3.5, 3.6_

  - [x] 4.4 Agregar timeZone a fmtDate() en CashRegister.tsx
    - En `frontend/src/pages/admin/CashRegister.tsx`
    - En la función `fmtDate()`, agregar `timeZone: 'America/Mexico_City'` a las opciones de `toLocaleString()`
    - _Bug_Condition: input.page == "Caja" AND timestamps NOT convertedTo("America/Mexico_City")_
    - _Expected_Behavior: Timestamps formateados en zona horaria America/Mexico_City_
    - _Preservation: Operaciones de caja: abrir, cerrar, registrar movimientos (3.8)_
    - _Requirements: 2.6, 3.8_

  - [x] 4.5 Agregar modal de detalle en Orders.tsx
    - En `frontend/src/pages/admin/Orders.tsx`
    - Agregar estados: `selectedOrder`, `orderDetail`, `loadingDetail`
    - Agregar `onClick` handler en las filas `<tr>` que llame a `GET /admin/orders/{id}`
    - Agregar componente modal que muestre: items (nombre, cantidad, precio), estatus, número de orden, fecha, cliente, total, método de pago
    - Agregar `cursor-pointer` a las filas de la tabla
    - _Bug_Condition: input.page == "Ventas" AND userClicksRow AND noModalOpens_
    - _Expected_Behavior: Modal con detalle completo de la orden al hacer clic en una fila_
    - _Preservation: Filtro por cliente y paginación en Ventas (3.11)_
    - _Requirements: 2.7, 3.11_

- [x] 5. Version bump y CHANGELOG

  - [x] 5.1 Actualizar versión en AdminLayout.tsx
    - En `frontend/src/components/admin/AdminLayout.tsx`
    - Cambiar `v2.4.0` a `v2.4.1` en el span de versión del sidebar
    - _Bug_Condition: input.page == "AdminLayout" AND versionShown == "v2.4.0"_
    - _Expected_Behavior: Sidebar muestra "v2.4.1"_
    - _Requirements: 2.10_

  - [x] 5.2 Actualizar CHANGELOG.md
    - Agregar entrada v2.4.1 con todos los fixes implementados
    - Documentar que se debe ejecutar `php artisan menu:seed-from-data` en producción para corregir conteo de items (req 2.5)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 6. Checkpoint — Asegurar que todos los tests pasan
  - Ejecutar todos los tests (exploración, preservación, unitarios)
  - Verificar que no hay regresiones
  - Preguntar al usuario si surgen dudas

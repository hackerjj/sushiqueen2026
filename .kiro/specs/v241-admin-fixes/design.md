# v2.4.1 Admin Fixes — Diseño de Bugfix

## Resumen

Este bugfix aborda 10 defectos identificados tras el despliegue de v2.4.0 del panel de administración MealLi POS. Los problemas incluyen: paginación mal posicionada o ausente en Clientes, Inventario y Gastos; orden alfabético incorrecto de categorías en el menú público; timestamps de Caja sin conversión de timezone; ausencia de modal de detalle en Ventas; KPIs del Dashboard sin cálculos semanales ni filtro de clientes nuevos; y versión desactualizada. La estrategia de fix es quirúrgica: cada defecto se corrige en su archivo específico sin alterar la lógica existente que funciona correctamente.

## Glosario

- **Bug_Condition (C)**: Conjunto de condiciones que disparan cada defecto — paginación en posición incorrecta, ausencia de paginación, orden alfabético de categorías, timestamps sin conversión UTC→CST, ausencia de modal de detalle, KPIs con valores incorrectos
- **Property (P)**: Comportamiento correcto esperado — paginación arriba de tablas, categorías en orden fijo del negocio, horas en America/Mexico_City, modal con detalle de orden, KPIs semanales y clientes nuevos (60 días)
- **Preservation**: Funcionalidad existente que NO debe cambiar — filtros de Clientes, CRUD de Gastos, ordenamiento dentro de categorías, operaciones de Caja, KPIs de hoy/mes, Top Items con fallback
- **`MenuController::index()`**: Endpoint público en `backend/app/Http/Controllers/MenuController.php` que retorna items agrupados por categoría con `orderBy('category')`
- **`OrderController::dashboard()`**: Método en `backend/app/Http/Controllers/OrderController.php` que calcula KPIs — actualmente solo hoy y mes
- **`ExpenseController::index()`**: Método en `backend/app/Http/Controllers/ExpenseController.php` que retorna todos los gastos sin paginación
- **`mapDashboardResponse()`**: Función en `frontend/src/utils/mapDashboardResponse.ts` que mapea la respuesta del backend a `DashboardKPIs`, usa `total_customers` como fallback para `new_customers_week`
- **`fmtDate()`**: Función inline en `CashRegister.tsx` que formatea fechas sin conversión de timezone
- **`flattenGroupedMenu()`**: Función en `frontend/src/hooks/useMenu.ts` que aplana `Object.values(grouped)` — el orden depende del orden de keys en el JSON

## Detalles del Bug

### Condición de Fallo

Los bugs se manifiestan en 10 escenarios distintos agrupados en 4 categorías: (A) paginación UI, (B) datos backend incorrectos/incompletos, (C) funcionalidad ausente, (D) cosmético.

**Especificación Formal:**
```
FUNCTION isBugCondition(input)
  INPUT: input de tipo AdminPageRequest
  OUTPUT: boolean

  // Grupo A: Paginación
  A1 := input.page == "Clientes" AND paginationPosition == "bottom"
  A2 := input.page == "Inventario" AND lastPage > 1 AND paginationNotVisibleAboveTable
  A3 := input.page == "Gastos" AND paginationAbsent

  // Grupo B: Datos backend
  B1 := input.page == "Menu" AND categoriesOrderedAlphabetically
  B2 := input.page == "Menu" AND itemCount != countWhere(available == true)
  B3 := input.page == "Caja" AND timestamps NOT convertedTo("America/Mexico_City")
  B4 := input.page == "Dashboard" AND (orders_week == 0 OR sales_week == 0) AND realWeekOrders > 0
  B5 := input.page == "Dashboard" AND new_customers_week == total_customers

  // Grupo C: Funcionalidad ausente
  C1 := input.page == "Ventas" AND userClicksRow AND noModalOpens

  // Grupo D: Cosmético
  D1 := input.page == "AdminLayout" AND versionShown == "v2.4.0"

  RETURN A1 OR A2 OR A3 OR B1 OR B2 OR B3 OR B4 OR B5 OR C1 OR D1
END FUNCTION
```

### Ejemplos

- **A1 — Clientes paginación**: El usuario abre `/admin/customers` con 893 clientes. Los botones Anterior/Siguiente están debajo de la tabla. Esperado: arriba, junto a los filtros de búsqueda/tier/source.
- **A3 — Gastos sin paginación**: El usuario abre `/admin/expenses`. Se cargan 3,581 gastos de golpe. Esperado: paginación con selector "Por página" arriba de la tabla, carga de ~50 registros por página.
- **B1 — Menú orden**: El menú público muestra "Bebidas" como primera categoría (orden alfabético). Esperado: "Especialidades" primero, siguiendo el orden fijo del negocio.
- **B3 — Caja timezone**: Un arqueo abierto a las 15:00 CST se muestra como "9:00 p.m." (UTC). Esperado: "3:00 p.m." (America/Mexico_City).
- **B4 — Dashboard semana**: El KPI "Órdenes esta Semana" muestra 0 aunque hay 45 órdenes desde el lunes. Esperado: 45.
- **B5 — Dashboard clientes nuevos**: El KPI "Nuevos Clientes" muestra 893 (total). Esperado: ~15 (registrados en últimos 60 días).
- **C1 — Ventas modal**: El usuario hace clic en una fila de ventas. No pasa nada. Esperado: modal con items, estatus, detalles de la orden.
- **D1 — Versión**: Sidebar muestra "v2.4.0". Esperado: "v2.4.1".

## Comportamiento Esperado

### Requisitos de Preservación

**Comportamientos Sin Cambios:**
- Filtros de búsqueda, tier y source en Clientes deben seguir funcionando (3.1)
- Modal de detalle de cliente con info, órdenes y productos favoritos (3.2)
- Búsqueda, ordenamiento y CRUD de ingredientes en Inventario (3.3)
- CRUD de gastos (crear, editar, eliminar) (3.4)
- Filtros de período en Gastos (Hoy, Semana, Mes, Año, Personalizado) (3.5)
- Resumen por categoría en Gastos con totales y porcentajes (3.6)
- Items ordenados por `sort_order` dentro de cada categoría del menú (3.7)
- Operaciones de caja: abrir, cerrar, registrar movimientos (3.8)
- KPIs de "Ventas Hoy", "Ventas Mes", "Órdenes Hoy" (3.9)
- Top Items con fallback de menú y nota "Sin datos de productos" (3.10)
- Filtro por cliente y paginación en Ventas (3.11)
- Selector "Por página" en Inventario con opciones 200/400 en su posición actual (3.12)

**Alcance:**
Todas las interacciones que NO involucran las condiciones de bug deben permanecer completamente inalteradas. Esto incluye:
- Todas las operaciones CRUD existentes
- Navegación entre páginas del admin
- Autenticación y sesiones
- POS y cocina (KDS)
- Webhooks de WhatsApp e integraciones AI

## Causa Raíz Hipotética

Basado en el análisis del código fuente:

1. **Paginación Clientes (A1)**: El componente `Customers.tsx` renderiza los controles de paginación (selector per_page + botones Anterior/Siguiente) después del `</table>`, al final del JSX. Solo necesita reubicarse arriba, junto a los filtros existentes.

2. **Paginación Inventario (A2)**: En `Inventory.tsx`, los controles de paginación están dentro del contenedor de la tabla al final. La condición `lastPage > 1` es correcta, pero la posición puede no ser visible sin scroll. Verificar que sean accesibles.

3. **Paginación Gastos (A3)**: `ExpenseController::index()` usa `$query->get()` sin paginación — retorna todos los registros. El frontend `Expenses.tsx` no tiene estado de paginación ni controles. Se necesita: backend con `->paginate()` y frontend con controles de paginación.

4. **Orden de categorías (B1)**: `MenuController::index()` usa `->orderBy('category')` que ordena alfabéticamente. Necesita un orden fijo definido. Además, `flattenGroupedMenu()` en `useMenu.ts` usa `Object.values(grouped)` que depende del orden de keys del JSON — PHP `groupBy` + JSON encoding preserva el orden de inserción, así que si el backend envía en orden correcto, el frontend lo respetará.

5. **Conteo de items (B2)**: El endpoint `index()` ya filtra `where('available', true)` y el `total` es `$items->count()`. Si muestra 111, es porque hay 111 items con `available=true` en la BD. Esto se resuelve ejecutando el seed que marca los extras como no disponibles. No requiere cambio de código, pero debemos asegurar que el conteo sea correcto post-seed.

6. **Timezone Caja (B3)**: La función `fmtDate()` en `CashRegister.tsx` parsea fechas pero no especifica `timeZone` en `toLocaleString()`. Los timestamps de Fudo se almacenaron como `UTCDateTime` de MongoDB. Necesita agregar `timeZone: 'America/Mexico_City'` a las opciones de `toLocaleString()`.

7. **Modal Ventas (C1)**: `Orders.tsx` no tiene `onClick` en las filas `<tr>`. No existe endpoint `GET /admin/orders/{id}`. Se necesita: endpoint `show()` en `OrderController`, ruta en `api.php`, y modal en el frontend.

8. **Dashboard semana (B4)**: `OrderController::dashboard()` calcula `$today` y `$startOfMonth` pero no `$startOfWeek`. No retorna `orders_week` ni `sales_week`. Se necesita agregar `Carbon::now()->startOfWeek()` y las queries correspondientes.

9. **Dashboard clientes nuevos (B5)**: El backend retorna `total_customers: Customer::count()` pero no `new_customers_week`. `mapDashboardResponse` usa `raw?.total_customers` como fallback, mostrando el total (893) en vez de los nuevos. Se necesita agregar `Customer::where('created_at', '>=', Carbon::now()->subDays(60))->count()` al backend.

10. **Versión (D1)**: `AdminLayout.tsx` tiene hardcoded `v2.4.0`. Cambiar a `v2.4.1`.

## Propiedades de Correctitud

Property 1: Fault Condition — Paginación de Gastos con endpoint paginado

_Para cualquier_ request a `GET /admin/expenses` con parámetros `page` y `per_page`, el endpoint paginado DEBERÁ retornar solo los registros de la página solicitada con metadata de paginación (`current_page`, `last_page`, `total`), y el frontend DEBERÁ mostrar controles de paginación arriba de la tabla.

**Validates: Requirements 2.3**

Property 2: Fault Condition — Orden fijo de categorías del menú

_Para cualquier_ request a `GET /api/menu`, el endpoint DEBERÁ retornar las categorías en el orden fijo definido (Especialidades, Sopas y Ramen, ..., Bebidas), no en orden alfabético, y `flattenGroupedMenu` DEBERÁ preservar este orden.

**Validates: Requirements 2.4**

Property 3: Fault Condition — Dashboard incluye KPIs semanales y clientes nuevos

_Para cualquier_ request a `GET /admin/dashboard`, la respuesta DEBERÁ incluir `orders_week`, `sales_week` (órdenes desde el lunes) y `new_customers_week` (clientes creados en últimos 60 días), y `mapDashboardResponse` DEBERÁ mapearlos correctamente sin usar `total_customers` como fallback.

**Validates: Requirements 2.8, 2.9**

Property 4: Fault Condition — Timezone de Caja en America/Mexico_City

_Para cualquier_ timestamp de `opened_at` o `closed_at` en la tabla de arqueos de caja, la función `fmtDate` DEBERÁ formatear la fecha en la zona horaria America/Mexico_City, no en UTC ni en la zona local del navegador.

**Validates: Requirements 2.6**

Property 5: Preservation — Funcionalidad existente sin cambios

_Para cualquier_ input que NO involucre las condiciones de bug (filtros de Clientes, CRUD de Gastos, operaciones de Caja, KPIs de hoy/mes, Top Items), el código corregido DEBERÁ producir exactamente el mismo resultado que el código original, preservando toda la funcionalidad existente.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12**

## Implementación del Fix

### Cambios Requeridos

Asumiendo que nuestro análisis de causa raíz es correcto:


**1. Paginación Clientes — Mover arriba**

**Archivo**: `frontend/src/pages/admin/Customers.tsx`

**Cambios**:
1. Mover el bloque de selector "Por página" y botones Anterior/Siguiente desde debajo de la tabla hacia arriba, junto a los filtros existentes (search, tier, source)
2. Mantener la misma lógica de paginación, solo reposicionar el JSX

---

**2. Paginación Inventario — Verificar visibilidad**

**Archivo**: `frontend/src/pages/admin/Inventory.tsx`

**Cambios**:
1. Verificar que los controles de paginación sean visibles cuando `lastPage > 1`
2. Si están ocultos por overflow del contenedor, moverlos fuera del contenedor de la tabla
3. No modificar el selector "Por página" existente con opciones 200/400 (req 3.12)

---

**3. Paginación Gastos — Backend + Frontend**

**Archivo backend**: `backend/app/Http/Controllers/ExpenseController.php`
**Archivo frontend**: `frontend/src/pages/admin/Expenses.tsx`

**Cambios backend**:
1. En `index()`: cambiar `$query->get()` por `$query->paginate($request->input('per_page', 50))`
2. Retornar respuesta paginada con `data`, `meta` (current_page, last_page, per_page, total)

**Cambios frontend**:
1. Agregar estados: `page`, `perPage`, `totalPages`
2. Enviar `page` y `per_page` como query params al endpoint
3. Agregar selector "Por página" y botones Anterior/Siguiente arriba de la tabla
4. Parsear `meta` de la respuesta para controlar la paginación

---

**4. Orden de categorías del menú**

**Archivo**: `backend/app/Http/Controllers/MenuController.php`

**Cambios**:
1. Definir array constante con el orden fijo de categorías:
   ```php
   $categoryOrder = ['Especialidades', 'Sopas y Ramen', 'Entradas', 'Kushiages', 'Makis', 'Makis Especiales', 'Yakimeshi', 'Yakisoba', 'Teppanyaki', 'Tempuras', 'Paquetes', 'Pastas Queen', 'Postres', 'Bebidas'];
   ```
2. Después de `$grouped = $items->groupBy('category')`, reordenar las keys según el array fijo
3. Categorías no listadas van al final (por si hay categorías nuevas)
4. El frontend (`useMenu.ts`) no necesita cambios — `Object.values()` respetará el orden del JSON

---

**5. Conteo de items del menú**

**Archivo**: `backend/app/Http/Controllers/MenuController.php`

**Cambios**:
1. El endpoint ya filtra `where('available', true)` y cuenta correctamente
2. No requiere cambio de código — el conteo será correcto después de ejecutar el seed
3. Documentar en CHANGELOG que se debe ejecutar `php artisan menu:seed-from-data` en producción

---

**6. Timezone de Caja**

**Archivo**: `frontend/src/pages/admin/CashRegister.tsx`

**Cambios**:
1. En la función `fmtDate()`, agregar `timeZone: 'America/Mexico_City'` a las opciones de `toLocaleString()`
2. Cambiar de:
   ```js
   dt.toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })
   ```
   A:
   ```js
   dt.toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit', timeZone: 'America/Mexico_City' })
   ```

---

**7. Modal de detalle de Ventas**

**Archivo backend**: `backend/app/Http/Controllers/OrderController.php`
**Archivo rutas**: `backend/routes/api.php`
**Archivo frontend**: `frontend/src/pages/admin/Orders.tsx`

**Cambios backend**:
1. Agregar método `show(string $id)` en `OrderController` que retorne la orden con sus items
2. Agregar ruta `GET /admin/orders/{id}` en `api.php`

**Cambios frontend**:
1. Agregar estado para modal: `selectedOrder`, `orderDetail`, `loadingDetail`
2. Agregar `onClick` handler en las filas `<tr>` que llame al endpoint `show`
3. Agregar componente modal que muestre: items (nombre, cantidad, precio), estatus, número de orden, fecha, cliente, total, método de pago
4. Agregar `cursor-pointer` a las filas de la tabla

---

**8. Dashboard — KPIs semanales**

**Archivo**: `backend/app/Http/Controllers/OrderController.php`

**Cambios**:
1. Agregar `$startOfWeek = Carbon::now()->startOfWeek();`
2. Agregar query: `$weekOrders = Order::where('created_at', '>=', $startOfWeek)->get();`
3. Calcular `$weekRevenue = $weekOrders->sum('total');`
4. Agregar al response JSON: `'orders_week' => $weekOrders->count()`, `'sales_week' => $weekRevenue`

---

**9. Dashboard — Clientes nuevos (60 días)**

**Archivo**: `backend/app/Http/Controllers/OrderController.php`

**Cambios**:
1. Agregar: `$newCustomers = Customer::where('created_at', '>=', Carbon::now()->subDays(60))->count();`
2. Agregar al response JSON: `'new_customers_week' => $newCustomers`
3. El frontend `mapDashboardResponse` ya maneja `new_customers_week` correctamente — dejará de usar el fallback `total_customers`

---

**10. Version bump**

**Archivo**: `frontend/src/components/admin/AdminLayout.tsx`
**Archivo**: `CHANGELOG.md`

**Cambios**:
1. Cambiar `v2.4.0` a `v2.4.1` en el span de versión del sidebar
2. Agregar entrada v2.4.1 al CHANGELOG con todos los fixes

## Estrategia de Testing

### Enfoque de Validación

La estrategia de testing sigue un enfoque de dos fases: primero, verificar los contraejemplos que demuestran los bugs en el código sin corregir, luego verificar que el fix funciona correctamente y preserva el comportamiento existente.

### Exploratory Fault Condition Checking

**Objetivo**: Demostrar los bugs ANTES de implementar el fix. Confirmar o refutar el análisis de causa raíz.

**Plan de Test**: Escribir tests que verifiquen cada condición de fallo en el código actual sin corregir.

**Casos de Test**:
1. **Gastos sin paginación**: Llamar a `GET /admin/expenses` y verificar que retorna TODOS los registros sin metadata de paginación (fallará en código sin corregir)
2. **Menú orden alfabético**: Llamar a `GET /api/menu` y verificar que las keys del JSON están en orden alfabético, no en el orden fijo (fallará en código sin corregir)
3. **Dashboard sin semana**: Llamar a `GET /admin/dashboard` y verificar que la respuesta NO contiene `orders_week` ni `sales_week` (fallará en código sin corregir)
4. **Dashboard clientes total**: Verificar que `new_customers_week` no está en la respuesta y `mapDashboardResponse` usa `total_customers` como fallback (fallará en código sin corregir)

**Contraejemplos Esperados**:
- `ExpenseController::index()` retorna array completo sin paginación
- `MenuController::index()` retorna categorías en orden: Bebidas, Entradas, Especialidades... (alfabético)
- `OrderController::dashboard()` no incluye keys `orders_week`, `sales_week`, `new_customers_week`

### Fix Checking

**Objetivo**: Verificar que para todos los inputs donde la condición de bug se cumple, la función corregida produce el comportamiento esperado.

**Pseudocódigo:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Objetivo**: Verificar que para todos los inputs donde la condición de bug NO se cumple, la función corregida produce el mismo resultado que la función original.

**Pseudocódigo:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Enfoque de Testing**: Se recomienda property-based testing para preservation checking porque:
- Genera muchos casos de test automáticamente sobre el dominio de inputs
- Detecta edge cases que los unit tests manuales podrían omitir
- Provee garantías fuertes de que el comportamiento no cambia para inputs no-buggy

**Plan de Test**: Observar el comportamiento en código sin corregir primero para filtros, CRUD y KPIs existentes, luego escribir property-based tests capturando ese comportamiento.

**Casos de Test**:
1. **Preservación filtros Gastos**: Verificar que los filtros de período (today, week, month, year) y categoría siguen funcionando correctamente con la paginación agregada
2. **Preservación resumen Gastos**: Verificar que el endpoint `summary` no se ve afectado por los cambios en `index`
3. **Preservación KPIs existentes**: Verificar que `today.orders`, `today.revenue`, `month.orders`, `month.revenue` siguen calculándose correctamente después de agregar los campos semanales
4. **Preservación sort_order menú**: Verificar que dentro de cada categoría, los items siguen ordenados por `sort_order`

### Unit Tests

- Test de `ExpenseController::index()` con paginación: verificar `per_page`, `page`, metadata
- Test de `MenuController::index()` con orden fijo de categorías
- Test de `OrderController::dashboard()` con `orders_week`, `sales_week`, `new_customers_week`
- Test de `OrderController::show()` retornando orden con items
- Test de `fmtDate()` con timezone America/Mexico_City
- Test de `mapDashboardResponse()` con los nuevos campos (ya existe test, extender)

### Property-Based Tests

- Generar requests aleatorios a expenses con diferentes combinaciones de filtros y verificar que la paginación retorna subsets correctos del total
- Generar respuestas de dashboard aleatorias y verificar que `mapDashboardResponse` siempre produce valores >= 0 y mapea correctamente los nuevos campos
- Generar listas de categorías aleatorias y verificar que el reordenamiento siempre coloca las categorías conocidas en el orden fijo

### Integration Tests

- Test end-to-end de paginación de Gastos: crear gastos, paginar, verificar que cada página tiene los registros correctos
- Test de flujo completo de Ventas: crear orden, listar, hacer clic, verificar modal con items
- Test de Dashboard completo: verificar que todos los KPIs (hoy, semana, mes, clientes nuevos) se calculan y muestran correctamente

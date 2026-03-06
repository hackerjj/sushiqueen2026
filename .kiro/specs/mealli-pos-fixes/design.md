# MealLi POS v2.3 — Bugfix Design

## Overview

MealLi POS v2.3 tiene 9 áreas de bugs en los módulos de administración. Los datos existen en MongoDB (importados desde Fudo vía `MigrateFudoToMongo`) pero no se muestran correctamente. Los problemas se agrupan en: (A) parsing de fechas MongoDB UTCDateTime, (B) endpoints que filtran/agrupan datos incorrectamente, (C) falta de paginación/ordenamiento, y (D) datos Fudo con estructura diferente a la esperada por el frontend.

## Glossary

- **Bug_Condition (C)**: Conjunto de condiciones que disparan cada bug — datos Fudo en MongoDB que no se renderizan correctamente
- **Property (P)**: Comportamiento correcto esperado — datos visibles, formateados y funcionales en el admin
- **Preservation**: Comportamiento existente que NO debe cambiar — CRUD de menú, gastos, clientes; endpoint público `/menu`; KPI cards del dashboard
- **UTCDateTime**: Tipo `MongoDB\BSON\UTCDateTime` usado por `toMongoDate()` en la migración Fudo. Se serializa como `{"$date":{"$numberLong":"..."}}` en JSON
- **`toMongoDate()`**: Función en `MigrateFudoToMongo.php` que convierte strings de fecha a `MongoDB\BSON\UTCDateTime`
- **`fmtDate()`**: Función inline en `CashRegister.tsx` que parsea fechas MongoDB para display
- **`Expense::CATEGORIES`**: Constante hardcodeada con 6 categorías (`ingredientes, servicios, personal, alquiler, marketing, otros`)

## Bug Details

### Fault Condition

Los bugs se manifiestan cuando el admin navega a cualquiera de las 8 páginas afectadas y los datos importados de Fudo no se muestran correctamente. La condición raíz es que los datos Fudo tienen estructura/formato diferente al esperado por el código actual.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type AdminPageRequest
  OUTPUT: boolean

  // Bug 1: Menu Admin
  IF input.page == '/admin/menu'
    RETURN MenuController::index() filters available=true
           AND groups by category (object, not flat array)
           AND frontend expects flat array from data.data

  // Bug 2: Gastos dates
  IF input.page == '/admin/expenses' AND input.action == 'view_list'
    RETURN expense.date IS MongoDB\BSON\UTCDateTime
           AND frontend receives {$date:{$numberLong:"..."}} object
           AND new Date(object) returns NaN

  // Bug 3: Gastos date filter
  IF input.page == '/admin/expenses' AND input.action == 'filter_dates'
    RETURN user wants custom date range
           AND only preset periods (today/week/month/year) available

  // Bug 4: Gastos category summary
  IF input.page == '/admin/expenses/summary'
    RETURN expense.category NOT IN Expense::CATEGORIES
           AND summary() only iterates Expense::CATEGORIES

  // Bug 5: Clientes predominant_order_type
  IF input.page == '/admin/customers'
    RETURN customer has orders
           AND predominant_order_type computed but serialized as null

  // Bug 6: Clientes ticket promedio
  IF input.page == '/admin/customers/{id}'
    RETURN detail.ai_profile?.avg_order_value is undefined/null
           AND total_spent > 0 AND total_orders > 0

  // Bug 7: Clientes per_page
  IF input.page == '/admin/customers'
    RETURN per_page hardcoded to 50 in frontend

  // Bug 8: Caja opened_at
  IF input.page == '/admin/cash-register'
    RETURN register.opened_at IS MongoDB\BSON\UTCDateTime
           AND fmtDate() fails to parse $numberLong correctly

  // Bug 9: Inventario pagination/sorting
  IF input.page == '/admin/inventory'
    RETURN ingredients.count > 200
           AND no pagination AND no column sorting

  // Bug 10: Ventas delivery time
  IF input.page == '/admin/ventas'
    RETURN order.closed_at IS null OR MongoDB\BSON\UTCDateTime
           AND delivery_time_min IS null
           AND frontend calculates NaN

  // Bug 11: Dashboard top items
  IF input.page == '/admin/dashboard'
    RETURN orders.items[0].name starts with 'Venta #'
           AND $unwind + $group returns only Fudo placeholder items
           AND frontend filters out names starting with 'Venta #'

  RETURN false
END FUNCTION
```

### Examples

- **Menu Admin**: GET `/admin/menu` → `{data: {Rolls: [...], Nigiri: [...]}, total: 45}` — frontend does `Array.isArray(data.data)` → `false` → shows 0 items
- **Gastos dates**: Expense `date` field = `UTCDateTime(1704067200000)` → JSON serialized as `{"$date":{"$numberLong":"1704067200000"}}` → `new Date(object)` = `NaN` → shows "—"
- **Gastos categories**: Fudo expense with `category: "consumibles"` → `summary()` only iterates `CATEGORIES` array → "consumibles" never counted
- **Caja opened_at**: `opened_at` = `UTCDateTime(1704110400000)` → `fmtDate()` receives `{$date:{$numberLong:"1704110400000"}}` → `parseInt` may fail or timezone offset wrong → shows 9am instead of ~12am
- **Dashboard top items**: Fudo orders have `items: [{name: "Venta #1234", quantity: 1, ...}]` → aggregation groups by `items.name` → all results are "Venta #1234" etc. → frontend filters `!name.startsWith('Venta #')` → empty list

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- CRUD operations on menu items (store, update, destroy) via `MenuController`
- CRUD operations on expenses (store, update, destroy) via `ExpenseController`
- Customer search, filter by tier, filter by source in `CustomerController::index()`
- Cash register open/close/movement operations in `CashRegisterController`
- Inventory movements (purchase, waste, adjustment) in `InventoryController`
- Order sorting by `order_number` and `created_at` in `OrderController::index()`
- Dashboard KPI cards (Ventas Hoy, Ventas Mes, Órdenes Hoy, Nuevos Clientes)
- Public menu endpoint `GET /menu` must continue returning only `available=true` items grouped by category

**Scope:**
All inputs that do NOT involve the specific rendering/parsing of Fudo-imported data should be completely unaffected. This includes:
- Creating new expenses (which store `date` as string via validation)
- Creating new orders (which have proper `items` arrays)
- Manual cash register operations (which use `now()` for timestamps)
- All authentication and authorization flows

## Hypothesized Root Cause

Based on code analysis, the root causes are:

1. **Menu Admin — shared endpoint for public and admin**: `MenuController::index()` (line 18) filters `where('available', true)` and groups by category. The same endpoint is used for both public `/menu` and admin `/admin/menu` routes. The admin needs ALL items as a flat array, but gets a grouped object of only available items.

2. **UTCDateTime serialization (Gastos, Caja)**: `MigrateFudoToMongo::toMongoDate()` stores dates as `MongoDB\BSON\UTCDateTime`. The `Expense` model has no `$casts` for `date`, and `CashRegister` model has no `$casts` for `opened_at`/`closed_at`. Without date casts, jenssegers/mongodb serializes UTCDateTime as `{"$date":{"$numberLong":"..."}}` objects. The frontend `fmtDate()` in CashRegister.tsx attempts to handle this but may have parseInt/timezone issues. The Expenses.tsx date parser doesn't handle the `$date.$numberLong` format at all.

3. **Gastos custom date range**: `ExpenseController::index()` already supports `start_date`/`end_date` params, but the frontend `Expenses.tsx` only renders preset period buttons (PERIODS array) with no date picker inputs.

4. **Gastos category summary hardcoded**: `ExpenseController::summary()` iterates only `Expense::CATEGORIES` (6 hardcoded values). Fudo-imported expenses have categories like `consumibles`, `verduras`, `basura`, etc. that are never counted.

5. **Clientes predominant_order_type**: `CustomerController::index()` computes `predominant_order_type` via `computePredominantOrderType()` and sets it on the customer model. The value should serialize correctly since it's set as a dynamic attribute. The issue may be that Fudo-imported orders don't have a `type` field, causing all to map to `local`.

6. **Clientes ticket promedio**: `CustomerController::show()` returns `ai_profile` from the customer document, but `ai_profile.avg_order_value` is never populated. The `show()` method returns `total_orders` and `total_spent` from the customer model (not recomputed from orders), so these may be stale/zero.

7. **Inventario no pagination**: `InventoryController::ingredients()` uses `->get()` (returns all) instead of `->paginate()`. No sort parameter is accepted.

8. **Ventas delivery time**: Fudo-imported orders have `closed_at` stored as `UTCDateTime` (not null), but the frontend does `new Date(o.closed_at)` which may fail on the `$date.$numberLong` format. Also, `delivery_time_min` is never set on Fudo orders.

9. **Dashboard top items**: Fudo orders have `items: [{name: "Venta #1234", ...}]` — placeholder names. The `$unwind` + `$group` aggregation groups by `items.name`, producing only "Venta #..." entries. The frontend filters these out with `!item.name.startsWith('Venta #')`, resulting in an empty list.

## Correctness Properties

Property 1: Fault Condition — Menu Admin Returns All Items as Flat Array

_For any_ request to the admin menu endpoint, the response SHALL return all menu items (both available and unavailable) as a flat array in `data.data`, so that `Array.isArray(data.data)` is `true`.

**Validates: Requirements 2.1**

Property 2: Fault Condition — Expense Dates Display Correctly

_For any_ expense with a `date` field stored as MongoDB UTCDateTime, ISO string, or date string, the frontend SHALL parse and display it in `es-MX` locale format (not "—").

**Validates: Requirements 2.2**

Property 3: Fault Condition — Expense Category Summary Shows All Categories

_For any_ set of expenses in the database, the category summary SHALL include ALL categories that have at least one expense, not just the hardcoded `CATEGORIES` constant.

**Validates: Requirements 2.4**

Property 4: Fault Condition — Customer Ticket Promedio Calculated Correctly

_For any_ customer detail view where `total_orders > 0`, the "Ticket Promedio" SHALL display `total_spent / total_orders`, not `ai_profile.avg_order_value`.

**Validates: Requirements 2.6**

Property 5: Fault Condition — CashRegister Dates Parse Correctly

_For any_ cash register with `opened_at` stored as MongoDB UTCDateTime, the "Hora de apertura" SHALL display the correct local time parsed from the UTCDateTime value.

**Validates: Requirements 2.8**

Property 6: Fault Condition — Dashboard Top Items From Fudo Orders

_For any_ set of Fudo-imported orders (where items have placeholder names like "Venta #NNN"), the dashboard top items aggregation SHALL use order-level data (e.g., `customer.name`, `channel`, or order description) as a fallback to produce meaningful top items.

**Validates: Requirements 2.12**

Property 7: Preservation — Public Menu Endpoint Unchanged

_For any_ request to the public `/menu` endpoint, the response SHALL continue to return only `available=true` items grouped by category, exactly as before the fix.

**Validates: Requirements 3.1, 3.8**

Property 8: Preservation — Expense CRUD Unchanged

_For any_ expense create/update/delete operation, the system SHALL continue to validate and persist data correctly, including the `category` validation against `Expense::CATEGORIES` for manually created expenses.

**Validates: Requirements 3.2**

Property 9: Preservation — Customer Filters Unchanged

_For any_ customer search/filter request (by search term, tier, or source), the system SHALL continue to filter and paginate correctly.

**Validates: Requirements 3.3**

Property 10: Preservation — Dashboard KPI Cards Unchanged

_For any_ dashboard request, the KPI cards (Ventas Hoy, Ventas Mes, Órdenes Hoy, Nuevos Clientes) SHALL continue to display correct aggregated values.

**Validates: Requirements 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

---

### Bug 1: Menu Admin — 0 items

**File**: `backend/app/Http/Controllers/MenuController.php`

**Function**: `index()` → new `adminIndex()`

**Specific Changes**:
1. **Create new `adminIndex()` method**: Return ALL menu items (no `available` filter) as a flat array, ordered by category + sort_order
2. **Keep `index()` unchanged**: The public `/menu` endpoint must continue to return only available items grouped by category (Preservation 3.8)
3. **Update route**: In `backend/routes/api.php`, change the admin `/menu` GET route to point to `adminIndex()` instead of `index()`

```php
// New method in MenuController
public function adminIndex(): JsonResponse
{
    $items = MenuItem::orderBy('category')->orderBy('sort_order')->get();
    return response()->json([
        'data' => $items->values(),
        'total' => $items->count(),
    ]);
}
```

---

### Bug 2: Gastos dates showing "—"

**File**: `backend/app/Models/Expense.php`

**Specific Changes**:
1. **Add date cast**: Add `'date' => 'datetime'` to `$casts` array. This makes jenssegers/mongodb serialize the UTCDateTime as an ISO 8601 string that the frontend can parse with `new Date()`

```php
protected $casts = [
    'amount' => 'float',
    'date' => 'datetime',
];
```

**Alternative/Complementary** (frontend): The Expenses.tsx date parser already handles string dates. With the backend cast, `exp.date` will arrive as `"2024-01-01T00:00:00.000000Z"` which `new Date()` parses correctly.

---

### Bug 3: Gastos date filter — no custom range picker

**File**: `frontend/src/pages/admin/Expenses.tsx`

**Specific Changes**:
1. **Add state for custom date range**: Add `startDate` and `endDate` state variables
2. **Add "Personalizado" option to PERIODS**: Add a `custom` period option
3. **Render date picker inputs**: When period is `custom`, show two `<input type="date">` fields
4. **Pass `start_date`/`end_date` params**: When custom range is selected, send these params to the API instead of `period`
5. **Validate max 24 months**: Check that the range between start and end dates does not exceed 24 months

The backend `ExpenseController::index()` already supports `start_date` and `end_date` query params — no backend changes needed.

---

### Bug 4: Gastos Category Summary — only hardcoded categories

**File**: `backend/app/Http/Controllers/ExpenseController.php`

**Function**: `summary()`

**Specific Changes**:
1. **Replace hardcoded iteration with dynamic grouping**: Instead of iterating `Expense::CATEGORIES`, group expenses by their actual `category` field using `$groupBy` or collection `groupBy()`

```php
public function summary(Request $request): JsonResponse
{
    // ... existing date filtering ...

    $expenses = $query->get();
    $grouped = $expenses->groupBy('category');
    $byCategory = [];
    $total = 0;

    foreach ($grouped as $cat => $catExpenses) {
        $catTotal = $catExpenses->sum('amount');
        $byCategory[] = [
            'category' => $cat,
            'total' => round($catTotal, 2),
            'count' => $catExpenses->count(),
        ];
        $total += $catTotal;
    }

    // Sort by total descending
    usort($byCategory, fn($a, $b) => $b['total'] <=> $a['total']);

    return response()->json([
        'data' => [
            'by_category' => $byCategory,
            'total' => round($total, 2),
        ],
    ]);
}
```

2. **Update frontend category colors**: In `Expenses.tsx`, make `categoryColors` dynamic — use a default color for categories not in the hardcoded map.

---

### Bug 5: Clientes — Tipo Predominante "—"

**File**: `backend/app/Http/Controllers/CustomerController.php`

**Function**: `index()` → `computePredominantOrderType()`

**Specific Changes**:
1. **Handle Fudo order types**: Fudo-imported orders may have `type` values like `mostrador`, `delivery`, `salon`, or the `channel` field. Update `computePredominantOrderType()` to map these correctly:
   - `mostrador`, `counter`, `takeout`, `express`, `dine_in`, `salon` → `local`
   - `delivery` → `delivery`
   - source `web`/`whatsapp`/`facebook` → `app`

2. **Ensure serialization**: The computed `predominant_order_type` is set as a dynamic attribute on the Eloquent model. Verify it appears in the JSON response by checking `$appends` or the transform logic.

---

### Bug 6: Clientes — Ticket Promedio $0.00

**File**: `frontend/src/pages/admin/Customers.tsx`

**Specific Changes**:
1. **Calculate ticket promedio from order data**: Replace `detail.ai_profile?.avg_order_value` with a calculation from the detail response:

```tsx
// Instead of:
detail.ai_profile?.avg_order_value || 0

// Use:
(detail.total_orders > 0 ? detail.total_spent / detail.total_orders : 0)
```

2. **Backend: recompute metrics in show()**: In `CustomerController::show()`, aggregate order metrics (like `index()` does) to return accurate `total_orders` and `total_spent`:

```php
$orderMetrics = Order::raw(function ($collection) use ($customer) {
    return $collection->aggregate([
        ['$match' => ['customer_id' => (string) $customer->_id]],
        ['$group' => [
            '_id' => null,
            'total_orders' => ['$sum' => 1],
            'total_spent' => ['$sum' => ['$ifNull' => ['$total', 0]]],
        ]],
    ]);
});
```

---

### Bug 7: Clientes — hardcoded per_page 50

**File**: `frontend/src/pages/admin/Customers.tsx`

**Specific Changes**:
1. **Add `perPage` state**: `const [perPage, setPerPage] = useState(50);`
2. **Add per_page selector UI**: Render a `<select>` with options 50, 100, 200, 400
3. **Use `perPage` in API call**: Replace hardcoded `per_page: 50` with `per_page: perPage`
4. **Reset page to 1 on perPage change**

---

### Bug 8: Caja — opening time incorrect

**File**: `backend/app/Models/CashRegister.php`

**Specific Changes**:
1. **Add date casts**: Add `'opened_at' => 'datetime'` and `'closed_at' => 'datetime'` to `$casts`. This ensures jenssegers/mongodb serializes UTCDateTime as ISO strings.

```php
protected $casts = [
    'initial_amount' => 'float',
    'expected_amount' => 'float',
    'actual_amount' => 'float',
    'system_amount' => 'float',
    'user_amount' => 'float',
    'difference' => 'float',
    'opened_at' => 'datetime',
    'closed_at' => 'datetime',
];
```

The frontend `fmtDate()` already handles ISO string dates correctly via `new Date(s.replace(' ', 'T'))`.

---

### Bug 9: Inventario — no pagination, no column sorting

**File**: `backend/app/Http/Controllers/InventoryController.php`

**Function**: `ingredients()`

**Specific Changes**:
1. **Add pagination**: Replace `->get()` with `->paginate($request->input('per_page', 200))`
2. **Add sort parameter**: Accept `sort_by` and `sort_dir` query params

```php
public function ingredients(Request $request): JsonResponse
{
    $query = Ingredient::query();
    if ($request->has('category')) $query->where('category', $request->input('category'));
    if ($request->has('low_stock')) $query->whereRaw(['$expr' => ['$lte' => ['$current_stock', '$min_stock']]]);
    if ($request->has('search')) $query->where('name', 'like', '%' . $request->input('search') . '%');

    $sortBy = $request->input('sort_by', 'name');
    $sortDir = $request->input('sort_dir', 'asc');
    $allowed = ['name', 'category', 'cost_per_unit', 'current_stock'];
    if (in_array($sortBy, $allowed)) {
        $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
    }

    $items = $query->paginate($request->input('per_page', 200));
    return response()->json($items);
}
```

**File**: `frontend/src/pages/admin/Inventory.tsx`

**Specific Changes**:
1. **Add pagination state**: `page`, `perPage`, `totalPages`
2. **Add sort state**: `sortBy`, `sortDir`
3. **Pass params to API**: `{ page, per_page: perPage, sort_by: sortBy, sort_dir: sortDir }`
4. **Add per_page selector**: Options 200, 400
5. **Add sortable column headers**: Click to toggle sort direction
6. **Add pagination controls**: Previous/Next buttons

---

### Bug 10: Ventas — delivery time "—"

**File**: `frontend/src/pages/admin/Orders.tsx`

**Specific Changes**:
1. **Handle UTCDateTime in closed_at**: Parse `closed_at` the same way as other MongoDB dates — check for `$date.$numberLong` format

```tsx
const parseMongoDate = (d: any): Date | null => {
  if (!d) return null;
  if (typeof d === 'string') return new Date(d.replace(' ', 'T'));
  if (typeof d === 'object' && d.$date) {
    const ts = d.$date.$numberLong || d.$date;
    return new Date(parseInt(String(ts)));
  }
  return new Date(d);
};
```

2. **Use parseMongoDate for delivery time calculation**: Replace `new Date(o.closed_at)` with `parseMongoDate(o.closed_at)`

**Backend alternative**: Add `'closed_at' => 'datetime'` cast to `Order` model so it serializes as ISO string.

---

### Bug 11: Dashboard top items empty

**File**: `backend/app/Http/Controllers/OrderController.php`

**Function**: `dashboard()`

**Specific Changes**:
1. **Add fallback aggregation for Fudo orders**: After the existing `$unwind` + `$group` pipeline, if results are empty or all names start with "Venta #", run a second aggregation that groups by order-level fields:

```php
// If top items are empty or all placeholder names, fallback to channel/type aggregation
$topItemsArray = iterator_to_array($topItems);
$realItems = array_filter($topItemsArray, fn($i) => !str_starts_with($i->_id ?? '', 'Venta #'));

if (empty($realItems)) {
    // Fallback: aggregate by order description or use menu_items collection
    $topItems = MenuItem::orderBy('sort_order')
        ->where('available', true)
        ->limit(10)
        ->get()
        ->map(fn($item) => [
            '_id' => $item->name,
            'name' => $item->name,
            'quantity' => 0,
            'revenue' => 0,
        ]);
}
```

Alternatively, if Fudo orders have meaningful data in other fields (like `notes` or `customer.name`), aggregate by those. The most practical fallback is to show the menu items themselves when no real order-item data exists.

## Testing Strategy

### Validation Approach

La estrategia de testing sigue dos fases: primero, generar contraejemplos que demuestren los bugs en el código sin corregir, luego verificar que el fix funciona y preserva el comportamiento existente.

### Exploratory Fault Condition Checking

**Goal**: Demostrar los bugs ANTES de implementar el fix. Confirmar o refutar el análisis de causa raíz.

**Test Plan**: Escribir tests que simulen las condiciones de cada bug y verifiquen que el comportamiento actual es defectuoso.

**Test Cases**:
1. **Menu Admin Test**: Call `MenuController::index()` → assert response `data` is NOT a flat array (will fail = confirms bug)
2. **Expense Date Test**: Create expense with UTCDateTime `date` → serialize to JSON → assert frontend parser returns "—" (confirms bug)
3. **Expense Summary Test**: Insert expense with `category: "consumibles"` → call `summary()` → assert "consumibles" is NOT in `by_category` (confirms bug)
4. **Customer Ticket Test**: Call `CustomerController::show()` for customer with orders → assert `ai_profile.avg_order_value` is null/0 (confirms bug)
5. **CashRegister Date Test**: Create register with UTCDateTime `opened_at` → serialize → assert `fmtDate()` returns incorrect time (confirms bug)
6. **Inventory Pagination Test**: Call `InventoryController::ingredients()` → assert response has NO pagination metadata (confirms bug)
7. **Dashboard Top Items Test**: Insert Fudo-style orders with `items: [{name: "Venta #123"}]` → call `dashboard()` → assert `top_items` filtered by frontend is empty (confirms bug)

**Expected Counterexamples**:
- Menu returns grouped object instead of flat array
- Expense dates serialize as `{$date:{$numberLong:...}}` objects
- Summary misses Fudo categories entirely
- Top items are all "Venta #NNN" placeholders

### Fix Checking

**Goal**: Verificar que para todos los inputs donde la condición de bug se cumple, la función corregida produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos los inputs donde la condición de bug NO se cumple, la función corregida produce el mismo resultado que la original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing es recomendado para preservation checking porque:
- Genera muchos casos de prueba automáticamente
- Detecta edge cases que tests manuales podrían omitir
- Provee garantías fuertes de que el comportamiento no cambió

**Test Plan**: Observar comportamiento en código sin corregir primero, luego escribir PBT capturando ese comportamiento.

**Test Cases**:
1. **Public Menu Preservation**: Verify `GET /menu` continues returning only available items grouped by category after adding `adminIndex()`
2. **Expense CRUD Preservation**: Verify creating/updating/deleting expenses with hardcoded categories continues working after summary fix
3. **Customer Filter Preservation**: Verify search/tier/source filters continue working after per_page and ticket promedio fixes
4. **Dashboard KPI Preservation**: Verify KPI cards (sales_today, orders_today, etc.) continue showing correct values after top_items fix

### Unit Tests

- Test `MenuController::adminIndex()` returns flat array with all items (available + unavailable)
- Test `MenuController::index()` still returns grouped available-only items
- Test `ExpenseController::summary()` includes dynamic categories from DB
- Test `CustomerController::show()` returns computed `total_orders` and `total_spent` from orders
- Test `InventoryController::ingredients()` returns paginated response with sort
- Test `OrderController::dashboard()` top_items fallback when Fudo orders present
- Test date serialization for Expense, CashRegister, and Order models with `datetime` casts

### Property-Based Tests

- Generate random menu items (mix of available/unavailable) → verify `adminIndex()` returns all, `index()` returns only available
- Generate random expenses with various categories → verify `summary()` includes all categories with correct totals
- Generate random customer order histories → verify `computePredominantOrderType()` correctly maps all Fudo order types
- Generate random date formats (UTCDateTime, ISO string, date string) → verify frontend parser handles all correctly

### Integration Tests

- Test full admin menu flow: fetch items → verify count matches DB → create item → verify it appears
- Test expense summary with mixed Fudo + manual categories → verify all appear in summary
- Test customer detail modal → verify ticket promedio matches `total_spent / total_orders`
- Test inventory page with 500+ items → verify pagination works and sorting changes order
- Test dashboard with Fudo orders → verify top items section shows meaningful data

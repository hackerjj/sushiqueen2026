# Menu Unification Bugfix Design

## Overview

El sistema MealLi POS tiene tres fuentes de datos de menú desconectadas: `menuData.ts` (104 ítems con fotos correctas), MongoDB (111 ítems migrados de Fudo), y el POS que enriquece imágenes desde `menuData.ts`. Los cambios del admin no se reflejan en la página pública, el dashboard muestra "0 uds" en Top Items, y falta información de productos por cliente. La estrategia de fix es: (1) crear un seeder que upserte los 104 ítems de `menuData.ts` en MongoDB como fuente única de verdad, (2) actualizar `useMenu()` para leer de la API, (3) eliminar la dependencia de enriquecimiento de imágenes en POS, (4) implementar fuzzy matching en el dashboard para cruzar ventas Fudo con el menú unificado, (5) agregar top 5 productos por cliente, y (6) actualizar versión a v2.4.0.

## Glossary

- **Bug_Condition (C)**: Cualquier lectura de datos de menú que use `menuData.ts` directamente en vez de la API, o cualquier cálculo de ventas que no cruce datos Fudo con el menú unificado
- **Property (P)**: Todos los consumidores (página pública, POS, chatbot, dashboard) leen del mismo origen (MongoDB vía API) y los datos de ventas reflejan cantidades reales
- **Preservation**: El flujo de CRUD del admin en MenuManager, el carrito/pago del POS, las referencias de `_id` en órdenes, y el export/import CSV deben seguir funcionando igual
- **menuData.ts**: Archivo estático en `frontend/src/data/menuData.ts` con 104 ítems del menú público de sushiqueen.galt.com.mx — fotos nuevas, precios correctos, descripciones y modificadores
- **useMenu()**: Hook en `frontend/src/hooks/useMenu.ts` que actualmente lee de `menuData.ts` directamente
- **enrichImages()**: Función en `POS.tsx` que mapea `image_url` desde `menuData.ts` a ítems de MongoDB que no tienen imagen
- **Fudo orders**: Órdenes migradas desde Fudo con items genéricos tipo `[{name: "Venta #12345", quantity: 1, price: total}]` — sin detalle de productos reales
- **dashboard()**: Método en `OrderController.php` que calcula Top Items haciendo `$unwind` de `$items` — falla porque los items Fudo no tienen nombres de productos reales

## Bug Details

### Fault Condition

El bug se manifiesta en múltiples puntos del sistema donde se leen datos de menú desde `menuData.ts` en vez de la API, y donde el dashboard intenta calcular Top Items desde órdenes Fudo que no tienen detalle de productos. Adicionalmente, el detalle de cliente no muestra productos más pedidos.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: string, source: string, context: string }
  OUTPUT: boolean

  RETURN (
    (input.action == "read_menu" AND input.source == "menuData.ts"
      AND input.context IN ["public_page", "chatbot"])
    OR
    (input.action == "enrich_images" AND input.source == "menuData.ts"
      AND input.context == "pos")
    OR
    (input.action == "calculate_top_items" AND input.source == "order_items_unwind"
      AND ordersHaveGenericItems())
    OR
    (input.action == "show_customer_top_products"
      AND input.context == "customer_detail"
      AND topProductsNotAvailable())
  )
END FUNCTION
```

### Examples

- **Página pública**: Admin cambia precio de "Gohan Especial" de $127 a $140 en MenuManager → la página `/menu` sigue mostrando $127 porque `useMenu()` lee de `menuData.ts`
- **POS imágenes**: MongoDB tiene un ítem "Maki Philadelphia" sin `image_url` → POS usa `enrichImages()` para buscar la imagen en `menuData.ts` por nombre, creando dependencia oculta
- **Chatbot**: Usuario pregunta "¿cuánto cuesta el ramen?" → chatbot responde con precio de `menuData.ts` ($164) aunque el admin lo cambió a $180 en MongoDB
- **Dashboard Top Items**: Órdenes Fudo tienen items como `{name: "Venta #12345", quantity: 1}` → el `$unwind` + `$group` por `items.name` agrupa por "Venta #..." → fallback muestra menu items con "0 uds"
- **Customer detail**: Admin abre detalle de cliente → no hay sección de "Top 5 productos más pedidos"
- **Data mismatch**: MongoDB tiene 111 ítems (Fudo), `menuData.ts` tiene 104 → 7 ítems extra en MongoDB que pueden no ser del menú actual

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- El CRUD de MenuManager (crear, editar, eliminar ítems) debe seguir persistiendo en MongoDB vía `/api/admin/menu`
- La página pública debe seguir mostrando ítems agrupados por categoría con imágenes, precios y descripciones (mismo resultado visual)
- El POS debe seguir mostrando solo ítems disponibles con imágenes, y el flujo de carrito/orden/pago no cambia
- El export/import CSV debe seguir funcionando con los endpoints existentes
- Las órdenes que referencian menu items por `_id` deben seguir funcionando para reportes y analytics
- Si la API no está disponible, el POS puede seguir usando `menuData.ts` como fallback offline

**Scope:**
Todos los flujos que NO involucran lectura de datos de menú desde `menuData.ts` o cálculo de Top Items deben ser completamente inalterados. Esto incluye:
- Flujo de creación de órdenes (POST `/orders`)
- Gestión de mesas, caja, inventario, proveedores
- Autenticación y autorización
- WhatsApp webhooks y AI recommendations

## Hypothesized Root Cause

Based on the code analysis, the root causes are:

1. **useMenu() lee de menuData.ts directamente**: En `frontend/src/hooks/useMenu.ts`, el hook nunca llama a la API — simplemente filtra `menuData` por categoría. No hay `api.get('/menu')` en ninguna parte del hook.

2. **POS enrichImages() depende de menuData.ts**: En `POS.tsx` línea ~30, `imageByName` crea un mapa de `name.toLowerCase() → image_url` desde `menuData`, y `enrichImages()` lo usa para parchar ítems de MongoDB sin imagen. Esto existe porque MongoDB (migrado de Fudo) no tiene las imágenes correctas.

3. **AIChatbot.tsx lee menuData directamente**: El chatbot importa `menuData` y lo usa para búsquedas de menú, categorías y precios sin consultar la API.

4. **Dashboard $unwind falla con órdenes Fudo**: En `OrderController::dashboard()`, el pipeline hace `$unwind: '$items'` y `$group: {_id: '$items.name'}`. Pero las órdenes Fudo tienen items genéricos `{name: "Venta #12345", quantity: 1, price: total}` — no hay nombres de productos reales. El fallback actual muestra menu items con `quantity: 0`.

5. **Falta endpoint de top products por cliente**: `CustomerController::show()` devuelve órdenes pero no agrega productos más pedidos. Las órdenes Fudo tampoco tienen detalle de productos, así que se necesita fuzzy matching similar al dashboard.

6. **MongoDB no tiene imágenes correctas**: La migración Fudo (`MigrateFudoToMongo.php`) importó items desde `sushi_queen_menu.json` que no tiene las fotos nuevas de la página pública. `menuData.ts` SÍ tiene las fotos correctas.

## Correctness Properties

Property 1: Fault Condition - Menu Data Source Unification

_For any_ request to display menu data (public page, POS, chatbot), the system SHALL fetch data from MongoDB via the `/api/menu` endpoint (or `/api/admin/menu` for admin contexts), and the data SHALL reflect the latest admin changes without reading from the static `menuData.ts` file (except as offline fallback).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Fault Condition - Dashboard Top Items with Real Quantities

_For any_ request to the dashboard Top Items section, the system SHALL cross-reference Fudo order data with the unified menu using fuzzy/approximate name matching and SHALL display actual quantities sold (not "0 uds"), using order totals and menu prices to estimate units when item-level detail is unavailable.

**Validates: Requirements 2.7**

Property 3: Fault Condition - Customer Top Products

_For any_ customer detail view, the system SHALL display the customer's top 5 most ordered products by aggregating from their order history and cross-referencing with the unified menu.

**Validates: Requirements 2.8**

Property 4: Preservation - Admin CRUD and Order References

_For any_ admin operation (create, update, delete menu items, export/import CSV) or order that references menu items by `_id`, the fixed system SHALL produce the same result as the original system, preserving all existing MenuManager, POS cart/payment, and reporting functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:


**File**: `backend/app/Console/Commands/SeedMenuFromData.php` (NEW)

**Command**: `php artisan menu:seed-from-data`

**Specific Changes**:
1. **Crear comando Artisan de seed**: Lee un JSON generado desde `menuData.ts` (o recibe los datos vía endpoint). Upsert por `name` — actualiza `image_url`, `price`, `description`, `category`, `modifiers`, `sort_order`, `available` desde menuData. Preserva `_id` de ítems existentes. Marca ítems en MongoDB que NO están en menuData como `available: false`.
2. **Crear endpoint de seed**: `POST /api/admin/menu/seed` que acepta el array de menuData como JSON body y ejecuta el upsert. Alternativa: crear un script que convierta `menuData.ts` a JSON y lo envíe al endpoint.

---

**File**: `frontend/src/hooks/useMenu.ts`

**Function**: `useMenu()`

**Specific Changes**:
3. **Cambiar a API call**: Reemplazar la lectura directa de `menuData` con `api.get('/menu')`. Parsear la respuesta agrupada del endpoint público y aplanar a array. Mantener `menuData` como fallback si la API falla (preservación 3.4).

---

**File**: `frontend/src/pages/admin/POS.tsx`

**Function**: `POS` component

**Specific Changes**:
4. **Eliminar enrichImages()**: Después del seed, MongoDB tendrá las imágenes correctas. Eliminar `imageByName`, `enrichImages()`, y el import de `menuData` en POS. Mantener `menuData` solo como fallback en el `catch` de `fetchMenu()`.

---

**File**: `frontend/src/components/chat/AIChatbot.tsx`

**Specific Changes**:
5. **Reemplazar menuData con API call**: Agregar un `useEffect` que cargue el menú desde `/api/menu` al montar el componente. Usar esos datos en vez de `menuData` para búsquedas, categorías y precios. Fallback a `menuData` si la API falla.

---

**File**: `backend/app/Http/Controllers/OrderController.php`

**Function**: `dashboard()`

**Specific Changes**:
6. **Implementar fuzzy matching para Top Items**: En vez de hacer `$unwind` de `$items` (que falla con Fudo), implementar una estrategia alternativa:
   - Obtener todas las órdenes del mes con sus totales
   - Obtener todos los menu items con sus precios
   - Para órdenes Fudo (items con nombre "Venta #..."), usar el `notes` field o el total de la orden para estimar qué productos se vendieron — o alternativamente, usar la descripción de la venta Fudo si existe
   - Si no hay detalle de productos en las órdenes Fudo, calcular distribución estimada basada en popularidad relativa de precios del menú
   - Para órdenes POS (con items reales), agregar normalmente
   - Combinar ambos resultados para el Top 10

   **Approach más pragmático**: Dado que las órdenes Fudo no tienen detalle de productos, la mejor estrategia es:
   - Contar solo órdenes POS (source != 'fudo') para Top Items con detalle real
   - Para órdenes Fudo, mostrar un resumen separado de revenue total
   - O bien: usar el campo `notes` de las órdenes Fudo que a veces contiene nombres de productos

---

**File**: `backend/app/Http/Controllers/CustomerController.php`

**Function**: `show()`

**Specific Changes**:
7. **Agregar top 5 productos por cliente**: En el método `show()`, agregar una aggregation pipeline que haga `$unwind` de `$items`, `$group` por `items.name`, `$sort` por quantity desc, `$limit` 5. Filtrar items genéricos tipo "Venta #...". Devolver en la respuesta como `top_products`.

---

**File**: `frontend/src/pages/admin/Customers.tsx`

**Specific Changes**:
8. **Mostrar top products en detail modal**: En el modal de detalle de cliente, agregar una sección "Productos Más Pedidos" que muestre los `top_products` devueltos por la API.

---

**File**: `frontend/src/components/admin/AdminLayout.tsx`

**Specific Changes**:
9. **Actualizar versión**: Cambiar `v2.3.0` a `v2.4.0` en la línea del footer.

---

**File**: `CHANGELOG.md`

**Specific Changes**:
10. **Agregar entrada v2.4.0**: Documentar todos los cambios de esta unificación de menú.

## Testing Strategy

### Validation Approach

La estrategia de testing sigue dos fases: primero, verificar que los bugs existen en el código sin fix (counterexamples), luego verificar que el fix funciona y preserva el comportamiento existente.

### Exploratory Fault Condition Checking

**Goal**: Demostrar los bugs ANTES de implementar el fix. Confirmar o refutar el análisis de root cause.

**Test Plan**: Escribir tests que verifiquen el comportamiento actual defectuoso y observar los fallos.

**Test Cases**:
1. **useMenu reads static data**: Verificar que `useMenu()` retorna datos de `menuData.ts` sin hacer ningún API call (fallará después del fix porque hará API call)
2. **POS enrichImages dependency**: Verificar que POS importa `menuData` y usa `enrichImages()` — después del fix, esta función no debería existir
3. **Dashboard shows 0 uds**: Llamar al endpoint `/admin/dashboard` con órdenes Fudo y verificar que `top_items` tiene `quantity: 0` para todos los items
4. **Customer detail missing top products**: Llamar a `/admin/customers/{id}` y verificar que la respuesta NO contiene `top_products`

**Expected Counterexamples**:
- `useMenu()` nunca llama a `api.get('/menu')` — retorna datos estáticos
- Dashboard `top_items` son menu items con `quantity: 0` porque el fallback se activa
- Customer detail no tiene campo `top_products`

### Fix Checking

**Goal**: Verificar que para todos los inputs donde la bug condition se cumple, la función fixed produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedSystem(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Specific checks:**
- `useMenu()` llama a `/api/menu` y retorna datos de MongoDB
- Después del seed, MongoDB tiene 104 ítems con `image_url` correctas
- Dashboard Top Items muestra cantidades > 0 para productos reales
- Customer detail incluye `top_products` con hasta 5 productos

### Preservation Checking

**Goal**: Verificar que para todos los inputs donde la bug condition NO se cumple, el sistema fixed produce el mismo resultado que el original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalSystem(input) = fixedSystem(input)
END FOR
```

**Testing Approach**: Property-based testing es recomendado para preservation checking porque genera muchos casos de prueba automáticamente y detecta edge cases.

**Test Plan**: Observar comportamiento en código sin fix para operaciones CRUD, luego escribir tests que verifiquen que ese comportamiento se preserva.

**Test Cases**:
1. **MenuManager CRUD preservation**: Verificar que crear, editar y eliminar ítems vía `/api/admin/menu` sigue funcionando igual
2. **POS cart/order preservation**: Verificar que agregar al carrito, enviar a cocina y cobrar sigue funcionando
3. **CSV export/import preservation**: Verificar que export e import CSV producen los mismos resultados
4. **Order _id references preservation**: Verificar que órdenes existentes siguen referenciando menu items correctamente

### Unit Tests

- Test del comando `menu:seed-from-data` — upsert por nombre, preserva `_id`, marca no-presentes como `available: false`
- Test de `useMenu()` — llama API, fallback a menuData si falla
- Test de `dashboard()` — fuzzy matching produce cantidades > 0
- Test de `CustomerController::show()` — incluye `top_products`
- Test de AIChatbot — usa datos de API en vez de menuData

### Property-Based Tests

- Generar arrays aleatorios de menu items y verificar que el seed upsert preserva `_id` existentes y marca ausentes como `available: false`
- Generar órdenes con items variados y verificar que el dashboard Top Items siempre produce resultados con cantidades ≥ 0
- Generar configuraciones de cliente con órdenes y verificar que `top_products` siempre tiene ≤ 5 items ordenados por cantidad desc

### Integration Tests

- Test end-to-end: seed → admin edita precio → página pública muestra precio nuevo
- Test end-to-end: seed → POS carga menú sin enrichImages → imágenes correctas
- Test end-to-end: crear órdenes POS → dashboard muestra Top Items con cantidades reales
- Test end-to-end: crear órdenes para cliente → detalle muestra top 5 productos

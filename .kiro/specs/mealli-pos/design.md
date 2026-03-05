# MealLi POS - Diseño Técnico

## Arquitectura Actualizada

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   HOSTINGER VPS                           │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  React Frontend  │  │     Laravel API Backend      │  │
│  │  (Nginx static)  │  │     (PHP-FPM + Nginx)       │  │
│  │                  │  │                              │  │
│  │  - Public Site   │  │  - REST API                  │  │
│  │  - Admin/MealLi  │  │  - MealLi POS Engine        │  │
│  │  - KDS View      │  │  - WhatsApp Integration     │  │
│  │  - Caja View     │  │  - AI Service               │  │
│  └─────────────────┘  │  - Inventory Engine          │  │
│                        │  - Cash Register Engine      │  │
│                        └──────────────────────────────┘  │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │    MongoDB       │  │         Redis                │  │
│  │  (Data Store)    │  │   (Cache + Realtime)         │  │
│  └─────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Nuevos Modelos de Datos (MongoDB)

### CashRegister (Caja)
```json
{
  "_id": "ObjectId",
  "name": "string",
  "opened_by": "ObjectId (User)",
  "opened_at": "datetime",
  "closed_at": "datetime|null",
  "initial_amount": "number",
  "expected_amount": "number",
  "actual_amount": "number|null",
  "status": "open|closed",
  "movements": [{
    "type": "sale|expense|withdrawal|deposit|tip",
    "amount": "number",
    "description": "string",
    "order_id": "ObjectId|null",
    "payment_method": "cash|card|transfer",
    "created_at": "datetime"
  }],
  "summary": {
    "total_sales": "number",
    "total_cash": "number",
    "total_card": "number",
    "total_transfer": "number",
    "total_tips": "number",
    "total_expenses": "number",
    "total_withdrawals": "number"
  }
}
```

### Ingredient (Insumo/Ingrediente)
```json
{
  "_id": "ObjectId",
  "name": "string",
  "unit": "kg|g|l|ml|pza|paq",
  "current_stock": "number",
  "min_stock": "number",
  "cost_per_unit": "number",
  "supplier_id": "ObjectId|null",
  "category": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Recipe (Receta)
```json
{
  "_id": "ObjectId",
  "menu_item_id": "ObjectId",
  "ingredients": [{
    "ingredient_id": "ObjectId",
    "quantity": "number",
    "unit": "string"
  }],
  "total_cost": "number",
  "yield": "number",
  "notes": "string"
}
```

### InventoryMovement
```json
{
  "_id": "ObjectId",
  "ingredient_id": "ObjectId",
  "type": "purchase|sale|waste|adjustment|count",
  "quantity": "number",
  "previous_stock": "number",
  "new_stock": "number",
  "cost": "number|null",
  "order_id": "ObjectId|null",
  "notes": "string",
  "created_by": "ObjectId",
  "created_at": "datetime"
}
```

### Supplier (Proveedor)
```json
{
  "_id": "ObjectId",
  "name": "string",
  "contact_name": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "notes": "string",
  "created_at": "datetime"
}
```

### Table (Mesa)
```json
{
  "_id": "ObjectId",
  "number": "integer",
  "name": "string",
  "capacity": "integer",
  "status": "free|occupied|reserved|billing",
  "current_order_id": "ObjectId|null",
  "position_x": "number",
  "position_y": "number",
  "zone": "string"
}
```

## Cambios al Modelo Order Existente
```json
{
  // Campos existentes se mantienen...
  // Se ELIMINA: "fudo_order_id"
  // Se AGREGAN:
  "order_number": "string (ej: #001)",
  "table_id": "ObjectId|null",
  "payment_method": "cash|card|transfer|pending",
  "payment_status": "pending|paid|refunded",
  "cash_register_id": "ObjectId|null",
  "tip": "number",
  "prepared_items": ["array de menu_item_ids ya preparados"],
  "type": "dine_in|takeout|delivery",
  "assigned_to": "ObjectId|null (repartidor)",
  "estimated_time": "integer (minutos)"
}
```

## Cambios al Modelo MenuItem Existente
```json
{
  // Se ELIMINA: "fudo_id"
  // Se AGREGAN:
  "prices": {
    "default": "number",
    "delivery": "number|null",
    "app": "number|null"
  },
  "available_hours": {
    "start": "string HH:mm|null",
    "end": "string HH:mm|null"
  },
  "recipe_id": "ObjectId|null",
  "cost": "number (calculado desde receta)"
}
```

## Nuevos API Endpoints

### POS / Órdenes (mejoras)
- `POST /api/admin/orders` - Crear orden desde admin (mostrador)
- `PATCH /api/admin/orders/:id/status` - Cambiar estado (ya existe, se mejora)
- `POST /api/admin/orders/:id/pay` - Registrar pago
- `GET /api/admin/orders/kitchen` - Órdenes para KDS
- `PATCH /api/admin/orders/:id/items/:itemIndex/prepared` - Marcar item preparado

### Caja
- `POST /api/admin/cash-register/open` - Abrir caja
- `POST /api/admin/cash-register/close` - Cerrar caja (arqueo)
- `GET /api/admin/cash-register/current` - Caja actual abierta
- `POST /api/admin/cash-register/movement` - Registrar movimiento
- `GET /api/admin/cash-register/history` - Historial de cajas

### Inventario
- `GET /api/admin/ingredients` - Listar ingredientes
- `POST /api/admin/ingredients` - Crear ingrediente
- `PUT /api/admin/ingredients/:id` - Actualizar ingrediente
- `DELETE /api/admin/ingredients/:id` - Eliminar ingrediente
- `POST /api/admin/inventory/movement` - Registrar movimiento
- `GET /api/admin/inventory/movements` - Historial movimientos
- `POST /api/admin/inventory/count` - Conteo físico

### Recetas
- `GET /api/admin/recipes` - Listar recetas
- `POST /api/admin/recipes` - Crear receta
- `PUT /api/admin/recipes/:id` - Actualizar receta
- `GET /api/admin/recipes/:id/cost` - Calcular costo

### Proveedores
- `GET /api/admin/suppliers` - Listar proveedores
- `POST /api/admin/suppliers` - Crear proveedor
- `PUT /api/admin/suppliers/:id` - Actualizar proveedor
- `DELETE /api/admin/suppliers/:id` - Eliminar proveedor

### Mesas
- `GET /api/admin/tables` - Listar mesas
- `POST /api/admin/tables` - Crear mesa
- `PUT /api/admin/tables/:id` - Actualizar mesa
- `PATCH /api/admin/tables/:id/status` - Cambiar estado
- `POST /api/admin/tables/:id/assign-order` - Asignar orden

## Nuevas Páginas Frontend (Admin)

- `/admin/pos` - Punto de venta (crear órdenes rápido)
- `/admin/kitchen` - KDS (Kitchen Display System)
- `/admin/cash-register` - Gestión de caja
- `/admin/inventory` - Control de inventario
- `/admin/recipes` - Gestión de recetas
- `/admin/suppliers` - Proveedores
- `/admin/tables` - Mapa de mesas
- `/admin/reports` - Reportes avanzados

## Archivos a Modificar/Eliminar

### Eliminar dependencia Fudo:
- `backend/app/Services/FudoService.php` → ELIMINAR
- `backend/config/fudo.php` → ELIMINAR
- `backend/app/Http/Controllers/WebhookController.php` → REFACTORIZAR (quitar Fudo, dejar WhatsApp)
- `backend/app/Http/Controllers/OrderController.php` → REFACTORIZAR (quitar envío a Fudo)
- `backend/routes/api.php` → LIMPIAR rutas de Fudo
- `frontend/src/pages/admin/MenuManager.tsx` → QUITAR botón "Sync Fudo"

### Nuevos archivos backend:
- `backend/app/Models/CashRegister.php`
- `backend/app/Models/Ingredient.php`
- `backend/app/Models/Recipe.php`
- `backend/app/Models/InventoryMovement.php`
- `backend/app/Models/Supplier.php`
- `backend/app/Models/Table.php`
- `backend/app/Http/Controllers/CashRegisterController.php`
- `backend/app/Http/Controllers/InventoryController.php`
- `backend/app/Http/Controllers/RecipeController.php`
- `backend/app/Http/Controllers/SupplierController.php`
- `backend/app/Http/Controllers/TableController.php`
- `backend/app/Http/Controllers/KitchenController.php`
- `backend/app/Services/POSService.php`
- `backend/app/Services/InventoryService.php`

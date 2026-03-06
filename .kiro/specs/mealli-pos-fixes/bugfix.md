# Bugfix Requirements Document

## Introduction

MealLi POS v2.3 presenta múltiples bugs en los módulos de administración que afectan la visualización de datos, cálculos y funcionalidad de paginación/ordenamiento. Los datos existen en MongoDB pero no se muestran correctamente en el frontend, o los endpoints del backend no los procesan/retornan adecuadamente. Este documento cubre 8 áreas de bugs: Menú Admin, Gastos, Resumen de Categorías de Gastos, Clientes, Caja, Inventario, Ventas y Dashboard.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the admin navigates to Menu Manager (`/admin/menu`) THEN the system returns an empty list (0 items) because `MenuController::index()` filters by `available = true` and the response wraps items grouped by category, but `MenuManager.tsx` expects a flat array from `data.data`

1.2 WHEN the admin views the Expenses list THEN the system shows "—" for all dates because the `date` field stored as MongoDB UTCDateTime is not properly parsed by the frontend date formatter

1.3 WHEN the admin views the Expenses date filter THEN the system only offers preset periods (today/week/month/year) with no custom date range picker and no maximum range limit of 24 months

1.4 WHEN the admin views the Expense Category Summary THEN the system only shows categories defined in `Expense::CATEGORIES` (ingredientes, servicios, personal, alquiler, marketing, otros) instead of the actual Fudo-imported categories (consumibles, verduras, basura, importación, sueldos, cárnicos, abarrotes, mantenimiento, agua, etc.)

1.5 WHEN the admin views the Customers table THEN the "Tipo Predominante" column shows "—" for customers whose `predominant_order_type` is computed by the backend but the frontend reads it from the paginated response where the field may not be serialized correctly

1.6 WHEN the admin views the Customer detail modal THEN the "Ticket Promedio" shows $0.00 because it reads from `detail.ai_profile?.avg_order_value` which is not populated, instead of calculating `total_spent / total_orders`

1.7 WHEN the admin views the Customers list THEN the system is hardcoded to `per_page: 50` with no selector to change page size (50/100/200/400)

1.8 WHEN the admin views the Cash Register history (Arqueos de Caja) THEN the opening time ("Hora de apertura") shows incorrect times (e.g., 9am instead of ~12am) because `opened_at` stored as MongoDB UTCDateTime is not parsed correctly by the `fmtDate` function

1.9 WHEN the admin views the Inventory list THEN the system loads all ingredients without pagination and has no per_page selector (200/400)

1.10 WHEN the admin views the Inventory table THEN the columns (ingredient, category, cost) are not sortable

1.11 WHEN the admin views the Sales/Ventas table THEN the "Tiempo de Entrega" column shows "—" for most orders because `closed_at` is not stored on Fudo-imported orders and `delivery_time_min` is not populated in the order documents

1.12 WHEN the admin views the Dashboard Top Items section THEN the system shows "Sin datos aún" because Fudo-imported orders do not have product detail in the `items` array, so the `$unwind` + `$group` aggregation returns empty results

### Expected Behavior (Correct)

2.1 WHEN the admin navigates to Menu Manager (`/admin/menu`) THEN the system SHALL return all menu items from MongoDB (both available and unavailable) and the frontend SHALL correctly parse the response whether it's a flat array or grouped by category

2.2 WHEN the admin views the Expenses list THEN the system SHALL correctly parse and display the `date` field regardless of whether it's stored as a MongoDB UTCDateTime object, ISO string, or date string, showing it in `es-MX` locale format

2.3 WHEN the admin views the Expenses date filter THEN the system SHALL provide custom start/end date pickers in addition to preset periods, with a maximum selectable range of 24 months

2.4 WHEN the admin views the Expense Category Summary THEN the system SHALL show ALL categories that have expenses in the database, including Fudo-imported categories (consumibles, verduras, basura, importación, sueldos, cárnicos, abarrotes, mantenimiento, agua, etc.), not just the hardcoded `CATEGORIES` constant

2.5 WHEN the admin views the Customers table THEN the "Tipo Predominante" column SHALL display the computed value (local/delivery/app) returned by the backend for each customer

2.6 WHEN the admin views the Customer detail modal THEN the "Ticket Promedio" SHALL display `total_spent / total_orders` when `total_orders > 0`, or $0.00 when there are no orders

2.7 WHEN the admin views the Customers list THEN the system SHALL provide a per_page selector with options 50, 100, 200, and 400

2.8 WHEN the admin views the Cash Register history THEN the "Hora de apertura" SHALL correctly parse the `opened_at` MongoDB UTCDateTime and display the accurate local time in `es-MX` format

2.9 WHEN the admin views the Inventory list THEN the system SHALL support pagination with a per_page selector offering options 200 and 400

2.10 WHEN the admin views the Inventory table THEN the columns ingredient, category, and cost SHALL be sortable by clicking the column header

2.11 WHEN the admin views the Sales/Ventas table THEN the "Tiempo de Entrega" column SHALL display the delivery time calculated from order timestamps when available, or from the `delivery_time_min` field if stored in the order document

2.12 WHEN the admin views the Dashboard Top Items section THEN the system SHALL display the top selling items aggregated from order data, handling Fudo-imported orders that may store product info differently (e.g., order name/description instead of items array)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the admin creates, edits, or deletes a menu item THEN the system SHALL CONTINUE TO perform CRUD operations correctly via the MenuController

3.2 WHEN the admin creates, edits, or deletes an expense THEN the system SHALL CONTINUE TO save and validate expense data correctly

3.3 WHEN the admin searches, filters by tier, or filters by source on the Customers page THEN the system SHALL CONTINUE TO filter customers correctly

3.4 WHEN the admin opens or closes the cash register THEN the system SHALL CONTINUE TO record opening/closing amounts and movements correctly

3.5 WHEN the admin adds inventory movements (purchase, waste, adjustment) THEN the system SHALL CONTINUE TO update stock levels correctly

3.6 WHEN the admin views the Sales table with existing sorting by order_number and created_at THEN the system SHALL CONTINUE TO sort correctly

3.7 WHEN the admin views the Dashboard KPI cards (Ventas Hoy, Ventas Mes, Órdenes Hoy, Nuevos Clientes) THEN the system SHALL CONTINUE TO display correct aggregated values

3.8 WHEN the public menu endpoint (`/menu`) is accessed THEN the system SHALL CONTINUE TO return only available items grouped by category

# Bugfix Requirements Document

## Introduction

El sistema MealLi POS tiene tres fuentes de datos de menú desconectadas que deberían ser una sola. La página pública del menú lee de un archivo estático (`menuData.ts` con 104 ítems y fotos correctas), el admin MenuManager lee de MongoDB (111 ítems migrados de Fudo), y el POS lee de MongoDB pero enriquece imágenes desde `menuData.ts`. Cuando el admin edita un ítem (precio, disponibilidad, descripción, imagen), los cambios no se reflejan en la página pública porque esta nunca consulta la API. No existe una fuente única de verdad.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin updates a menu item's price, description, or availability via MenuManager THEN the public menu page (`/menu`) does not reflect the change because `useMenu()` reads directly from the static `menuData.ts` file instead of calling the API

1.2 WHEN an admin uploads a new image for a menu item via MenuManager THEN the public menu page does not show the new image because it reads `image_url` from `menuData.ts`

1.3 WHEN the POS system fetches menu items from the API and an item has no `image_url` in MongoDB THEN the POS falls back to `menuData.ts` for image enrichment, creating a hidden dependency on the static file that masks missing data in MongoDB

1.4 WHEN the AI chatbot (`AIChatbot.tsx`) responds to menu queries THEN it reads item names, prices, and categories from `menuData.ts` instead of the API, potentially showing stale or incorrect information

1.5 WHEN MongoDB contains 111 items (migrated from Fudo) and `menuData.ts` contains 104 items THEN there is a data mismatch — 7 items exist only in MongoDB and some items may have different prices, descriptions, or images between the two sources

1.6 WHEN the admin views the Dashboard "Top Items" section THEN the system shows the correct product names (from the menu fallback) but with "0 uds" for all items because the Fudo orders don't have real product detail in the `items` array — the names are correct but the quantities and revenue are zero because there is no cross-reference between order data and the unified menu to calculate actual units sold

1.7 WHEN the admin opens a customer detail view THEN the system does not show the customer's top 5 most ordered products, which is critical information for understanding customer preferences

1.8 WHEN the version and changelog are checked THEN they still show v2.3.0 and do not reflect the menu unification changes

1.9 WHEN the admin views the Customers list THEN the "Tipo Predominante" column still shows "—" for most customers, the per_page selector is NOT visible because the v2.3.0 frontend changes were not deployed to Hostinger (branch `deploy-sushiqueen` is behind `main` — commit `05a1300` vs `a45c596`), and the user cannot see more than 50 clients per page or navigate pages

### Expected Behavior (Correct)

2.1 WHEN an admin updates a menu item's price, description, or availability via MenuManager THEN the public menu page SHALL reflect the change by fetching data from the `/api/menu` endpoint

2.2 WHEN an admin uploads a new image for a menu item via MenuManager THEN the public menu page SHALL show the updated image by reading `image_url` from the API response

2.3 WHEN the POS system fetches menu items from the API THEN it SHALL use the API data directly without needing image enrichment from `menuData.ts`, because MongoDB SHALL contain the correct `image_url` for all items

2.4 WHEN the AI chatbot responds to menu queries THEN it SHALL fetch current menu data from the API to ensure prices, names, and categories are up to date

2.5 WHEN the system is initialized or synced THEN MongoDB SHALL be seeded/upserted with the 104 items from `menuData.ts` — which represents the menu de la página pública (`sushiqueen.galt.com.mx/menu`) con las fotos nuevas, precios correctos, descripciones y modificadores — as the SINGLE SOURCE OF TRUTH. The `menuData.ts` file IS the canonical menu of the public page and must be used as the seed data to populate MongoDB. After sync, all consumers (public page, admin, POS, chatbot) SHALL read from MongoDB via the API

2.6 WHEN the seed/sync runs THEN the system SHALL upsert items by name (matching `menuData.ts` items to existing MongoDB items), preserving any MongoDB-only fields (like `_id` references in orders), updating `image_url`, `price`, `description`, `category`, `modifiers`, `sort_order`, and `available` from `menuData.ts`, and marking any MongoDB items NOT in `menuData.ts` as `available: false` (soft-delete, not hard-delete, to preserve order history references)

2.7 WHEN the admin views the Dashboard "Top Items" section THEN the system SHALL cross-reference Fudo order data (using order descriptions, item names, or any available product info) with the unified menu items using fuzzy/approximate name matching, and SHALL display the top 10 most sold products with their name, actual quantity sold (units), and revenue — not "0 uds". The matching should use the ventas (sales) data from MongoDB orders to calculate real quantities

2.8 WHEN the admin opens a customer detail view THEN the system SHALL display the customer's top 5 most ordered products (product name, quantity ordered, total spent on that product) by aggregating from their order history and cross-referencing with the unified menu

2.9 WHEN the fix is complete THEN the version SHALL be bumped to v2.4.0 in `AdminLayout.tsx` and the `CHANGELOG.md` SHALL be updated with all changes made in this bugfix

2.10 WHEN the admin views the Customers list THEN the per_page selector SHALL work correctly with options 50/100/200/400, and the "Tipo Predominante" column SHALL show the correct value for all customers with orders

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the admin uses MenuManager to create, update, or delete menu items THEN the system SHALL CONTINUE TO persist changes in MongoDB via the existing `/api/admin/menu` endpoints

3.2 WHEN the public menu page loads THEN the system SHALL CONTINUE TO display items grouped by category with correct images, prices, and descriptions (same visual result as current `menuData.ts` rendering)

3.3 WHEN the POS system loads the menu THEN the system SHALL CONTINUE TO show only available items with correct images, and SHALL CONTINUE TO support the existing cart, order, and payment workflows

3.4 WHEN the API is temporarily unavailable THEN the POS system SHALL CONTINUE TO fall back gracefully (current behavior uses `menuData.ts` as fallback, which may be retained as an offline safety net)

3.5 WHEN the admin exports or imports menu items via CSV THEN the system SHALL CONTINUE TO function correctly with the existing export/import endpoints

3.6 WHEN orders reference menu items by `_id` THEN the system SHALL CONTINUE TO correctly cross-reference items for sales reports and analytics

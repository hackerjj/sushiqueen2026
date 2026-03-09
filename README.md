# Sushi Queen + MealLi POS

Full-stack restaurant platform combining a public-facing ordering website (Sushi Queen) with an integrated POS management system (MealLi). Built to replace third-party POS services like Fudo with a fully owned, internal solution.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Public Website](#public-website)
- [MealLi POS Admin](#mealli-pos-admin)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Integrations](#integrations)

## Architecture

```
                    CLOUDFLARE CDN
              (DNS, SSL, Analytics, WAF)
                        |
    ┌───────────────────┴───────────────────┐
    |                                       |
    v                                       v
┌─────────────────┐          ┌──────────────────────────┐
| React Frontend  |          |   Laravel API Backend    |
| (Hostinger)     |          |   (Render.com)           |
|                 |          |                          |
| Public Site:    |  ──API── |  POSService              |
|  - Home         |          |  InventoryService        |
|  - Menu         |          |  WhatsAppService         |
|  - Orders       |          |  AIService (Gemini)      |
|  - Promotions   |          |  AnalyticsService        |
|                 |          |                          |
| MealLi Admin:   |          |  Controllers:            |
|  - Dashboard    |          |   OrderController        |
|  - POS          |          |   MenuController         |
|  - Kitchen KDS  |          |   CashRegisterController |
|  - Cash Register|          |   InventoryController    |
|  - Menu Manager |          |   RecipeController       |
|  - Inventory    |          |   TableController        |
|  - Recipes      |          |   SupplierController     |
|  - Tables       |          |   CustomerController     |
|  - Suppliers    |          |   PromotionController    |
|  - Customers    |          |   InsightsController     |
|  - Promotions   |          |                          |
|  - Insights     |          └──────────┬───────────────┘
|  - Reports      |                     |
└─────────────────┘          ┌──────────┴───────────────┐
                             |          |               |
                          MongoDB    Redis    WhatsApp API
                          (Atlas)   (Cache)   (Business)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand |
| Backend | PHP 8.2, Laravel 11, JWT Auth |
| Database | MongoDB 7 (Atlas) |
| Cache | Redis 7 |
| AI | Google Gemini 2.0 Flash |
| Messaging | WhatsApp Business Cloud API |
| Monitoring | Prometheus + Grafana |
| CDN | Cloudflare |
| CI/CD | GitHub Actions + Hostinger Git Deploy |
| Frontend Hosting | Hostinger (static files) |
| Backend Hosting | Render.com |

## Public Website

Accessible at `sushiqueen.galt.com.mx`

- Landing page with restaurant branding
- Interactive menu with categories, prices, images
- Online ordering with cart and checkout
- Weekly promotions
- Mobile-first responsive design
- WhatsApp ordering integration
- AI-powered chatbot

## MealLi POS Admin

Accessible at `sushiqueen.galt.com.mx/admin`

MealLi (Meal + Li) is the internal POS engine that replaced the Fudo POS dependency. All restaurant operations are managed from this panel.

### Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/admin` | KPIs: sales today/week/month, orders, customers, low stock alerts |
| Point of Sale | `/admin/pos` | Counter sales interface with quick product selection, cart, payment |
| Kitchen Display | `/admin/kitchen` | Real-time order queue for kitchen staff, item-level preparation tracking, timers |
| Cash Register | `/admin/cash-register` | Open/close register, movements, reconciliation, payment breakdown |
| Orders | `/admin/orders` | Order management with status transitions, filters, detail view |
| Menu Manager | `/admin/menu` | CRUD for menu items, categories, modifiers, availability toggle |
| Inventory | `/admin/inventory` | Ingredient management, stock levels, movements (purchase, waste, count) |
| Recipes | `/admin/recipes` | Link menu items to ingredients, auto cost calculation, margin analysis |
| Tables | `/admin/tables` | Table map with status (free/occupied/reserved/billing), zone management |
| Suppliers | `/admin/suppliers` | Supplier directory with contact info |
| Customers | `/admin/customers` | CRM with tiers (new/regular/gold/vip), order history, AI profiles |
| Promotions | `/admin/promotions` | Discount management (percentage/fixed/bogo), codes, usage tracking |
| Insights | `/admin/insights` | Visits, conversions, revenue by source, customer acquisition |
| Reports | `/admin/reports` | Sales reports by period, top products, revenue by channel, CSV export |

### Key POS Features

- Sequential order numbering per day (#001, #002...)
- Automatic inventory deduction on sale (via recipes)
- Payments auto-registered in open cash register
- Kitchen display with 10-second polling and audio alerts
- Table assignment from POS interface
- WhatsApp notifications on order status changes
- AI-powered customer recommendations (Gemini)

### Login

Admin credentials are configured via the database seeder (`php artisan db:seed`) or environment variables. Do not commit credentials to the repository.

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/menu` | Full menu |
| GET | `/api/menu/:category` | Menu by category |
| GET | `/api/promotions` | Active promotions |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id/status` | Order status |
| GET | `/api/health` | Health check |

### Admin (JWT required)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/admin/dashboard` | Dashboard KPIs + low stock alerts |
| CRUD | `/api/admin/menu` | Menu management |
| CRUD | `/api/admin/promotions` | Promotions management |
| GET/PATCH | `/api/admin/orders` | Order management |
| POST | `/api/admin/orders/:id/pay` | Register payment |
| GET | `/api/admin/orders/kitchen` | Kitchen display orders |
| PATCH | `/api/admin/orders/:id/items/:idx/prepared` | Mark item prepared |
| GET/PUT | `/api/admin/customers` | Customer CRM |
| GET/POST | `/api/admin/cash-register/*` | Cash register operations |
| CRUD | `/api/admin/ingredients` | Ingredient management |
| POST | `/api/admin/inventory/movement` | Stock movements |
| CRUD | `/api/admin/recipes` | Recipe management |
| GET | `/api/admin/recipes/:id/cost` | Cost breakdown |
| CRUD | `/api/admin/suppliers` | Supplier management |
| CRUD | `/api/admin/tables` | Table management |
| GET | `/api/admin/insights` | Analytics |

### Webhooks
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET/POST | `/webhooks/whatsapp` | WhatsApp Business messages |

## Project Structure

```
sushi-queen/
├── frontend/                    # React SPA
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx         # Landing page
│       │   ├── Menu.tsx         # Public menu
│       │   ├── Order.tsx        # Checkout
│       │   └── admin/           # MealLi POS
│       │       ├── Dashboard.tsx
│       │       ├── POS.tsx
│       │       ├── Kitchen.tsx
│       │       ├── CashRegister.tsx
│       │       ├── Orders.tsx
│       │       ├── MenuManager.tsx
│       │       ├── Inventory.tsx
│       │       ├── Recipes.tsx
│       │       ├── Tables.tsx
│       │       ├── Suppliers.tsx
│       │       ├── Customers.tsx
│       │       ├── Promotions.tsx
│       │       ├── Insights.tsx
│       │       └── Reports.tsx
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       └── types/
├── backend/                     # Laravel API
│   └── app/
│       ├── Http/Controllers/
│       │   ├── OrderController.php
│       │   ├── CashRegisterController.php
│       │   ├── InventoryController.php
│       │   ├── RecipeController.php
│       │   ├── TableController.php
│       │   ├── SupplierController.php
│       │   └── ...
│       ├── Models/
│       │   ├── Order.php
│       │   ├── CashRegister.php
│       │   ├── Ingredient.php
│       │   ├── Recipe.php
│       │   ├── Table.php
│       │   ├── Supplier.php
│       │   └── ...
│       └── Services/
│           ├── POSService.php
│           ├── InventoryService.php
│           ├── WhatsAppService.php
│           └── AIService.php
├── monitoring/                  # Prometheus + Grafana
├── deploy/                      # Deployment scripts
└── .kiro/specs/mealli-pos/      # MealLi POS specifications
```

## Deployment

### Frontend (Hostinger)
- Git deploy from branch `deploy-sushiqueen`
- Auto-deploy via GitHub webhook
- Static files served with `.htaccess` SPA routing

### Backend (Render.com)
- Auto-deploy from `main` branch
- PHP 8.2 + MongoDB extension
- Environment variables for all credentials

### Database (MongoDB Atlas)
- Cloud-hosted MongoDB cluster
- Database: `sushi_queen`

## Integrations

| Service | Purpose |
|---------|---------|
| WhatsApp Business | Interactive menu, order flow, status notifications, AI chatbot |
| Google Gemini | Personalized recommendations, preference analysis, automated responses |
| Facebook Pixel | Conversion tracking, ad campaigns |
| Google Analytics | Traffic analytics, GTM |
| Cloudflare | CDN, SSL, WAF, analytics |
| Prometheus + Grafana | Backend metrics and dashboards |

## Author

Jair Garcia - [@hackerjj](https://github.com/hackerjj)

License: Proprietary - All rights reserved 2026

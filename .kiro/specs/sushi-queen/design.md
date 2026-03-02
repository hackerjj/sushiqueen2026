# Sushi Queen - Diseño Técnico

## Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN                         │
│              (DNS, SSL, Analytics, WAF)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   HOSTINGER VPS                           │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  React Frontend  │  │     Laravel API Backend      │  │
│  │  (Nginx static)  │  │     (PHP-FPM + Nginx)       │  │
│  │                  │  │                              │  │
│  │  - Public Site   │  │  - REST API                  │  │
│  │  - Admin Panel   │  │  - Fudo Integration          │  │
│  │  - Order System  │  │  - WhatsApp Webhook          │  │
│  └─────────────────┘  │  - AI Service                 │  │
│                        │  - Prometheus metrics         │  │
│                        └──────────────────────────────┘  │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │    MongoDB       │  │         Redis                │  │
│  │  (Data Store)    │  │   (Cache + Sessions)         │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │   Prometheus     │  │        Grafana               │  │
│  │  (Metrics)       │  │   (Dashboards)               │  │
│  └─────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   Fudo POS API  │    │ WhatsApp Business │
│   (fu.do)       │    │      API          │
└─────────────────┘    └──────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│  Facebook Pixel │    │  Google Analytics │
│  / Meta API     │    │  / GTM           │
└─────────────────┘    └──────────────────┘
```

## Estructura del Proyecto

```
sushi-queen/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── terraform/                    # IaC para AWS migration
│   ├── main.tf
│   └── variables.tf
├── frontend/                     # React App
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── public/
│   │   ├── images/              # Logo, branding
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── Layout.tsx
│       │   ├── menu/
│       │   │   ├── MenuCard.tsx
│       │   │   ├── MenuGrid.tsx
│       │   │   └── CategoryFilter.tsx
│       │   ├── cart/
│       │   │   ├── Cart.tsx
│       │   │   ├── CartItem.tsx
│       │   │   └── CartSummary.tsx
│       │   ├── order/
│       │   │   ├── OrderForm.tsx
│       │   │   ├── OrderConfirmation.tsx
│       │   │   └── OrderTracking.tsx
│       │   ├── promo/
│       │   │   └── PromoSection.tsx
│       │   └── ui/
│       │       ├── Button.tsx
│       │       ├── Modal.tsx
│       │       └── Loading.tsx
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Menu.tsx
│       │   ├── Order.tsx
│       │   ├── Promotions.tsx
│       │   └── admin/
│       │       ├── Dashboard.tsx
│       │       ├── MenuManager.tsx
│       │       ├── Orders.tsx
│       │       ├── Customers.tsx
│       │       ├── Promotions.tsx
│       │       ├── Insights.tsx
│       │       └── Login.tsx
│       ├── hooks/
│       │   ├── useCart.ts
│       │   ├── useMenu.ts
│       │   ├── useOrders.ts
│       │   └── useAuth.ts
│       ├── services/
│       │   ├── api.ts
│       │   └── analytics.ts
│       ├── store/
│       │   ├── cartStore.ts
│       │   └── authStore.ts
│       └── types/
│           └── index.ts
├── backend/                      # Laravel API
│   ├── Dockerfile
│   ├── composer.json
│   ├── .env.example
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── MenuController.php
│   │   │   │   ├── OrderController.php
│   │   │   │   ├── CustomerController.php
│   │   │   │   ├── PromotionController.php
│   │   │   │   ├── WebhookController.php
│   │   │   │   ├── AuthController.php
│   │   │   │   └── InsightsController.php
│   │   │   └── Middleware/
│   │   │       ├── JwtAuth.php
│   │   │       └── RateLimiter.php
│   │   ├── Models/
│   │   │   ├── MenuItem.php
│   │   │   ├── Order.php
│   │   │   ├── Customer.php
│   │   │   └── Promotion.php
│   │   └── Services/
│   │       ├── FudoService.php
│   │       ├── WhatsAppService.php
│   │       ├── AIService.php
│   │       └── AnalyticsService.php
│   ├── routes/
│   │   ├── api.php
│   │   └── webhooks.php
│   └── config/
│       ├── fudo.php
│       ├── whatsapp.php
│       └── ai.php
└── monitoring/
    ├── prometheus/
    │   └── prometheus.yml
    └── grafana/
        └── dashboards/
            └── sushi-queen.json
```

## Modelos de Datos (MongoDB)

### MenuItem
```json
{
  "_id": "ObjectId",
  "fudo_id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "image_url": "string",
  "modifiers": [{ "name": "string", "price": "number" }],
  "available": "boolean",
  "sort_order": "number",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Order
```json
{
  "_id": "ObjectId",
  "fudo_order_id": "string",
  "customer_id": "ObjectId",
  "items": [{
    "menu_item_id": "ObjectId",
    "name": "string",
    "quantity": "number",
    "price": "number",
    "modifiers": ["string"]
  }],
  "subtotal": "number",
  "tax": "number",
  "total": "number",
  "status": "pending|confirmed|preparing|ready|delivered|cancelled",
  "source": "web|whatsapp|facebook",
  "notes": "string",
  "delivery_address": "string",
  "created_at": "datetime",
  "confirmed_at": "datetime"
}
```

### Customer
```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "source": "web|whatsapp|facebook",
  "tier": "new|regular|vip",
  "total_orders": "number",
  "total_spent": "number",
  "preferences": ["string"],
  "ai_profile": {
    "favorite_items": ["ObjectId"],
    "order_frequency": "string",
    "avg_order_value": "number",
    "last_recommendations": ["ObjectId"]
  },
  "facebook_id": "string",
  "whatsapp_id": "string",
  "created_at": "datetime",
  "last_order_at": "datetime"
}
```

### Promotion
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "discount_type": "percentage|fixed|bogo",
  "discount_value": "number",
  "applicable_items": ["ObjectId"],
  "image_url": "string",
  "starts_at": "datetime",
  "expires_at": "datetime",
  "active": "boolean",
  "code": "string",
  "usage_count": "number",
  "max_usage": "number"
}
```

## API Endpoints

### Público
- `GET /api/menu` - Listar menú completo
- `GET /api/menu/:category` - Menú por categoría
- `GET /api/promotions` - Promociones activas
- `POST /api/orders` - Crear orden
- `GET /api/orders/:id/status` - Estado de orden

### Admin (JWT required)
- `POST /api/auth/login` - Login admin
- `GET /api/admin/dashboard` - KPIs dashboard
- `CRUD /api/admin/menu` - Gestión menú
- `CRUD /api/admin/promotions` - Gestión promociones
- `GET /api/admin/orders` - Listar órdenes
- `PATCH /api/admin/orders/:id` - Actualizar orden
- `GET /api/admin/customers` - Listar clientes
- `GET /api/admin/customers/:id` - Detalle cliente
- `GET /api/admin/insights` - Analytics/Insights
- `GET /api/admin/leads` - Leads por plataforma

### Webhooks
- `POST /webhooks/fudo/order-confirmed` - Fudo order confirmation
- `POST /webhooks/whatsapp` - WhatsApp incoming messages

### Integraciones
- `POST /api/fudo/sync-menu` - Sincronizar menú desde Fudo
- `POST /api/whatsapp/send` - Enviar mensaje WhatsApp
- `POST /api/ai/recommend/:customer_id` - Obtener recomendaciones AI

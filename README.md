# 🍣 Sushi Queen - Plataforma Digital para Restaurante

Plataforma web completa para restaurante de sushi con sistema de pedidos online, panel de administración, integraciones con POS (Fudo), WhatsApp Business, AI para personalización y marketing digital.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Funcionalidades](#funcionalidades)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Despliegue](#instalación-y-despliegue)
- [API Endpoints](#api-endpoints)
- [Integraciones](#integraciones)
- [Monitoreo](#monitoreo)
- [Licencia](#licencia)

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────┐
│               CLOUDFLARE CDN                      │
│          (DNS, SSL, Analytics, WAF)               │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│  ┌──────────────┐    ┌─────────────────────────┐ │
│  │ React + Vite │    │   Laravel API (PHP 8.2) │ │
│  │  (Frontend)  │    │      (Backend)          │ │
│  │              │    │                         │ │
│  │ - Sitio Web  │    │ - REST API              │ │
│  │ - Admin      │    │ - Fudo POS Integration  │ │
│  │ - Pedidos    │    │ - WhatsApp Webhooks     │ │
│  └──────────────┘    │ - AI Service (Gemini)   │ │
│                      │ - Prometheus Metrics     │ │
│                      └─────────────────────────┘ │
│  ┌──────────────┐    ┌─────────────────────────┐ │
│  │   MongoDB    │    │        Redis            │ │
│  │  (Database)  │    │   (Cache + Sessions)    │ │
│  └──────────────┘    └─────────────────────────┘ │
│  ┌──────────────┐    ┌─────────────────────────┐ │
│  │  Prometheus  │    │       Grafana           │ │
│  │  (Métricas)  │    │    (Dashboards)         │ │
│  └──────────────┘    └─────────────────────────┘ │
└──────────────────────────────────────────────────┘
        │                       │
        ▼                       ▼
  ┌───────────┐         ┌──────────────┐
  │ Fudo POS  │         │  WhatsApp    │
  │   API     │         │  Business    │
  └───────────┘         └──────────────┘
```

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand |
| Backend | PHP 8.2, Laravel 11, JWT Auth |
| Base de Datos | MongoDB 7 |
| Cache | Redis 7 |
| POS | Fudo API (OAuth2) |
| Mensajería | WhatsApp Business API |
| AI | Google AI Studio (Gemini 2.0 Flash) |
| Monitoreo | Prometheus + Grafana |
| CDN/Security | Cloudflare |
| CI/CD | GitHub Actions |
| IaC | Terraform (AWS ready) |
| Contenedores | Docker + Docker Compose |

## ✨ Funcionalidades

### Sitio Web Público
- Landing page profesional con branding
- Menú interactivo con categorías, precios e imágenes
- Sistema de pedidos online con carrito de compras
- Promociones semanales activas
- Responsive design (mobile-first)
- SEO optimizado

### Sistema de Pedidos
- Carrito con modificadores (extras, sin ingrediente)
- Checkout con datos del cliente
- Integración directa con Fudo POS
- Confirmación en tiempo real via webhook
- Historial de pedidos por cliente
- Pedidos desde WhatsApp

### Panel de Administración
- Dashboard con KPIs (ventas día/semana/mes)
- Gestión de menú (CRUD productos)
- Gestión de promociones con expiración
- CRM de clientes (nuevo, recurrente, VIP)
- Insights de la página (visitas, conversiones)
- Gestión de órdenes en tiempo real

### Integraciones
- **Fudo POS**: Sincronización de menú, envío de órdenes, webhooks
- **WhatsApp Business**: Menú interactivo, pedidos, notificaciones, chatbot
- **AI (Gemini)**: Recomendaciones personalizadas, análisis predictivo
- **Marketing**: Facebook Pixel, Google Analytics, GTM
- **Cloudflare**: Analytics, WAF, SSL

## 📁 Estructura del Proyecto

```
sushi-queen/
├── frontend/              # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas (Home, Menu, Order, Admin)
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API client + analytics
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── public/images/     # Imágenes del restaurante
├── backend/               # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/  # API Controllers
│   │   ├── Models/            # MongoDB Models
│   │   └── Services/          # Business Logic
│   ├── routes/api.php     # API Routes
│   └── config/            # App configuration
├── monitoring/            # Prometheus + Grafana
├── nginx/                 # Nginx configs
├── terraform/             # AWS IaC
├── deploy/                # Deployment scripts
├── docker-compose.yml     # Development
├── docker-compose.prod.yml # Production
├── render.yaml            # Render.com deployment
└── .github/workflows/     # CI/CD
```

## 🚀 Instalación y Despliegue

### Opción 1: Render.com (Recomendado - Sin Docker local)

1. Fork o conecta el repo en [Render.com](https://render.com)
2. Crear nuevo Blueprint → seleccionar repo
3. Render lee `render.yaml` y despliega automáticamente
4. Configurar variables de entorno (MongoDB Atlas, Redis)

Ver [DEPLOY_RENDER.md](DEPLOY_RENDER.md) para guía completa.

### Opción 2: Docker Compose (Local)

```bash
# Clonar repositorio
git clone https://github.com/hackerjj/sushiqueen2026.git
cd sushiqueen2026

# Configurar variables de entorno
cp backend/.env.example backend/.env

# Levantar servicios
docker-compose up -d

# Instalar dependencias
docker exec -it sushi-queen-php composer install
docker exec -it sushi-queen-php php artisan key:generate
docker exec -it sushi-queen-php php artisan jwt:secret

# Seed de datos iniciales
docker exec -it sushi-queen-php php artisan migrate --seed
```

Servicios disponibles:
| Servicio | URL |
|---------|-----|
| Frontend | http://localhost |
| API Backend | http://localhost/api |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

### Opción 3: Serverless (AWS Lambda)

Ver [DEPLOY_SERVERLESS.md](DEPLOY_SERVERLESS.md) para guía con AWS Lambda + Vercel.

## 📡 API Endpoints

### Públicos
| Método | Endpoint | Descripción |
|--------|---------|-------------|
| GET | `/api/menu` | Listar menú completo |
| GET | `/api/menu/:category` | Menú por categoría |
| GET | `/api/promotions` | Promociones activas |
| POST | `/api/orders` | Crear orden |
| GET | `/api/orders/:id/status` | Estado de orden |
| GET | `/api/health` | Health check |

### Admin (JWT requerido)
| Método | Endpoint | Descripción |
|--------|---------|-------------|
| POST | `/api/auth/login` | Login admin |
| GET | `/api/admin/dashboard` | KPIs dashboard |
| CRUD | `/api/admin/menu` | Gestión menú |
| CRUD | `/api/admin/promotions` | Gestión promociones |
| GET | `/api/admin/orders` | Listar órdenes |
| PATCH | `/api/admin/orders/:id` | Actualizar orden |
| GET | `/api/admin/customers` | Listar clientes |
| GET | `/api/admin/insights` | Analytics |

### Webhooks
| Método | Endpoint | Descripción |
|--------|---------|-------------|
| POST | `/webhooks/fudo/order-confirmed` | Confirmación Fudo |
| POST | `/webhooks/whatsapp` | Mensajes WhatsApp |

## 🔗 Integraciones

### Fudo POS
- OAuth2 authentication
- Sincronización automática de menú
- Envío de órdenes al POS
- Webhook ORDER-CONFIRMED

### WhatsApp Business
- Menú interactivo por chat
- Flujo de pedidos completo
- Notificaciones de estado
- Chatbot con AI

### Google AI (Gemini 2.0 Flash)
- Recomendaciones personalizadas
- Análisis de preferencias
- Automatización de respuestas
- Análisis predictivo de demanda

## 📊 Monitoreo

- **Prometheus**: Métricas del backend (órdenes/min, latencia, errores)
- **Grafana**: Dashboard visual con KPIs en tiempo real
- **Cloudflare**: Analytics de tráfico y seguridad
- **Exporters**: MongoDB, Redis, Nginx

## 🔒 Seguridad

- HTTPS obligatorio (Cloudflare SSL)
- JWT para autenticación admin
- Rate limiting en API
- CORS configurado
- Variables de entorno para credenciales
- WAF de Cloudflare

## 👤 Autor

**Jair Garcia** - Director del proyecto
- GitHub: [@hackerjj](https://github.com/hackerjj)

## 📄 Licencia

Proyecto propietario - Todos los derechos reservados © 2026 Sushi Queen

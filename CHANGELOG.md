# Changelog - Sushi Queen

Todos los cambios notables del proyecto serán documentados en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.2.0] - 2026-03-02

### Agregado
- Configuración de despliegue en Render.com (`render.yaml`)
- Dockerfile optimizado para Render (`Dockerfile.render`)
- Configuración de despliegue serverless (`serverless.yml`)
- Configuración para Vercel (`vercel.json`)
- Configuración para AWS Amplify (`amplify.yml`)
- Guía de despliegue en Render (`DEPLOY_RENDER.md`)
- Guía de despliegue serverless (`DEPLOY_SERVERLESS.md`)
- README.md completo del proyecto

### Cambiado
- Backend adaptado para funcionar sin Docker local (php artisan serve)
- Soporte para MongoDB Atlas y Upstash Redis como alternativas cloud

---

## [1.1.0] - 2026-03-02

### Agregado
- Push inicial a GitHub (hackerjj/sushiqueen2026)
- Configuración de Git y repositorio remoto

---

## [1.0.0] - 2026-03-02

### Agregado - Fase 1: Fundación
- Estructura base del proyecto (monorepo frontend + backend)
- Docker Compose con MongoDB 7, Redis 7, PHP-FPM, Nginx, Node
- Docker Compose de producción optimizado
- Variables de entorno configuradas (.env.example)

### Agregado - Fase 2: Backend Core
- Laravel 11 con MongoDB driver (jenssegers/mongodb)
- Modelos: MenuItem, Order, Customer, Promotion, User
- AuthController con JWT (login admin)
- MenuController (CRUD + endpoints públicos)
- OrderController (crear, listar, actualizar estado)
- CustomerController (CRUD + CRM básico)
- PromotionController (CRUD + expiración automática)
- Middleware JWT y Rate Limiting
- Rutas API públicas y admin protegidas

### Agregado - Fase 3: Integración Fudo POS
- FudoService con autenticación OAuth2
- Sincronización de menú desde Fudo
- Envío de órdenes al POS
- WebhookController para ORDER-CONFIRMED

### Agregado - Fase 4: Frontend Público
- React 18 + TypeScript + Vite + TailwindCSS
- Layout base (Header, Footer, navegación)
- Página Home (hero, destacados, promos, CTA)
- Página Menú (grid de productos, filtros por categoría)
- Componentes MenuCard, MenuGrid, CategoryFilter
- Sistema de carrito con Zustand
- Componentes Cart, CartItem, CartSummary
- Página Checkout/Order con formulario
- Página de confirmación con tracking
- Página de Promociones activas
- Responsive design mobile-first
- React Router con lazy loading

### Agregado - Fase 5: Panel de Administración
- Login admin con JWT
- Dashboard con KPIs (ventas, órdenes, clientes)
- MenuManager (CRUD productos)
- Gestión de Órdenes en tiempo real
- Gestión de Clientes/CRM (lista, detalle, historial)
- Gestión de Promociones (crear, editar, expiración)
- Página de Insights (visitas, conversiones, fuentes)
- Gestión de Leads por plataforma

### Agregado - Fase 6: WhatsApp Business
- WhatsAppService en backend
- Webhook para mensajes entrantes
- Menú interactivo por WhatsApp
- Flujo de pedidos via WhatsApp
- Notificaciones de estado de orden
- Registro automático de clientes

### Agregado - Fase 7: AI y Automatización
- AIService con Google AI Studio (Gemini 2.0 Flash)
- Recomendaciones basadas en historial de cliente
- Automatización de respuestas en WhatsApp con AI
- Análisis de preferencias y patrones de compra
- Endpoint de recomendaciones personalizadas

### Agregado - Fase 8: Marketing Digital
- Facebook Pixel integrado
- Google Analytics / GTM
- Tracking de conversiones (orden completada)
- Estructura para Facebook Ads campaigns
- Estructura para Google Ads campaigns
- AnalyticsService en backend
- Landing page para campañas

### Agregado - Fase 9: Monitoreo
- Prometheus para métricas del backend
- Grafana con dashboard de Sushi Queen
- Métricas: órdenes/min, tiempo respuesta API, errores
- Cloudflare Analytics integrado
- Exporters: MongoDB, Redis, Nginx

### Agregado - Fase 10: DevOps
- Dockerfiles optimizados para producción
- Configuración Nginx producción (SSL, gzip, cache)
- Scripts de deployment para Hostinger
- Terraform básico para migración AWS
- GitHub Actions CI/CD
- Tests: API endpoints + componentes React críticos

---

## Roadmap

### [1.3.0] - Próximamente
- [ ] Despliegue completo en Render.com
- [ ] Configuración MongoDB Atlas (producción)
- [ ] Configuración Upstash Redis (producción)
- [ ] Dominio personalizado
- [ ] SSL en producción

### [2.0.0] - Futuro
- [ ] Migración a AWS (ECS/Lambda)
- [ ] Sistema de pagos online
- [ ] App móvil (React Native)
- [ ] Sistema de reservas
- [ ] Programa de lealtad/puntos

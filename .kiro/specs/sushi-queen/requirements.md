# Sushi Queen - Requisitos del Proyecto

## Visión General
Plataforma web completa para restaurante de sushi "Sushi Queen" con sistema de pedidos online, panel de administración, integraciones con POS (Fudo), WhatsApp Business, AI para personalización, y marketing digital (Facebook/Google). Preparada para migración a AWS.

## Requisitos Funcionales

### RF-1: Sitio Web Público (React)
- Landing page profesional con branding Sushi Queen (logo e imágenes existentes)
- Menú interactivo con categorías, precios, imágenes y descripciones
- Sistema de pedidos online con carrito de compras
- Página de promociones semanales activas
- Responsive design (mobile-first)
- SEO optimizado
- Integración con Cloudflare Analytics

### RF-2: Sistema de Pedidos
- Carrito de compras con modificadores (extras, sin ingrediente, etc.)
- Checkout con datos del cliente (nombre, teléfono, dirección)
- Integración directa con Fudo POS para enviar órdenes
- Confirmación de orden en tiempo real via webhook (ORDER-CONFIRMED)
- Historial de pedidos por cliente
- Pedidos desde WhatsApp integrados al mismo flujo

### RF-3: Integración Fudo POS
- Autenticación OAuth2 con Client ID/Secret proporcionados
- Sincronización de menú/productos desde Fudo
- Envío de órdenes al POS
- Recepción de webhooks (ORDER-CONFIRMED)
- Impresión de control de mesa al confirmar
- Sonido activado en nuevas órdenes

### RF-4: Panel de Administración
- Dashboard con KPIs: ventas del día, semana, mes
- Gestión de menú (CRUD productos, categorías, precios)
- Gestión de promociones semanales con fecha de expiración
- Gestión de clientes (CRM básico):
  - Nombre, teléfono, email, dirección
  - Canal de origen (Facebook, WhatsApp, Web)
  - Historial de pedidos
  - Clasificación de cliente (nuevo, recurrente, VIP)
- Leads y contactos desde todas las plataformas
- Insights de la página (visitas, conversiones, pedidos)
- Integración Cloudflare para métricas de rendimiento
- Gestión de órdenes en tiempo real

### RF-5: Integración WhatsApp Business
- Menú interactivo por WhatsApp
- Recepción de pedidos via WhatsApp
- Notificaciones de estado de orden
- Chatbot básico para preguntas frecuentes
- Registro automático de clientes desde WhatsApp

### RF-6: AI/Automatización
- API de AI para aprender preferencias de clientes
- Recomendaciones personalizadas basadas en historial
- Automatización de respuestas en WhatsApp
- Análisis predictivo de demanda (básico)
- Sugerencias de upselling inteligentes

### RF-7: Marketing Digital
- Pixel de Facebook integrado
- Google Analytics / Google Tag Manager
- Preparado para campañas de Facebook Ads
- Preparado para Google Ads
- Landing pages para campañas específicas
- Tracking de conversiones end-to-end

## Requisitos No Funcionales

### RNF-1: Stack Tecnológico
- Frontend: React 18+ con TypeScript, Vite, TailwindCSS
- Backend: PHP 8.2+ (Laravel) con API REST
- Base de datos: MongoDB
- Monitoreo: Prometheus + Grafana
- Cache: Redis
- Hosting inicial: Hostinger
- CDN/Security: Cloudflare
- Repositorio: GitHub (hackerjj)

### RNF-2: Preparación para AWS Migration
- Arquitectura containerizada (Docker)
- Variables de entorno para configuración
- Stateless backend (sessions en Redis/MongoDB)
- Assets estáticos separados (preparado para S3)
- Base de datos preparada para DocumentDB/Atlas
- Compatible con AWS Migration tools
- Infrastructure as Code (Terraform básico)

### RNF-3: Seguridad
- HTTPS obligatorio
- Autenticación JWT para admin
- Rate limiting en API
- Sanitización de inputs
- CORS configurado
- Credenciales en variables de entorno (nunca en código)

### RNF-4: Performance
- Lighthouse score > 90
- Lazy loading de imágenes
- Code splitting en React
- Caché de API responses
- Compresión gzip/brotli

## Datos de Integración Fudo
- Nombre director: Jair Garcia
- Fecha creación: 03/03/24
- Client ID: MDAwMDI6MDYzOTU2
- Client Secret: xH6rdcTALbNBv3qBoAUyhYFz
- Sonido: Activado
- Imprimir control mesa: Sí
- Webhook: ORDER-CONFIRMED
- URL Admin: https://app-v2.fu.do/app/#!/admin/external_apps/2

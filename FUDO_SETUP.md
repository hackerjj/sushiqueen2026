# Configuración de Fudo POS - Guía Paso a Paso

## 📋 Información Actual

**Credenciales OAuth2 (ya configuradas en .env):**
- Client ID: `MDAwMDI6MDYzOTU2`
- Client Secret: `xH6rdcTALbNBv3qBoAUyhYFz`
- API URL: `https://api.fu.do`

**Panel de Administración:**
- URL: https://app-v2.fu.do/app/#!/admin/external_apps/2
- App: `directorders`
- Usuario: Jair Garcia

## 🔧 Configuración de Webhooks en Fudo

### Eventos Disponibles:
1. **ORDER-CONFIRMED** - Orden confirmada por el restaurante
2. **ORDER-REJECTED** - Orden rechazada
3. **ORDER-READY-TO-DELIVER** - Orden lista para entregar
4. **ORDER-DELIVERY-SENT** - Orden enviada a delivery
5. **ORDER-CLOSED** - Orden completada/cerrada

### URLs de Webhook por Evento:

#### Para Testing Local (usando ngrok):
```
ORDER-CONFIRMED:        https://tu-ngrok-url.ngrok.io/webhooks/fudo/order-confirmed
ORDER-REJECTED:         https://tu-ngrok-url.ngrok.io/webhooks/fudo/order-confirmed
ORDER-READY-TO-DELIVER: https://tu-ngrok-url.ngrok.io/webhooks/fudo/order-confirmed
ORDER-DELIVERY-SENT:    https://tu-ngrok-url.ngrok.io/webhooks/fudo/order-confirmed
ORDER-CLOSED:           https://tu-ngrok-url.ngrok.io/webhooks/fudo/order-confirmed
```

#### Para Producción (Hostinger):
```
ORDER-CONFIRMED:        https://sushiqueen.galt.com.mx/webhooks/fudo/order-confirmed
ORDER-REJECTED:         https://sushiqueen.galt.com.mx/webhooks/fudo/order-confirmed
ORDER-READY-TO-DELIVER: https://sushiqueen.galt.com.mx/webhooks/fudo/order-confirmed
ORDER-DELIVERY-SENT:    https://sushiqueen.galt.com.mx/webhooks/fudo/order-confirmed
ORDER-CLOSED:           https://sushiqueen.galt.com.mx/webhooks/fudo/order-confirmed
```

**Nota:** Todos los eventos usan la misma URL. El backend detecta automáticamente el tipo de evento.

## 🚀 Pasos para Testing Local

### 1. Instalar ngrok
```bash
# macOS
brew install ngrok

# O descargar de https://ngrok.com/download
```

### 2. Iniciar tu servidor local
```bash
# En el directorio del proyecto
docker-compose up -d
```

### 3. Exponer el backend con ngrok
```bash
# Exponer el puerto 8000 (Laravel)
ngrok http 8000
```

Ngrok te dará una URL como: `https://abc123.ngrok.io`

### 4. Configurar en Fudo

Ve a: https://app-v2.fu.do/app/#!/admin/external_apps/2

Para cada evento que quieras activar:

1. Selecciona el evento del dropdown (ej: ORDER-CONFIRMED)
2. En "URL notificación:" pega:
   ```
   https://abc123.ngrok.io/webhooks/fudo/order-confirmed
   ```
   (Reemplaza `abc123.ngrok.io` con tu URL de ngrok)
3. Click en el botón "+" para agregar
4. Repite para otros eventos si quieres (ORDER-REJECTED, etc.)
5. Click en "Guardar"

### 5. Probar la Integración

#### A. Sincronizar Menú desde Fudo
```bash
# Hacer una petición al endpoint de sync
curl -X POST http://localhost:8000/api/fudo/sync-menu \
  -H "Authorization: Bearer TU_JWT_TOKEN"
```

#### B. Crear una Orden de Prueba
```bash
# Crear orden desde tu frontend o con curl
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Test Customer",
      "phone": "1234567890",
      "email": "test@test.com"
    },
    "items": [
      {
        "menu_item_id": "MENU_ITEM_ID",
        "quantity": 2,
        "price": 100
      }
    ],
    "delivery_address": "Test Address 123"
  }'
```

#### C. Ver Logs del Webhook
```bash
# Ver logs de Laravel en tiempo real
docker-compose logs -f backend

# Buscar líneas que digan "WebhookController: Fudo webhook received"
```

## 🔍 Verificar que Funciona

### 1. Revisar logs de Laravel
```bash
docker-compose logs backend | grep "Fudo"
```

Deberías ver:
- `FudoService: Access token refreshed successfully`
- `FudoService: Order created in Fudo`
- `WebhookController: Fudo webhook received`

### 2. Revisar en MongoDB
```bash
# Conectar a MongoDB
docker-compose exec mongodb mongosh -u sushiqueen -p sushiqueen_secret

# Ver órdenes
use sushi_queen
db.orders.find().pretty()

# Verificar que el status cambió a "confirmed" después del webhook
```

### 3. Revisar en Fudo Panel
- Ve al panel de Fudo y busca la orden
- Debería aparecer con el external_id de tu sistema

## 🐛 Troubleshooting

### Error: "Unauthorized" en webhook
- Verifica que `FUDO_WEBHOOK_SECRET` esté vacío en `.env` (Fudo no parece usar secrets)
- O configura un secret si Fudo lo requiere

### Error: "Order not found"
- La orden debe existir en tu sistema primero
- Verifica que `fudo_order_id` se guardó correctamente al crear la orden

### Webhook no llega
- Verifica que ngrok esté corriendo
- Verifica que la URL en Fudo sea correcta
- Revisa los logs de ngrok: `http://localhost:4040` (interfaz web de ngrok)

### Error de autenticación OAuth2
- Verifica que las credenciales en `.env` sean correctas
- Revisa logs: `docker-compose logs backend | grep "OAuth"`

## 📝 Configuración en Producción

Cuando tengas tu dominio:

1. Actualiza las URLs en Fudo reemplazando ngrok por tu dominio
2. Asegúrate de que tu servidor tenga SSL (HTTPS)
3. Configura `FUDO_WEBHOOK_SECRET` si Fudo lo requiere
4. Verifica que el firewall permita conexiones desde Fudo

## 🎯 Endpoints Disponibles

### Públicos
- `POST /api/orders` - Crear orden (se envía automáticamente a Fudo)
- `GET /api/orders/:id/status` - Ver estado de orden

### Admin (requiere JWT)
- `POST /api/fudo/sync-menu` - Sincronizar menú desde Fudo
- `GET /api/admin/orders` - Ver todas las órdenes

### Webhooks
- `POST /webhooks/fudo/order-confirmed` - Recibe todos los eventos de Fudo

## 📊 Mapeo de Estados

| Evento Fudo | Estado en Sistema |
|-------------|-------------------|
| ORDER-CONFIRMED | confirmed |
| ORDER-REJECTED | cancelled |
| ORDER-READY-TO-DELIVER | ready |
| ORDER-DELIVERY-SENT | delivering |
| ORDER-CLOSED | delivered |

## ✅ Checklist de Configuración

- [ ] Credenciales OAuth2 en `.env`
- [ ] Docker containers corriendo
- [ ] ngrok instalado y corriendo
- [ ] URLs de webhook configuradas en Fudo
- [ ] Eventos activados en Fudo (mínimo ORDER-CONFIRMED)
- [ ] Sonido activado en Fudo
- [ ] Imprimir control de mesa activado
- [ ] Prueba de sincronización de menú exitosa
- [ ] Prueba de creación de orden exitosa
- [ ] Webhook recibido y procesado correctamente

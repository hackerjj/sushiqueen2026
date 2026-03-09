# Guía de Rotación de Credenciales y Secretos

Este documento describe el procedimiento paso a paso para rotar cada secreto y credencial utilizada por el sistema Sushi Queen / MealLi POS. Todos los secretos de producción se configuran como variables de entorno en el **dashboard de Render**.

> **Importante**: Después de rotar cualquier secreto, Render redesplegará automáticamente el servicio. Planifica las rotaciones en horarios de bajo tráfico.

---

## 1. Laravel APP_KEY

La `APP_KEY` se usa para cifrar cookies, sesiones y datos encriptados por Laravel.

### Pasos

1. Generar una nueva clave localmente:
   ```bash
   cd backend
   php artisan key:generate --show
   ```
   Esto imprime una clave con formato `base64:XXXXXXX...` sin modificar archivos.

2. Ir al **dashboard de Render** → servicio `sushi-queen-backend` → **Environment**.

3. Actualizar la variable `APP_KEY` con el nuevo valor generado.

4. Guardar cambios. Render redesplegará automáticamente.

### Efectos post-rotación

- Las cookies de sesión existentes se invalidan (los usuarios deberán iniciar sesión de nuevo).
- Cualquier dato cifrado con `encrypt()` / `Crypt::encrypt()` no podrá descifrarse con la nueva clave.

---

## 2. JWT_SECRET

El `JWT_SECRET` firma y verifica todos los tokens JWT de autenticación.

### Pasos

1. Generar un nuevo secreto localmente:
   ```bash
   cd backend
   php artisan jwt:secret --show
   ```
   Si el comando `--show` no está disponible, generar un string aleatorio de 64 caracteres:
   ```bash
   openssl rand -base64 64
   ```

2. Ir al **dashboard de Render** → servicio `sushi-queen-backend` → **Environment**.

3. Actualizar la variable `JWT_SECRET` con el nuevo valor.

4. Guardar cambios.

### Efectos post-rotación

- **Todos los tokens JWT activos se invalidan inmediatamente.** Todos los usuarios autenticados (admin) deberán iniciar sesión de nuevo.
- No se requiere ningún paso adicional en la base de datos.

---

## 3. Credenciales de MongoDB (MONGO_URI)

La variable `MONGO_URI` contiene la cadena de conexión a MongoDB Atlas con usuario y contraseña.

### Pasos

1. Ir a **MongoDB Atlas** → proyecto correspondiente → **Database Access**.

2. Seleccionar el usuario de base de datos actual y hacer clic en **Edit**.

3. Cambiar la contraseña por una nueva contraseña segura (mínimo 20 caracteres, alfanumérica + símbolos).

4. Copiar la nueva cadena de conexión completa. El formato es:
   ```
   mongodb+srv://<usuario>:<nueva_contraseña>@<cluster>.mongodb.net/sushi_queen?retryWrites=true&w=majority
   ```

5. Ir al **dashboard de Render** → servicio `sushi-queen-backend` → **Environment**.

6. Actualizar la variable `MONGO_URI` con la nueva cadena de conexión.

7. Guardar cambios.

### Efectos post-rotación

- La aplicación se reconectará automáticamente con las nuevas credenciales tras el redespliegue.
- Verificar que el endpoint `/api/health` retorne estado saludable después del despliegue.
- Si se usan herramientas externas (MongoDB Compass, scripts de backup), actualizar también sus credenciales.

---

## 4. Tokens de WhatsApp Business API

Se utilizan cuatro variables para la integración con WhatsApp Business.

### Pasos para rotar WHATSAPP_ACCESS_TOKEN

1. Ir a **Meta for Developers** → [business.facebook.com](https://business.facebook.com) → tu aplicación de WhatsApp Business.

2. Navegar a **WhatsApp** → **API Setup**.

3. Generar un nuevo **token de acceso temporal** o configurar un **token permanente** desde la sección de System Users en Business Settings.

4. Ir al **dashboard de Render** → servicio `sushi-queen-backend` → **Environment**.

5. Actualizar la variable `WHATSAPP_ACCESS_TOKEN` con el nuevo token.

6. Guardar cambios.

### Pasos para rotar WHATSAPP_VERIFY_TOKEN

1. Elegir un nuevo string aleatorio seguro:
   ```bash
   openssl rand -hex 32
   ```

2. Actualizar la variable `WHATSAPP_VERIFY_TOKEN` en el **dashboard de Render**.

3. Ir a **Meta for Developers** → tu app → **WhatsApp** → **Configuration** → **Webhook**.

4. Actualizar el **Verify Token** en la configuración del webhook con el mismo valor.

5. Guardar en ambos lados.

### Variables que normalmente no cambian

- `WHATSAPP_PHONE_NUMBER_ID`: Cambia solo si se migra a otro número de teléfono.
- `WHATSAPP_BUSINESS_ACCOUNT_ID`: Cambia solo si se migra a otra cuenta de negocio.

### Efectos post-rotación

- Los mensajes de WhatsApp en cola podrían fallar durante el redespliegue (se reintentarán automáticamente con la lógica de retry).
- Verificar enviando un mensaje de prueba después del despliegue.

---

## 5. Google Gemini AI API Key (GOOGLE_AI_API_KEY)

La clave de API de Google Gemini se usa para las funcionalidades de inteligencia artificial.

### Pasos

1. Ir a **Google AI Studio** → [aistudio.google.com](https://aistudio.google.com) o **Google Cloud Console** → **APIs & Services** → **Credentials**.

2. Revocar la clave actual (o eliminarla si se va a reemplazar completamente).

3. Crear una nueva API Key. Restringirla al API de Gemini si es posible.

4. Ir al **dashboard de Render** → servicio `sushi-queen-backend` → **Environment**.

5. Actualizar la variable `GOOGLE_AI_API_KEY` con la nueva clave.

6. Guardar cambios.

### Efectos post-rotación

- Las solicitudes a Gemini AI fallarán con la clave anterior inmediatamente después de revocarla.
- La lógica de retry manejará errores transitorios durante el redespliegue.
- Verificar que las funcionalidades de IA respondan correctamente después del despliegue.

---

## 6. Credenciales de Fudo API

Las credenciales de Fudo se configuran en `render.yaml` y se usan para la integración con el sistema Fudo POS.

### Variables involucradas

| Variable | Descripción |
|---|---|
| `FUDO_CLIENT_ID` | ID de cliente OAuth de Fudo |
| `FUDO_CLIENT_SECRET` | Secreto de cliente OAuth de Fudo |

### Pasos

1. Contactar al soporte de **Fudo** o acceder al panel de administración de Fudo para generar nuevas credenciales OAuth.

2. Ir al **dashboard de Render** → servicio `sushi-queen-backend` → **Environment**.

3. Actualizar las variables `FUDO_CLIENT_ID` y `FUDO_CLIENT_SECRET` con los nuevos valores.

4. Guardar cambios.

### Efectos post-rotación

- La sincronización con Fudo usará las nuevas credenciales tras el redespliegue.
- Verificar ejecutando una sincronización de prueba.

---

## 7. METRICS_TOKEN (Token de Prometheus)

El token protege el endpoint `/api/metrics` de acceso no autorizado.

### Pasos

1. Generar un nuevo token:
   ```bash
   openssl rand -hex 32
   ```

2. Ir al **dashboard de Render** → servicio `sushi-queen-backend` → **Environment**.

3. Actualizar la variable `METRICS_TOKEN` con el nuevo valor.

4. Actualizar la configuración de Prometheus (`monitoring/prometheus/prometheus.yml`) con el nuevo token en el header `Authorization: Bearer <nuevo_token>`.

5. Redesplegar tanto el backend como el servicio de Prometheus.

### Efectos post-rotación

- Prometheus dejará de poder hacer scraping hasta que se actualice su configuración con el nuevo token.
- Actualizar ambos servicios en la misma ventana de mantenimiento.

---

## Calendario de Rotación Recomendado

| Secreto | Frecuencia recomendada | Prioridad |
|---|---|---|
| JWT_SECRET | Cada 90 días | Alta |
| APP_KEY | Cada 6 meses | Media |
| MONGO_URI (contraseña) | Cada 90 días | Alta |
| WHATSAPP_ACCESS_TOKEN | Según expiración del token | Alta |
| GOOGLE_AI_API_KEY | Cada 6 meses | Media |
| FUDO_CLIENT_SECRET | Cada 6 meses | Media |
| METRICS_TOKEN | Cada 90 días | Baja |

---

## Checklist Post-Rotación

Después de rotar cualquier secreto:

- [ ] Verificar que el despliegue en Render fue exitoso
- [ ] Comprobar `/api/health` retorna estado saludable
- [ ] Revisar logs en busca de errores de autenticación o conexión
- [ ] Probar la funcionalidad afectada (login, WhatsApp, IA, métricas)
- [ ] Documentar la fecha de rotación para referencia futura

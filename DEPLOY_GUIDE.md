# Guía de Configuración para Producción — Sushi Queen / MealLi POS

Sigue estos pasos en orden. Cada paso indica exactamente dónde hacer clic y qué valor poner.

---

## PASO 1: Crear Redis en Render

1. Abre https://dashboard.render.com
2. Clic en **"New +"** (botón azul arriba a la derecha)
3. Selecciona **"Redis"**
4. Configura:
   - **Name**: `sushi-queen-redis`
   - **Region**: `Oregon` (mismo que el backend)
   - **Plan**: `Free` (o Starter si necesitas persistencia)
5. Clic en **"Create Redis"**
6. Espera a que se cree (1-2 minutos)
7. Una vez creado, ve a la sección **"Connect"**
8. Copia el valor de **"Internal Redis URL"** — se ve algo así:
   ```
   redis://red-xxxxx:6379
   ```
   O si tiene contraseña:
   ```
   redis://default:PASSWORD@red-xxxxx:6379
   ```
9. **Guarda este valor**, lo necesitas en el Paso 3

---

## PASO 2: Rotar contraseña de MongoDB Atlas

1. Abre https://cloud.mongodb.com
2. Ve a tu proyecto → clic en **"Database Access"** (menú izquierdo)
3. Busca tu usuario de base de datos (probablemente `jairalonsogarcias_db_user`)
4. Clic en **"Edit"** (ícono de lápiz)
5. En **"Password"**, clic en **"Edit Password"**
6. Clic en **"Autogenerate Secure Password"**
7. **COPIA LA CONTRASEÑA** antes de guardar (no la podrás ver después)
8. Clic en **"Update User"**
9. Ahora ve a **"Database"** → clic en **"Connect"** → **"Drivers"**
10. Copia la cadena de conexión. Se ve así:
    ```
    mongodb+srv://jairalonsogarcias_db_user:NUEVA_CONTRASEÑA@sushiqueen.34hq2xo.mongodb.net/sushi_queen?retryWrites=true&w=majority&appName=sushiqueen
    ```
11. Reemplaza `<password>` con la contraseña que copiaste en el paso 7
12. **Guarda esta URI completa**, la necesitas en el Paso 3

---

## PASO 3: Configurar variables de entorno en Render

1. Abre https://dashboard.render.com
2. Clic en tu servicio **"sushi-queen-backend"**
3. Ve a la pestaña **"Environment"** (menú izquierdo)
4. Configura estas variables (clic en "Add Environment Variable" para cada una):

### Variables que DEBES configurar:

| Variable | Valor | Notas |
|----------|-------|-------|
| `APP_KEY` | `base64:eQqHMwXhn6DPlp3nC2XJtXyHQL23ISfRQU6pFKmWIzQ=` | Ya generado arriba |
| `JWT_SECRET` | `NjO2k1DNp4nFFsluC9oHLi+7N9AK3OFf7DuWswPbraqiq+4SCiT1NXl82INyvrhahP3A+5S0oneKyqfyd9W19Q==` | Ya generado arriba |
| `MONGO_URI` | La URI que copiaste en el Paso 2 | Con la contraseña nueva |
| `REDIS_URL` | La URL que copiaste en el Paso 1 | La Internal Redis URL |
| `GOOGLE_AI_API_KEY` | Tu API key de Google AI Studio | La que ya tenías |
| `WHATSAPP_ACCESS_TOKEN` | Tu token de WhatsApp Business | El que ya tenías |
| `WHATSAPP_PHONE_NUMBER_ID` | Tu Phone Number ID | El que ya tenías |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Tu Business Account ID | El que ya tenías |
| `WHATSAPP_VERIFY_TOKEN` | Tu verify token | El que ya tenías |

### Variables que YA están configuradas (verificar que existan):

| Variable | Valor |
|----------|-------|
| `APP_NAME` | `Sushi Queen` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://sushi-queen-backend.onrender.com` |
| `JWT_TTL` | `60` |
| `PORT` | `10000` |
| `DB_CONNECTION` | `mongodb` |
| `MONGO_DATABASE` | `sushi_queen` |
| `CACHE_DRIVER` | `redis` |
| `LOG_CHANNEL` | `json` |
| `METRICS_TOKEN` | `3af8b91a2d24e92e3117707a6c10469020e6b4f572c6f5abb21b2d6a6fc1a5b4` |
| `CORS_ALLOWED_ORIGINS` | `https://sushiqueen.galt.com.mx,http://localhost:3000` |
| `GOOGLE_AI_MODEL` | `gemini-2.0-flash` |

5. Clic en **"Save Changes"**
6. Render va a redesplegar automáticamente

---

## PASO 4: Ejecutar migración de índices MongoDB

1. En Render, ve a tu servicio **"sushi-queen-backend"**
2. Clic en la pestaña **"Shell"** (menú izquierdo)
3. Espera a que se abra la terminal
4. Ejecuta:
   ```bash
   php artisan migrate
   ```
5. Deberías ver algo como:
   ```
   Migrating: 2026_03_07_000001_create_mongo_indexes
   Migrated: 2026_03_07_000001_create_mongo_indexes
   ```

---

## PASO 5: Verificar que el backend funciona

1. Abre en tu navegador:
   ```
   https://sushi-queen-backend.onrender.com/api/health
   ```
2. Deberías ver algo así:
   ```json
   {
     "status": "ok",
     "service": "MealLi POS API",
     "version": "1.0.0",
     "services": {
       "mongodb": "ok",
       "redis": "ok"
     }
   }
   ```
3. Si `mongodb` o `redis` dicen `error`, revisa las variables de entorno del Paso 3

---

## PASO 6: Desplegar el frontend en Hostinger

### Opción A: Push a branch de deploy (recomendado)

1. En tu terminal local, ejecuta:
   ```bash
   git checkout deploy-sushiqueen
   git merge main
   git push origin deploy-sushiqueen
   ```
2. Hostinger detectará el push y desplegará automáticamente

### Opción B: Subir archivos manualmente

1. Abre el File Manager de Hostinger (hPanel → Files → File Manager)
2. Navega a `public_html/` (o la carpeta donde está tu sitio)
3. Sube todo el contenido de la carpeta `frontend/dist/`:
   - `index.html`
   - Carpeta `assets/` completa
4. Asegúrate de que el archivo `.htaccess` existe con este contenido:
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

---

## PASO 7: Configurar backups en MongoDB Atlas

1. Abre https://cloud.mongodb.com
2. Ve a tu cluster → clic en **"Backup"** (menú izquierdo)
3. Si no está habilitado, clic en **"Enable Backup"**
4. Configura:
   - **Snapshot Frequency**: `Daily`
   - **Retention**: `7 days` (mínimo)
5. Clic en **"Save"**

---

## PASO 8: Verificación final

Abre cada una de estas URLs y verifica que funcionen:

1. **Sitio público**: https://sushiqueen.galt.com.mx
   - Debe cargar la landing page
   - Navegar a /menu debe mostrar el menú

2. **Admin login**: https://sushiqueen.galt.com.mx/admin/login
   - Debe mostrar el formulario de login
   - Iniciar sesión con las credenciales del seeder

3. **API health**: https://sushi-queen-backend.onrender.com/api/health
   - Debe mostrar status "ok" con MongoDB y Redis conectados

4. **Menú público API**: https://sushi-queen-backend.onrender.com/api/menu
   - Debe retornar el menú en JSON

5. **Ruta 404**: https://sushiqueen.galt.com.mx/pagina-que-no-existe
   - Debe mostrar la página 404 con "Página no encontrada"

---

## Resumen de credenciales generadas

> ⚠️ IMPORTANTE: Después de configurar todo, BORRA este archivo del repositorio.
> No commitees credenciales al repo.

| Secreto | Valor |
|---------|-------|
| APP_KEY | `base64:eQqHMwXhn6DPlp3nC2XJtXyHQL23ISfRQU6pFKmWIzQ=` |
| JWT_SECRET | `NjO2k1DNp4nFFsluC9oHLi+7N9AK3OFf7DuWswPbraqiq+4SCiT1NXl82INyvrhahP3A+5S0oneKyqfyd9W19Q==` |
| METRICS_TOKEN | `3af8b91a2d24e92e3117707a6c10469020e6b4f572c6f5abb21b2d6a6fc1a5b4` |
| MONGO_URI | (la que generaste en Paso 2) |
| REDIS_URL | (la que copiaste en Paso 1) |

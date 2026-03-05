# Deploy a Hostinger - Sushi Queen

## 📋 Información del Servidor

**Dominio:** `sushiqueen.galt.com.mx`

**FTP Access:**
- Host: `ftp://191.101.79.184`
- Username: `u716757676.galt.com.mx`
- Password: `4Irbus0001!`
- Port: `21`
- Directory: `public_html`

## ⚠️ IMPORTANTE - Arquitectura en Hostinger

Hostinger es hosting compartido, NO soporta Docker. Necesitamos adaptar el deploy:

### Opción 1: Deploy Tradicional (Recomendado para Hostinger)
- Frontend: Build estático de React → `public_html`
- Backend: Laravel en subdirectorio → `public_html/api`
- Base de datos: MySQL de Hostinger (no MongoDB directamente)

### Opción 2: Usar MongoDB Atlas (Recomendado)
- Frontend: En Hostinger
- Backend: En Hostinger con PHP
- MongoDB: MongoDB Atlas (cloud gratuito)
- Redis: No disponible en Hostinger básico

## 🚀 Pasos para Deploy

### 1. Preparar MongoDB Atlas (Gratis)

1. Ve a https://www.mongodb.com/cloud/atlas/register
2. Crea una cuenta gratuita
3. Crea un cluster (M0 Free tier)
4. Configura acceso:
   - Database Access: Crea usuario y password
   - Network Access: Agrega `0.0.0.0/0` (permitir todas las IPs)
5. Obtén la connection string:
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/sushi_queen
   ```

### 2. Build del Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar API URL para producción
# Editar .env o crear .env.production
echo "VITE_API_URL=https://sushiqueen.galt.com.mx/api" > .env.production

# Build
npm run build

# Esto genera la carpeta dist/
```

### 3. Preparar Backend para Hostinger

```bash
cd backend

# Instalar dependencias
composer install --no-dev --optimize-autoloader

# Generar APP_KEY si no existe
php artisan key:generate

# Crear .env de producción
cp .env.example .env.production
```

Editar `backend/.env.production`:
```env
APP_NAME="Sushi Queen"
APP_ENV=production
APP_KEY=base64:TU_APP_KEY_GENERADA
APP_DEBUG=false
APP_URL=https://sushiqueen.galt.com.mx

# MongoDB Atlas
DB_CONNECTION=mongodb
MONGO_DSN=mongodb+srv://usuario:password@cluster.mongodb.net/sushi_queen?retryWrites=true&w=majority

# Redis - Deshabilitado en Hostinger básico
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# JWT
JWT_SECRET=TU_JWT_SECRET_GENERADO
JWT_TTL=60

# CORS
CORS_ALLOWED_ORIGINS=https://sushiqueen.galt.com.mx

# Fudo POS
FUDO_CLIENT_ID=MDAwMDI6MDYzOTU2
FUDO_CLIENT_SECRET=xH6rdcTALbNBv3qBoAUyhYFz
FUDO_API_URL=https://api.fu.do
FUDO_AUTH_URL=https://api.fu.do/oauth/token
FUDO_WEBHOOK_SECRET=

# WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=

# Google AI Studio (Gemini)
GOOGLE_AI_API_KEY=
GOOGLE_AI_MODEL=gemini-2.0-flash
```

### 4. Estructura de Archivos en Hostinger

```
public_html/
├── index.html              # Frontend (React build)
├── assets/                 # CSS, JS del frontend
├── images/                 # Imágenes del frontend
├── api/                    # Backend Laravel
│   ├── public/
│   │   └── index.php       # Entry point de Laravel
│   ├── app/
│   ├── config/
│   ├── routes/
│   ├── vendor/
│   └── .env
└── .htaccess               # Rewrite rules
```

### 5. Crear .htaccess Principal

Crear `public_html/.htaccess`:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Redirigir HTTP a HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # API routes
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^api/(.*)$ api/public/index.php [L]
    
    # Webhooks
    RewriteCond %{REQUEST_URI} ^/webhooks/
    RewriteRule ^webhooks/(.*)$ api/public/index.php [L]
    
    # Frontend - servir index.html para todas las rutas
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>

# Seguridad
<Files .env>
    Order allow,deny
    Deny from all
</Files>

# Compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 6. Subir Archivos via FTP

Opción A: Usar FileZilla (GUI)
1. Descargar FileZilla: https://filezilla-project.org/
2. Conectar con las credenciales FTP
3. Subir archivos:
   - `frontend/dist/*` → `public_html/`
   - `backend/` → `public_html/api/`
   - `.htaccess` → `public_html/.htaccess`

Opción B: Usar lftp (CLI)
```bash
# Instalar lftp
brew install lftp

# Script de deploy
lftp -u u716757676.galt.com.mx,4Irbus0001! ftp://191.101.79.184 <<EOF
cd public_html
mirror -R frontend/dist/ ./
mkdir -p api
cd api
mirror -R backend/ ./
bye
EOF
```

### 7. Configurar Permisos

Vía FTP o SSH (si Hostinger lo permite):
```bash
# Storage y cache deben ser escribibles
chmod -R 775 api/storage
chmod -R 775 api/bootstrap/cache

# .env debe ser privado
chmod 600 api/.env
```

### 8. Inicializar Base de Datos

```bash
# Si Hostinger tiene SSH
ssh u716757676@sushiqueen.galt.com.mx

cd public_html/api
php artisan migrate
php artisan db:seed
```

Si NO hay SSH, crear un script temporal:
```php
// public_html/api/public/setup.php
<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->call('migrate');
$kernel->call('db:seed');
echo "Database initialized!";
// BORRAR ESTE ARCHIVO DESPUÉS
```

Visitar: `https://sushiqueen.galt.com.mx/api/setup.php`
Luego BORRAR el archivo.

### 9. Configurar Fudo Webhooks

En el panel de Fudo, configurar:

**URL para todos los eventos:**
```
https://sushiqueen.galt.com.mx/webhooks/fudo/order-confirmed
```

Eventos recomendados:
- ✅ ORDER-CONFIRMED
- ✅ ORDER-REJECTED
- ORDER-READY-TO-DELIVER
- ORDER-CLOSED

### 10. Verificar Deploy

1. **Frontend:** https://sushiqueen.galt.com.mx
2. **API Health:** https://sushiqueen.galt.com.mx/api/health
3. **Menú público:** https://sushiqueen.galt.com.mx/api/menu
4. **Webhook:** Crear orden de prueba y verificar logs

## 🔧 Script de Deploy Automatizado

Crear `deploy-hostinger.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying Sushi Queen to Hostinger..."

# 1. Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Prepare backend
echo "🔧 Preparing backend..."
cd backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
cd ..

# 3. Upload via FTP
echo "📤 Uploading files..."
lftp -u u716757676.galt.com.mx,4Irbus0001! ftp://191.101.79.184 <<EOF
cd public_html

# Upload frontend
mirror -R --delete frontend/dist/ ./

# Upload backend
mkdir -p api
cd api
mirror -R --delete backend/ ./

# Upload .htaccess
cd ..
put .htaccess

bye
EOF

echo "✅ Deploy completed!"
echo "🌐 Visit: https://sushiqueen.galt.com.mx"
```

Hacer ejecutable:
```bash
chmod +x deploy-hostinger.sh
```

Ejecutar:
```bash
./deploy-hostinger.sh
```

## 🐛 Troubleshooting

### Error 500 en API
- Verificar permisos de `storage/` y `bootstrap/cache/`
- Revisar logs: `api/storage/logs/laravel.log`
- Verificar que `.env` existe y tiene APP_KEY

### MongoDB no conecta
- Verificar connection string de Atlas
- Verificar que la IP está en whitelist (0.0.0.0/0)
- Verificar usuario y password

### Webhooks no llegan
- Verificar que la URL en Fudo es correcta
- Verificar que `.htaccess` tiene las reglas de rewrite
- Revisar logs de Laravel

### Frontend no carga
- Verificar que `index.html` está en `public_html/`
- Verificar `.htaccess` para SPA routing
- Verificar que `VITE_API_URL` apunta a la API correcta

## 📝 Checklist de Deploy

- [ ] MongoDB Atlas configurado
- [ ] Frontend build generado (`npm run build`)
- [ ] Backend dependencies instaladas (`composer install`)
- [ ] `.env` de producción configurado
- [ ] `.htaccess` creado
- [ ] Archivos subidos via FTP
- [ ] Permisos configurados (775 storage, 600 .env)
- [ ] Base de datos migrada y seeded
- [ ] Webhooks configurados en Fudo
- [ ] SSL/HTTPS funcionando
- [ ] Prueba de orden end-to-end

## 🔐 Seguridad Post-Deploy

1. Cambiar password FTP después del deploy
2. Configurar `FUDO_WEBHOOK_SECRET` si es posible
3. Limitar acceso a archivos sensibles en `.htaccess`
4. Habilitar firewall en Hostinger si está disponible
5. Configurar backups automáticos

## 📊 Monitoreo

Sin Docker/Prometheus en Hostinger, usar:
- Logs de Laravel: `api/storage/logs/laravel.log`
- Logs de Hostinger en el panel de control
- MongoDB Atlas monitoring dashboard
- Configurar alertas en Atlas para uso de DB

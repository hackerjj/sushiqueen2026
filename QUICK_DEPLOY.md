# 🚀 Deploy Rápido - Sushi Queen

## ✅ Configuración Completada

### MongoDB Atlas
- ✅ Cluster: `sushiqueen`
- ✅ Usuario: `jairalonsogarcias_db_user`
- ✅ Connection String configurado en `.env.hostinger`

### Fudo POS
- ✅ Client ID y Secret configurados
- ✅ Webhook URL: `https://sushiqueen.galt.com.mx/webhooks/fudo/order-confirmed`
- ✅ Eventos configurados: ORDER-CONFIRMED, ORDER-REJECTED

### Hostinger
- ✅ Dominio: `sushiqueen.galt.com.mx`
- ✅ FTP configurado

---

## 🎯 Pasos para Deploy

### 1. Instalar lftp (si no lo tienes)
```bash
brew install lftp
```

### 2. Ejecutar el script de deploy
```bash
./deploy-hostinger.sh
```

Este script automáticamente:
- Hace build del frontend
- Prepara el backend
- Sube todo via FTP a Hostinger

### 3. Configurar .env en el servidor

Después del deploy, necesitas copiar el archivo `.env` en el servidor:

**Via FTP (FileZilla o similar):**
1. Conectar a: `ftp://191.101.79.184`
2. Usuario: `u716757676.galt.com.mx`
3. Password: `4Irbus0001!`
4. Ir a: `public_html/api/`
5. Copiar `backend/.env.hostinger` → `public_html/api/.env`

**O via comando:**
```bash
lftp -u u716757676.galt.com.mx,4Irbus0001! ftp://191.101.79.184 <<EOF
cd public_html/api
put backend/.env.hostinger -o .env
bye
EOF
```

### 4. Configurar permisos (via FTP)

En FileZilla o tu cliente FTP:
- `public_html/api/storage/` → Permisos: 775 (recursivo)
- `public_html/api/bootstrap/cache/` → Permisos: 775 (recursivo)
- `public_html/api/.env` → Permisos: 600

### 5. Inicializar la base de datos

**Opción A: Si Hostinger tiene SSH**
```bash
ssh u716757676@sushiqueen.galt.com.mx
cd public_html/api
php artisan migrate
php artisan db:seed
```

**Opción B: Sin SSH (crear script temporal)**

Crear archivo `public_html/api/public/init-db.php`:
```php
<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "Running migrations...\n";
$kernel->call('migrate', ['--force' => true]);

echo "Running seeders...\n";
$kernel->call('db:seed', ['--force' => true]);

echo "✅ Database initialized!\n";
echo "⚠️  DELETE THIS FILE NOW!\n";
```

Luego visitar: `https://sushiqueen.galt.com.mx/api/init-db.php`

**⚠️ IMPORTANTE: Borrar el archivo después de usarlo**

### 6. Verificar que funciona

1. **Frontend:** https://sushiqueen.galt.com.mx
2. **API Health:** https://sushiqueen.galt.com.mx/api/health
3. **Menú:** https://sushiqueen.galt.com.mx/api/menu

---

## 🔧 Configuración Adicional

### Sincronizar Menú desde Fudo

```bash
curl -X POST https://sushiqueen.galt.com.mx/api/fudo/sync-menu \
  -H "Authorization: Bearer TU_JWT_TOKEN"
```

O desde el panel de admin una vez que hagas login.

### Probar Webhooks

1. Crear una orden de prueba desde el frontend
2. Confirmarla en el panel de Fudo
3. Verificar en los logs: `public_html/api/storage/logs/laravel.log`

---

## 📋 Checklist Final

- [ ] Script de deploy ejecutado
- [ ] `.env` copiado al servidor
- [ ] Permisos configurados (775 storage, 600 .env)
- [ ] Base de datos inicializada (migrate + seed)
- [ ] Frontend carga correctamente
- [ ] API responde en `/api/menu`
- [ ] Webhooks de Fudo configurados
- [ ] Prueba de orden end-to-end exitosa

---

## 🐛 Troubleshooting

### Error 500 en la API
```bash
# Ver logs
tail -f public_html/api/storage/logs/laravel.log
```

Causas comunes:
- `.env` no existe o está mal configurado
- Permisos incorrectos en `storage/`
- APP_KEY no está configurado

### MongoDB no conecta
- Verificar que la IP del servidor Hostinger esté en la whitelist de Atlas
- Ir a Atlas → Network Access → Add IP Address → `0.0.0.0/0`

### Frontend no carga
- Verificar que `index.html` esté en `public_html/`
- Verificar que `.htaccess` esté en `public_html/`

---

## 📞 Soporte

Si algo falla:
1. Revisar logs de Laravel: `api/storage/logs/laravel.log`
2. Revisar logs de Hostinger en el panel de control
3. Verificar configuración de MongoDB Atlas
4. Verificar webhooks en panel de Fudo

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu sitio estará en vivo en:

**https://sushiqueen.galt.com.mx**

Las órdenes se sincronizarán automáticamente con Fudo POS.

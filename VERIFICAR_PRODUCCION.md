# 🔍 Verificar Producción

## Problema Actual

Estás viendo en `sushiqueen.galt.com.mx`:
- ❌ Dice "Órdenes" en lugar de "Ventas"
- ❌ No hay datos en la página de ventas
- ❌ Parece ser una versión vieja

## ✅ Código Correcto en GitHub

El código en GitHub está correcto:
- ✅ AdminLayout dice "Ventas" (línea 14)
- ✅ Orders.tsx dice "Gestión de Ventas" (línea 98)
- ✅ Endpoint `/admin/orders-json` configurado
- ✅ Fallback con datos reales de Fudo

## 🔧 Posibles Causas

### 1. Cache del Navegador
El navegador está mostrando archivos viejos en caché.

**Solución**: Hacer hard refresh
- Chrome/Edge: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` (Windows) o `Cmd + Shift + R` (Mac)

### 2. Deploy de Render No Completado
Render aún está desplegando los cambios.

**Verificar**:
1. Ir a https://dashboard.render.com
2. Buscar tu servicio "sushiqueen" o "mealli-pos"
3. Ver el estado del último deploy
4. Debe decir "Live" en verde

### 3. Frontend No Actualizado
El frontend en Render no se actualizó.

**Verificar**:
```bash
# Ver la versión del código en producción
curl https://sushiqueen.galt.com.mx/admin/orders
# Buscar en el HTML si dice "Ventas" o "Órdenes"
```

### 4. Backend No Responde
El backend no está sirviendo los datos correctamente.

**Verificar**:
```bash
# Probar el endpoint de ventas
curl https://sushiqueen-backend.onrender.com/api/admin/orders-json

# Probar el endpoint de clientes
curl https://sushiqueen-backend.onrender.com/api/admin/customers-json

# Probar el endpoint de menú
curl https://sushiqueen-backend.onrender.com/api/admin/menu-json
```

## 🚀 Pasos para Resolver

### Paso 1: Limpiar Cache del Navegador
1. Presiona `Cmd + Shift + R` (Mac) o `Ctrl + Shift + R` (Windows)
2. Si no funciona, abre en modo incógnito: `Cmd + Shift + N`

### Paso 2: Verificar Deploy en Render
1. Ve a https://dashboard.render.com
2. Encuentra tu servicio
3. Verifica que el último deploy esté "Live"
4. Si está "Building", espera a que termine
5. Si falló, revisa los logs

### Paso 3: Forzar Re-deploy (si es necesario)
Si el deploy no se activó automáticamente:

1. En Render Dashboard, ve a tu servicio
2. Click en "Manual Deploy" → "Deploy latest commit"
3. Espera a que termine (5-10 minutos)

### Paso 4: Verificar Logs del Backend
Si los datos no aparecen:

1. En Render Dashboard, ve al servicio del backend
2. Click en "Logs"
3. Busca errores relacionados con:
   - `storage/app/fudo_data`
   - `api_fudo_fallback.php`
   - Errores 500 o 404

## 📊 Endpoints que Deben Funcionar

Una vez desplegado, estos endpoints deben responder:

### Backend (API)
```
GET /api/admin/customers-json
GET /api/admin/orders-json  
GET /api/admin/menu-json
GET /api/admin/ingredients-json
GET /api/admin/suppliers-json
```

### Frontend (Páginas)
```
/admin/orders → Debe decir "Gestión de Ventas"
/admin/customers → Debe mostrar 901 clientes
/admin/menu → Debe mostrar 260 productos
```

## 🧪 Test Rápido

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Ver si el frontend está actualizado
console.log(document.title);
// Debe incluir "Ventas" no "Órdenes"

// Probar el endpoint
fetch('/api/admin/orders-json')
  .then(r => r.json())
  .then(d => console.log('Ventas:', d.data?.length || 0));
// Debe mostrar un número > 0

fetch('/api/admin/customers-json')
  .then(r => r.json())
  .then(d => console.log('Clientes:', d.data?.length || 0));
// Debe mostrar 901

fetch('/api/admin/menu-json')
  .then(r => r.json())
  .then(d => console.log('Productos:', d.data?.length || 0));
// Debe mostrar 260
```

## 🔄 Últimos Commits

Los cambios están en estos commits:
1. `4c46364` - Fix customer totals and rename to Ventas
2. `c73eeb4` - Add complete menu endpoint
3. `b140aea` - Documentation

## ⏰ Tiempo de Deploy

Render típicamente tarda:
- Frontend: 3-5 minutos
- Backend: 5-10 minutos
- Total: ~15 minutos desde el push

## 📞 Si Nada Funciona

1. Verifica que los archivos JSON existan en Render:
   - Deben estar en `backend/storage/app/fudo_data/`
   - 8 archivos: clientes.json, ventas.json, productos.json, etc.

2. Verifica que las rutas estén incluidas:
   - `backend/routes/api.php` debe incluir `api_fudo_fallback.php`

3. Revisa los logs de Render para errores específicos

## ✅ Checklist

- [ ] Hard refresh del navegador (Cmd+Shift+R)
- [ ] Verificar deploy en Render está "Live"
- [ ] Probar endpoints en consola del navegador
- [ ] Verificar que dice "Ventas" no "Órdenes"
- [ ] Verificar que aparecen datos en las páginas
- [ ] Limpiar cache si es necesario

---

**Nota**: Si acabas de hacer push, espera 15 minutos para que Render complete el deploy.

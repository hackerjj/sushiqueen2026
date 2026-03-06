# Changelog - MealLi POS (Sushi Queen)

## v2.2.0 — 2026-03-06

### Fixes
- Gastos movido debajo de Ventas en menú lateral
- Mesas en POS: cuadros de 70px que respetan grid de configuración
- Fechas "Invalid Date" arregladas en Caja y Gastos (parseo de formato "YYYY-MM-DD HH:MM:SS")
- Removidos casts 'array' de modelos MongoDB que causaban json_decode error
- Migración usa MongoDB UTCDateTime para todas las fechas
- Gastos migrados desde Excel (3,581 registros de 6 archivos)
- Proveedores: ahora guarda contact_name, phone, address, tax_id, notes
- Versión actualizada a v2.2.0

### Pendientes conocidos
- Inventario: verificar que nombres se muestren correctamente después de re-migración
- Proveedores: verificar datos después de re-migración
- Clientes: total gastado requiere re-correr step=stats después de migración
- Dashboard: Top Items muestra "Venta #" (las órdenes de Fudo no tienen detalle de productos)

## v2.1.0 — 2026-03-06

### POS - Punto de Venta
- **Mostrador**: Tablero estilo Fudo con 4 estados (Pendiente → En curso → A entregar → Cerradas últimas 10)
- **Delivery**: Tablero con 5 estados (Pendientes → En preparación → Listo → Enviados → Entregados últimos 50)
- **Mostrador Express**: Vista rápida con grid de productos con imágenes y categorías, solo pide Cliente + Comentario
- **Mesas**: Grid respeta posiciones de configuración, botones de 70px cuadrados
- **Buscador de productos**: Buscar por nombre en Mostrador/Delivery, botón "+" abre popup con grid de imágenes
- **Autocomplete clientes**: Busca por nombre, teléfono o email con sugerencias
- **Modal Nuevo Cliente**: Nombre, Teléfono, Email, Fecha nacimiento, RFC, Comentario
- **Modal Cerrar Pedido**: Propina + Pago + Vuelta (estilo Fudo)

### Dashboard
- KPIs: Ventas Hoy, Ventas Mes, Órdenes Hoy, Nuevos Clientes — datos de MongoDB
- Tabla Ventas Recientes: ID, Fecha, Cliente, Tipo de Venta (Local/Mostrador/Delivery), Estado, Total
- Top Items del mes

### Ventas (Gestión de Ventas)
- Tabla: ID, Fecha Creación, Tiempo Entrega, Cliente, Tipo de Venta, Total
- Filtro por cliente con autocomplete
- Paginación con selector de registros por página
- Lee directamente de MongoDB

### Caja (Arqueos de Caja)
- Tabla de arqueos: Hora apertura, Hora cierre, Caja, Sistema, Usuario, Diferencia, Estado
- 1,477 arqueos históricos migrados de Fudo
- Filtro por estado (Abierto/Cerrado)
- Paginación
- Fix de fechas "Invalid Date"

### Gastos
- Movido en menú lateral a debajo de Ventas
- Fix de fechas "Invalid Date"

### Menú
- 104 productos de Sushi Queen con fotos (fuente: menuData del frontend)
- Endpoint /admin/menu sirve desde MongoDB

### Base de Datos
- Migración completa de Fudo a MongoDB via `php artisan fudo:migrate --fresh`
- Ruta web de migración: `/api/admin/migrate-fudo?key=sushiqueen2026migrate`
- Datos migrados: 104 menú, 901 clientes, 14,759 órdenes, 178 ingredientes, 61 proveedores, 1,477 arqueos
- Stats de clientes calculados por separado (step=stats)
- Fix: removidos casts 'array' de modelos MongoDB que causaban json_decode error
- Fechas almacenadas como MongoDB UTCDateTime

### Infraestructura
- Frontend: Hostinger (deploy-sushiqueen branch)
- Backend: Render (main branch)
- VITE_API_URL configurado en workflow de Hostinger apuntando a Render
- Base de datos: MongoDB Atlas

### Pendientes conocidos
- Inventario: nombres de ingredientes no se muestran en la vista
- Proveedores: nombres no se muestran en la vista
- Clientes: total gastado $0 en algunos clientes
- Dashboard: Top Items muestra "Venta #" en vez de productos reales

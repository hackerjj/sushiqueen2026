# MealLi POS - Requisitos de Plataforma

## Visión General
MealLi es la plataforma propia de gestión gastronómica que reemplaza a Fudo POS. Controlará todas las operaciones del restaurante desde el portal admin de Sushi Queen: ventas, caja, inventario, cocina, clientes, reportes y delivery. La idea es que MealLi sea el motor interno que maneja todo lo que antes hacía Fudo, integrado directamente en la app existente.

## Fase 1: Eliminar Dependencia de Fudo + POS Core

### RF-1: Procesamiento de Órdenes Propio (reemplaza FudoService)
- Las órdenes ya NO se envían a Fudo, se procesan internamente
- Ciclo de vida completo: pending → confirmed → preparing → ready → delivered/cancelled
- Confirmación de órdenes desde el admin (reemplaza webhook ORDER-CONFIRMED)
- Cambio de estado manual desde panel admin con timestamps
- Notificaciones WhatsApp al cambiar estado (ya existe, se mantiene)
- Sonido/alerta en nuevas órdenes en el panel admin
- Número de orden secuencial por día (ej: #001, #002...)

### RF-2: Caja y Arqueos
- Apertura y cierre de caja con monto inicial
- Registro de movimientos: ingresos (ventas), egresos (gastos), retiros
- Arqueo de caja: comparar monto esperado vs monto real
- Historial de cajas por día/turno
- Resumen de ventas por método de pago (efectivo, tarjeta, transferencia)
- Propinas registradas por orden

### RF-3: Kitchen Display System (KDS)
- Pantalla de cocina con órdenes en tiempo real
- Vista de órdenes por estado: nuevas → en preparación → listas
- Timer por orden (tiempo desde que entró)
- Marcar items individuales como preparados
- Alerta visual/sonora para órdenes nuevas
- Vista optimizada para tablet/pantalla de cocina

### RF-4: Gestión de Menú Mejorada (ya existe parcialmente)
- CRUD de productos (ya existe) - se mantiene
- Gestión de categorías con orden personalizado
- Disponibilidad por horario (ej: desayunos solo mañana)
- Múltiples listas de precios (mostrador, delivery, app)
- Modificadores con precio (ya existe) - se mantiene
- Fotos de productos con upload directo

## Fase 2: Inventario y Recetas

### RF-5: Control de Inventario
- Catálogo de insumos/ingredientes con unidades de medida
- Stock actual por insumo
- Alertas de stock bajo
- Movimientos de inventario (entradas, salidas, mermas)
- Conteo de inventario físico
- Historial de movimientos

### RF-6: Recetas
- Vincular productos del menú con ingredientes
- Costo de receta calculado automáticamente
- Descuento automático de inventario al vender
- Margen de ganancia por producto
- Alertas cuando un producto no tiene stock suficiente

## Fase 3: Gestión Avanzada

### RF-7: Gestión de Mesas
- Mapa visual de mesas del restaurante
- Estado de mesas: libre, ocupada, reservada, por cobrar
- Asignar órdenes a mesas
- Dividir cuenta por comensal
- Transferir items entre mesas
- Tiempo de ocupación por mesa

### RF-8: Gestión de Proveedores
- CRUD de proveedores
- Órdenes de compra
- Historial de compras por proveedor
- Cuentas por pagar

### RF-9: Múltiples Cajas y Turnos
- Soporte para múltiples cajas simultáneas
- Turnos de empleados con apertura/cierre individual
- Asignación de caja por usuario
- Reportes por caja y por turno

### RF-10: Reportes y Estadísticas Avanzadas
- Reporte de ventas por período (día, semana, mes, año)
- Reporte de productos más vendidos
- Reporte de inventario (stock, valorización)
- Reporte de compras a proveedores
- Estado de resultados (ingresos - costos - gastos)
- Exportación a CSV/PDF
- Gráficos interactivos

## Fase 4: Delivery y Facturación

### RF-11: Gestión de Delivery
- Asignar repartidores a órdenes
- Tracking de estado de entrega
- Zonas de cobertura con costos de envío
- Tiempo estimado de entrega
- Historial de entregas por repartidor

### RF-12: Facturación Electrónica (futuro)
- Emisión de tickets/recibos
- Preparado para CFDI (México)
- Datos fiscales del cliente

## Requisitos No Funcionales

### RNF-1: Arquitectura
- Todo integrado en el backend Laravel existente (nuevos controllers, models, services)
- Frontend React existente con nuevas páginas admin
- MongoDB como base de datos (consistente con lo actual)
- Redis para cache y real-time (ya configurado)
- Sin dependencias externas de POS (adiós Fudo)

### RNF-2: Real-time
- WebSockets o polling para actualización de órdenes en KDS
- Notificaciones push en el admin cuando llegan órdenes nuevas
- Actualización automática del dashboard

### RNF-3: Offline-ready (futuro)
- Preparado para funcionar sin internet (cache local)
- Sincronización cuando se recupere conexión

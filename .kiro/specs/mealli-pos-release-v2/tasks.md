# Plan de Implementación: Mealli POS Release V2 — Sushi Queen Orlando

## Resumen

Implementación de 17 mejoras organizadas por prioridad (Crítico → Importante → Mejoras). Cada tarea construye sobre las anteriores, comenzando con la infraestructura backend y terminando con la integración de todos los módulos. Stack: Laravel (PHP) backend, React + Vite + TypeScript frontend, MongoDB.

## Tareas

- [x] 1. Dashboard — Conexión a MongoDB (CRÍTICO)
  - [x] 1.1 Implementar endpoint mejorado `GET /admin/dashboard` en `OrderController`
    - Agregar aggregation pipeline de MongoDB para ventas del día, semana y mes
    - Agregar conteo de órdenes por período y clientes nuevos de la semana
    - Agregar pipeline de top 10 productos más vendidos (unwind items, group, sort, limit)
    - Agregar consulta de 5 órdenes más recientes
    - Excluir órdenes con status "cancelled" de todos los cálculos
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 1.2 Implementar función `mapDashboardResponse` en el frontend
    - Crear función que mapee la respuesta del backend al tipo `DashboardKPIs`
    - Manejar campos nulos, faltantes y formatos antiguos con valores por defecto >= 0
    - Asegurar que `top_items` siempre sea un array
    - _Requisitos: 1.1, 1.2, 1.3_

  - [x] 1.3 Escribir property test para Dashboard KPIs válidos
    - **Property 1: Dashboard KPIs siempre válidos**
    - **Valida: Requisitos 1.1, 1.2**

  - [x] 1.4 Escribir property test para top items ordenados
    - **Property 2: Top items ordenados descendentemente**
    - **Valida: Requisito 1.3**

  - [x] 1.5 Implementar manejo de error de conexión MongoDB en Dashboard
    - Mostrar banner "Conexión limitada" cuando el backend retorna error
    - Usar datos en caché si están disponibles
    - _Requisitos: 1.5_

  - [x] 1.6 Escribir property test para exclusión de órdenes canceladas
    - **Property 3: Exclusión de órdenes canceladas en cálculos de ventas**
    - **Valida: Requisitos 1.6, 17.5**

- [x] 2. KDS — Órdenes en tiempo real (CRÍTICO)
  - [x] 2.1 Crear endpoint `GET /admin/orders/kitchen` en el backend
    - Retornar órdenes con status "confirmed" o "preparing" ordenadas por `created_at` ASC
    - Filtrar y excluir órdenes con status "ready", "delivered", "cancelled"
    - _Requisitos: 2.3, 2.6_

  - [x] 2.2 Implementar broadcasting de eventos de órdenes en Laravel
    - Crear evento `OrderCreated` que implemente `ShouldBroadcast` en canal 'kitchen'
    - Crear evento `OrderUpdated` para cambios de estado
    - Disparar eventos al crear/actualizar órdenes en `OrderController`
    - _Requisitos: 2.1, 2.4_

  - [x] 2.3 Implementar hook `useKitchenOrders` en el frontend
    - Conectar a WebSocket (Pusher) para recibir eventos en tiempo real
    - Implementar fallback a polling cada 5 segundos si WebSocket falla
    - Reproducir sonido de alerta cuando llega nueva orden
    - Mostrar indicador "Modo offline — actualizando cada 5s" en modo polling
    - Implementar funciones `updateStatus` y `markItemPrepared`
    - _Requisitos: 2.1, 2.2, 2.5_

  - [x] 2.4 Escribir property test para filtrado de órdenes en KDS
    - **Property 4: Filtrado de órdenes en KDS**
    - **Valida: Requisitos 2.3, 2.6**

- [x] 3. Checkpoint — Verificar módulos críticos
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 4. POS — Layout de mesas compacto estilo FUDO (IMPORTANTE)
  - [x] 4.1 Implementar grid compacto de mesas en `POS.tsx`
    - Renderizar mesas en grid compacto ordenadas por número ascendente
    - Calcular columnas como `min(6, ceil(sqrt(n)))` donde n = total mesas en zona
    - Aplicar colores: naranja (tiene productos en carrito), rojo (ocupada sin carrito), verde (disponible)
    - Asegurar que cada mesa se renderiza exactamente una vez por zona
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.2 Escribir property test para completitud y ordenamiento del grid
    - **Property 5: Grid de mesas — completitud y ordenamiento**
    - **Valida: Requisitos 3.1, 3.4**

  - [x] 4.3 Escribir property test para cálculo de columnas del grid
    - **Property 6: Cálculo de columnas del grid de mesas**
    - **Valida: Requisito 3.2**

  - [x] 4.4 Escribir property test para mapeo de colores de mesas
    - **Property 7: Mapeo de colores de mesas**
    - **Valida: Requisito 3.3**

- [x] 5. POS — Tabs de canales de venta (IMPORTANTE)
  - [x] 5.1 Implementar componente de tabs de canales de venta
    - Crear tabs horizontales debajo del área de mesas: Mesas, Mostrador, Delivery, Mostrador Express
    - Cada tab muestra su vista correspondiente al seleccionarse
    - Canal "Mostrador" y "Mostrador Express" permiten órdenes sin mesa asignada
    - Canal "Mesas" muestra el grid compacto de mesas
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

- [x] 6. POS — Restaurar imágenes de productos (IMPORTANTE)
  - [x] 6.1 Restaurar visualización de imágenes en vistas del POS
    - Mostrar `image_url` de cada producto en vistas Para Llevar, Delivery y Mesa
    - Mostrar placeholder "Sin imagen" cuando el producto no tiene imagen asignada
    - _Requisitos: 5.1, 5.2_

- [x] 7. POS — Método de pago para llevar (IMPORTANTE)
  - [x] 7.1 Crear componente `PaymentModal` para órdenes para llevar
    - Modal con tres opciones: Tarjeta de crédito, Tarjeta de débito, Efectivo
    - Campo "¿Con cuánto paga?" para efectivo con cálculo automático de cambio
    - Checkbox "No tengo cambio" con campos de monto prestado y persona
    - Campos de préstamo solo visibles cuando `no_change` es true y método es efectivo
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.2 Implementar función `calculateCashPayment` y envío de payment_details
    - Calcular cambio como `max(0, monto_recibido - total)`
    - Incluir `payment_details` en la orden enviada al backend
    - _Requisitos: 6.2, 6.5, 6.6_

  - [x] 7.3 Escribir property test para cálculo de cambio en pago efectivo
    - **Property 8: Cálculo de cambio en pago efectivo**
    - **Valida: Requisitos 6.2, 6.6**

  - [x] 7.4 Escribir property test para campos de préstamo condicionales
    - **Property 9: Campos de préstamo condicionales en pago**
    - **Valida: Requisito 6.4**

- [x] 8. Checkpoint — Verificar módulos importantes del POS
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [-] 9. Clientes dentro de POS Para Llevar (MEJORA)
  - [x] 9.1 Implementar búsqueda de clientes en vista Para Llevar
    - Agregar campos de búsqueda por nombre y teléfono en la vista Para Llevar
    - Implementar búsqueda parcial en el backend (endpoint existente o nuevo)
    - Auto-completar datos del cliente seleccionado en la orden
    - _Requisitos: 7.1, 7.2, 7.3_

  - [x] 9.2 Escribir property test para búsqueda parcial de clientes
    - **Property 10: Búsqueda parcial de clientes**
    - **Valida: Requisito 7.2**

- [x] 10. Delivery Admin — Órdenes por cliente (MEJORA)
  - [x] 10.1 Implementar vista de delivery con órdenes agrupadas por cliente
    - Mostrar órdenes de delivery filtrables por cliente
    - Incluir datos del cliente (nombre, teléfono, dirección) junto a cada orden
    - _Requisitos: 8.1, 8.2_

- [-] 11. Ventas — Filtro por cliente y total acumulado (MEJORA)
  - [x] 11.1 Implementar filtro de ventas por cliente en backend y frontend
    - Agregar parámetro de filtro `customer_id` al endpoint de ventas/órdenes
    - Mostrar total acumulado del cliente seleccionado
    - _Requisitos: 9.1, 9.2_

  - [x] 11.2 Escribir property test para filtro de ventas por cliente
    - **Property 11: Filtro de ventas por cliente**
    - **Valida: Requisitos 9.1, 9.2**

- [-] 12. Menú — Bulk Edit CSV Import/Export e Image Upload (MEJORA)
  - [x] 12.1 Implementar endpoint `GET /admin/menu/export-csv` en `MenuController`
    - Exportar todos los productos a CSV con columnas: id, nombre, descripción, precio, categoría, imagen, disponible
    - _Requisitos: 10.1_

  - [x] 12.2 Implementar endpoint `POST /admin/menu/import-csv` en `MenuController`
    - Parsear CSV, validar campos requeridos (name, price) por fila
    - Upsert: actualizar si `_id` existe, crear si no existe
    - Retornar resumen con created, updated, y lista de errores por fila
    - _Requisitos: 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 12.3 Implementar endpoint `POST /admin/menu/{id}/image` en `MenuController`
    - Validar imagen (jpg, jpeg, png, webp, max 5MB)
    - Almacenar archivo y actualizar `image_url` del producto
    - Retornar error 422 si no cumple validación
    - _Requisitos: 10.7, 10.8, 10.9, 5.3_

  - [x] 12.4 Implementar UI de gestión de menú con bulk actions en el frontend
    - Botones de exportar/importar CSV
    - Upload de imagen por producto en tabla de productos
    - Mostrar resumen de importación (creados, actualizados, errores)
    - _Requisitos: 10.1, 10.6_

  - [x] 12.5 Escribir property test para validación de filas CSV
    - **Property 12: Validación de filas CSV en importación**
    - **Valida: Requisitos 10.2, 10.3**

  - [x] 12.6 Escribir property test para idempotencia de importación CSV
    - **Property 13: Idempotencia de importación CSV**
    - **Valida: Requisitos 10.4, 10.5**

  - [x] 12.7 Escribir property test para conteo de operaciones CSV
    - **Property 14: Conteo de operaciones en importación CSV**
    - **Valida: Requisito 10.6**

- [x] 13. Inventario/Recetas/Proveedores — Repoblar datos desde FUDO (MEJORA)
  - [x] 13.1 Implementar comando/endpoint de importación de datos FUDO
    - Crear script o endpoint para importar ingredientes, recetas y proveedores desde archivos xlsx de FUDO
    - Validar integridad de datos antes de insertar en MongoDB
    - Crear `InventoryController` con endpoints CRUD para ingredientes, recetas y proveedores
    - _Requisitos: 11.1, 11.2_

- [ ] 14. Clientes — Vista mejorada (MEJORA)
  - [x] 14.1 Implementar vista mejorada de clientes con métricas
    - Mostrar total_orders, total_spent, y last_order_at por cliente
    - Calcular y mostrar tipo de venta predominante (local, delivery, app)
    - Asegurar que total_orders y total_spent se calculan correctamente desde órdenes
    - _Requisitos: 12.1, 12.2, 12.3, 12.4_

  - [x] 14.2 Escribir property test para consistencia de datos de cliente
    - **Property 15: Consistencia de datos de cliente**
    - **Valida: Requisitos 12.2, 12.3**

- [x] 15. Checkpoint — Verificar módulos de mejoras (parte 1)
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 16. Insights — Google Maps reviews e Insights de ventas (MEJORA)
  - [x] 16.1 Implementar módulo de Insights
    - Crear `InsightsController` con endpoint para obtener reviews de Google Maps
    - Crear endpoint para métricas de tendencias de ventas desde MongoDB
    - Implementar UI de Insights con sección de reviews y métricas de ventas
    - _Requisitos: 13.1, 13.2_

- [x] 17. Promociones — Conectar a base de datos (MEJORA)
  - [x] 17.1 Implementar CRUD de promociones conectado a MongoDB
    - Crear `PromotionController` con endpoints: index, store, update, destroy
    - Conectar frontend de promociones a los endpoints reales (reemplazar datos mock)
    - _Requisitos: 14.1, 14.2, 14.3_

- [ ] 18. Reportes — UI completa con gráficas (MEJORA)
  - [x] 18.1 Implementar `ReportController` con endpoints de reportes
    - `GET /admin/reports/sales` — reporte de ventas con métricas completas
    - `GET /admin/reports/customers` — reporte por clientes
    - `GET /admin/reports/products` — reporte por productos (más y menos vendidos)
    - Soportar filtros de período: hoy, semana, mes, año, rango personalizado
    - Desglosar ventas por fuente (canal de venta) y tipo de servicio
    - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 18.2 Implementar UI de reportes con gráficas en el frontend
    - Integrar librería de gráficas (recharts o chart.js)
    - Crear gráficas de ventas por día/semana/mes
    - Mostrar métricas: total órdenes, ingreso total, ticket promedio, mejor cliente, mejor/peor producto, mejor promoción
    - Tablas de productos más y menos vendidos
    - _Requisitos: 15.2, 15.3, 15.4_

  - [x] 18.3 Escribir property test para ordenamiento de productos en reportes
    - **Property 16: Ordenamiento de productos en reportes**
    - **Valida: Requisito 15.4**

- [ ] 19. Gastos — Nueva plataforma (MEJORA)
  - [x] 19.1 Crear modelo `Expense` y `ExpenseController` en Laravel
    - Modelo con campos: description, amount, category, date, payment_method, receipt_url, notes, created_by
    - Endpoints CRUD: index (con filtros por período y categoría), store, update, destroy
    - Endpoint `GET /admin/expenses/summary` para resumen agrupado por categoría
    - Validaciones: description max 255, amount > 0, category en enum, fecha ISO
    - _Requisitos: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

  - [x] 19.2 Implementar UI de gastos en el frontend
    - Formulario de creación/edición de gastos
    - Lista de gastos con filtros por período y categoría
    - Vista de resumen por categoría
    - _Requisitos: 16.1, 16.4, 16.7_

  - [x] 19.3 Escribir property test para validación de gastos
    - **Property 17: Validación de gastos**
    - **Valida: Requisitos 16.2, 16.3**

  - [x] 19.4 Escribir property test para resumen de gastos por categoría
    - **Property 18: Resumen de gastos por categoría**
    - **Valida: Requisito 16.7**

- [ ] 20. Revenue — Cálculo Ventas menos Gastos (MEJORA)
  - [x] 20.1 Implementar endpoint `GET /admin/reports/revenue` en `ReportController`
    - Calcular revenue = total_ventas - total_gastos para el período seleccionado
    - Soportar períodos: hoy, semana, mes, año
    - Incluir desglose diario con ventas, gastos y revenue por día
    - Excluir órdenes canceladas del cálculo de ventas
    - _Requisitos: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 20.2 Implementar UI de revenue en el frontend
    - Mostrar revenue total y desglose diario
    - Integrar con gráficas de reportes
    - _Requisitos: 17.1, 17.3_

  - [x] 20.3 Escribir property test para fórmula de revenue
    - **Property 19: Fórmula de revenue**
    - **Valida: Requisito 17.1**

  - [x] 20.4 Escribir property test para consistencia del desglose diario
    - **Property 20: Consistencia del desglose diario de revenue**
    - **Valida: Requisito 17.4**

- [x] 21. Checkpoint final — Verificar integración completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental entre bloques de prioridad
- Los property tests validan propiedades universales de corrección definidas en el diseño
- Los unit tests validan ejemplos específicos y casos borde

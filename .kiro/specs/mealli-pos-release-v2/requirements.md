# Documento de Requisitos — Mealli POS Release V2 (Sushi Queen Orlando)

## Introducción

Este documento define los requisitos formales para la Release V2 de Mealli POS, una plataforma de punto de venta para Sushi Queen (Orlando). La release abarca 17 mejoras organizadas en tres niveles de prioridad: Crítico (Dashboard conectado a MongoDB, KDS en tiempo real), Importante (POS layout compacto, canales de venta, imágenes de productos, métodos de pago), y Mejoras (clientes en POS, reportes, gastos, revenue, bulk edit de menú, inventario, promociones, insights). El stack tecnológico es Laravel (PHP) backend, React + Vite + TypeScript frontend, MongoDB, y JWT para autenticación.

## Glosario

- **Sistema_Dashboard**: Módulo del frontend y backend responsable de mostrar KPIs y métricas del negocio en la página principal de administración.
- **Sistema_KDS**: Kitchen Display System — pantalla de cocina que muestra órdenes en tiempo real para su preparación.
- **Sistema_POS**: Punto de venta — interfaz principal donde los cajeros registran órdenes por canal de venta (Mesas, Mostrador, Delivery, Express).
- **Sistema_Pago**: Módulo de procesamiento de pagos que gestiona métodos de pago (efectivo, tarjeta, préstamo) al registrar órdenes.
- **Sistema_Menu**: Módulo de gestión de menú que permite CRUD de productos, importación/exportación CSV, y subida de imágenes.
- **Sistema_Gastos**: Módulo de registro y gestión de gastos operativos del negocio.
- **Sistema_Reportes**: Módulo de generación de reportes con gráficas y métricas de ventas, productos, clientes.
- **Sistema_Revenue**: Módulo de cálculo de ingresos netos (Ventas - Gastos) por período.
- **Sistema_Clientes**: Módulo de gestión de clientes con historial de órdenes y métricas acumuladas.
- **Sistema_Delivery**: Módulo de administración de órdenes de delivery con datos de cliente.
- **Sistema_Inventario**: Módulo de gestión de ingredientes, recetas y proveedores.
- **Sistema_Promociones**: Módulo de gestión de promociones conectado a la base de datos.
- **Sistema_Insights**: Módulo de análisis con reviews de Google Maps e insights de ventas.
- **MongoDB**: Base de datos NoSQL utilizada como almacenamiento principal.
- **WebSocket**: Protocolo de comunicación bidireccional en tiempo real (via Pusher).
- **Polling**: Mecanismo de consulta periódica al servidor como fallback cuando WebSocket no está disponible.
- **CSV**: Formato de archivo de valores separados por comas para importación/exportación masiva de datos.
- **KPI**: Key Performance Indicator — indicador clave de rendimiento del negocio.
- **Canal_de_Venta**: Tipo de servicio: Mesas, Mostrador, Delivery, o Mostrador Express.

## Requisitos

### Requisito 1: Dashboard conectado a MongoDB

**Historia de Usuario:** Como administrador del restaurante, quiero ver datos reales de ventas y métricas en el dashboard, para poder tomar decisiones informadas sobre el negocio.

#### Criterios de Aceptación

1. CUANDO el administrador accede al dashboard, EL Sistema_Dashboard DEBERÁ consultar MongoDB y mostrar ventas del día, semana y mes con valores numéricos reales.
2. CUANDO el Sistema_Dashboard obtiene datos de ventas, EL Sistema_Dashboard DEBERÁ mostrar valores numéricos mayores o iguales a cero para todas las métricas (ventas, órdenes, clientes nuevos).
3. CUANDO el Sistema_Dashboard carga los productos más vendidos, EL Sistema_Dashboard DEBERÁ mostrar una lista de hasta 10 productos ordenados por cantidad vendida de forma descendente.
4. CUANDO el Sistema_Dashboard carga las órdenes recientes, EL Sistema_Dashboard DEBERÁ mostrar las 5 órdenes más recientes con su estado actual.
5. SI la conexión a MongoDB falla, ENTONCES EL Sistema_Dashboard DEBERÁ mostrar un banner "Conexión limitada" y utilizar datos en caché si están disponibles.
6. EL Sistema_Dashboard DEBERÁ excluir órdenes con estado "cancelled" de todos los cálculos de ventas y métricas.

### Requisito 2: KDS — Órdenes en tiempo real

**Historia de Usuario:** Como cocinero, quiero ver las órdenes nuevas en tiempo real en la pantalla de cocina, para poder prepararlas sin demora.

#### Criterios de Aceptación

1. CUANDO se crea una nueva orden en el POS, EL Sistema_KDS DEBERÁ mostrarla en la pantalla de cocina en menos de 1 segundo via WebSocket o en menos de 5 segundos via polling.
2. CUANDO llega una nueva orden al KDS, EL Sistema_KDS DEBERÁ reproducir un sonido de alerta para notificar al personal de cocina.
3. MIENTRAS el KDS está activo, EL Sistema_KDS DEBERÁ mostrar únicamente órdenes con estado "confirmed" o "preparing", ordenadas por fecha de creación ascendente (la más antigua primero).
4. CUANDO un cocinero cambia el estado de una orden, EL Sistema_KDS DEBERÁ actualizar el estado en MongoDB y notificar a todos los terminales KDS conectados.
5. SI la conexión WebSocket se pierde, ENTONCES EL Sistema_KDS DEBERÁ cambiar automáticamente a polling cada 5 segundos y mostrar un indicador "Modo offline — actualizando cada 5s".
6. CUANDO una orden cambia a estado "ready", "delivered" o "cancelled", EL Sistema_KDS DEBERÁ removerla de la cola de órdenes visibles.

### Requisito 3: POS — Layout de mesas compacto estilo FUDO

**Historia de Usuario:** Como cajero, quiero ver las mesas en un layout compacto y ordenado, para poder seleccionar mesas rápidamente durante el servicio.

#### Criterios de Aceptación

1. CUANDO el cajero accede a la vista de mesas, EL Sistema_POS DEBERÁ mostrar las mesas en un grid compacto ordenado por número de mesa de forma ascendente.
2. CUANDO el Sistema_POS renderiza el grid de mesas, EL Sistema_POS DEBERÁ calcular el número de columnas como el mínimo entre 6 y la raíz cuadrada redondeada hacia arriba del total de mesas en la zona.
3. CUANDO una mesa tiene productos en el carrito, EL Sistema_POS DEBERÁ mostrarla en color naranja; cuando está ocupada sin productos en carrito, en rojo; cuando está disponible, en verde.
4. EL Sistema_POS DEBERÁ renderizar cada mesa de una zona exactamente una vez en el grid, sin duplicados ni omisiones.

### Requisito 4: POS — Tabs de canales de venta

**Historia de Usuario:** Como cajero, quiero cambiar entre canales de venta (Mesas, Mostrador, Delivery, Mostrador Express) mediante tabs, para poder gestionar diferentes tipos de servicio de forma organizada.

#### Criterios de Aceptación

1. EL Sistema_POS DEBERÁ mostrar tabs horizontales debajo del área de mesas con los canales: Mesas, Mostrador, Delivery, y Mostrador Express.
2. CUANDO el cajero selecciona un tab de canal, EL Sistema_POS DEBERÁ mostrar la vista correspondiente a ese canal de venta.
3. CUANDO el canal activo es "Mostrador" o "Mostrador Express", EL Sistema_POS DEBERÁ permitir registrar órdenes sin asignar una mesa.
4. CUANDO el canal activo es "Mesas", EL Sistema_POS DEBERÁ mostrar el grid compacto de mesas para selección.

### Requisito 5: POS — Restaurar imágenes de productos

**Historia de Usuario:** Como cajero, quiero ver las imágenes de los productos en el POS, para poder identificar visualmente los platos al registrar órdenes.

#### Criterios de Aceptación

1. CUANDO el Sistema_POS muestra productos en las vistas Para Llevar, Delivery y Mesa, EL Sistema_POS DEBERÁ mostrar la imagen asociada a cada producto desde su campo `image_url`.
2. SI un producto no tiene imagen asignada, ENTONCES EL Sistema_POS DEBERÁ mostrar un placeholder con el texto "Sin imagen".
3. CUANDO se sube una imagen para un producto, EL Sistema_Menu DEBERÁ almacenar el archivo y actualizar el campo `image_url` del producto para que sea accesible via URL.

### Requisito 6: POS — Método de pago al registrar orden para llevar

**Historia de Usuario:** Como cajero, quiero seleccionar el método de pago al registrar una orden para llevar, para poder registrar correctamente cómo pagó el cliente.

#### Criterios de Aceptación

1. CUANDO el cajero confirma una orden para llevar, EL Sistema_Pago DEBERÁ mostrar un modal con tres opciones de método de pago: Tarjeta de crédito, Tarjeta de débito, y Efectivo.
2. CUANDO el cajero selecciona "Efectivo", EL Sistema_Pago DEBERÁ mostrar un campo "¿Con cuánto paga?" y calcular automáticamente el cambio como `max(0, monto_recibido - total)`.
3. CUANDO el cajero marca "No tengo cambio" en un pago en efectivo, EL Sistema_Pago DEBERÁ mostrar campos adicionales para registrar el monto prestado y la persona que prestó el dinero.
4. CUANDO el método de pago no es efectivo o "No tengo cambio" es falso, EL Sistema_Pago DEBERÁ omitir los campos de préstamo (borrowed_amount y borrowed_from quedan indefinidos).
5. CUANDO el pago se confirma, EL Sistema_Pago DEBERÁ incluir los detalles de pago (payment_details) en la orden enviada al backend.
6. EL Sistema_Pago DEBERÁ garantizar que el campo `change_amount` sea siempre mayor o igual a cero.

### Requisito 7: Clientes dentro de POS Para Llevar

**Historia de Usuario:** Como cajero, quiero buscar clientes por nombre o teléfono al registrar una orden para llevar, para poder asociar la orden al cliente correcto.

#### Criterios de Aceptación

1. CUANDO el cajero está en la vista "Para Llevar", EL Sistema_POS DEBERÁ mostrar campos de búsqueda de cliente por nombre y teléfono.
2. CUANDO el cajero ingresa un término de búsqueda, EL Sistema_Clientes DEBERÁ retornar clientes que coincidan parcialmente por nombre o teléfono.
3. CUANDO el cajero selecciona un cliente existente, EL Sistema_POS DEBERÁ asociar automáticamente los datos del cliente a la orden.

### Requisito 8: Delivery Admin — Órdenes por cliente

**Historia de Usuario:** Como administrador, quiero ver las órdenes de delivery organizadas por cliente con sus datos, para poder gestionar entregas de forma eficiente.

#### Criterios de Aceptación

1. CUANDO el administrador accede a la vista de Delivery, EL Sistema_Delivery DEBERÁ mostrar las órdenes de delivery agrupadas o filtrables por cliente.
2. CUANDO se muestra una orden de delivery, EL Sistema_Delivery DEBERÁ incluir los datos del cliente (nombre, teléfono, dirección) junto con los detalles de la orden.

### Requisito 9: Ventas — Filtro por cliente y total acumulado

**Historia de Usuario:** Como administrador, quiero filtrar las ventas por cliente y ver el total acumulado, para poder analizar el comportamiento de compra de cada cliente.

#### Criterios de Aceptación

1. CUANDO el administrador aplica un filtro de cliente en la vista de ventas, EL Sistema_Reportes DEBERÁ mostrar únicamente las órdenes asociadas a ese cliente.
2. CUANDO se filtran ventas por cliente, EL Sistema_Reportes DEBERÁ mostrar el total acumulado de todas las órdenes del cliente seleccionado.

### Requisito 10: Menú — Bulk Edit CSV Import/Export e Image Upload

**Historia de Usuario:** Como administrador, quiero importar y exportar productos del menú via CSV y subir imágenes por producto, para poder gestionar el menú de forma masiva y eficiente.

#### Criterios de Aceptación

1. CUANDO el administrador solicita exportar el menú, EL Sistema_Menu DEBERÁ generar un archivo CSV con las columnas: id, nombre, descripción, precio, categoría, imagen, disponible.
2. CUANDO el administrador importa un archivo CSV, EL Sistema_Menu DEBERÁ validar que cada fila contenga al menos los campos "name" y "price" con valores válidos.
3. SI una fila del CSV tiene campos requeridos faltantes o tipos de datos inválidos, ENTONCES EL Sistema_Menu DEBERÁ omitir esa fila, registrar el error con el número de línea, y continuar procesando las filas restantes.
4. CUANDO el CSV contiene filas con un `_id` existente, EL Sistema_Menu DEBERÁ actualizar el producto existente en lugar de crear uno duplicado.
5. CUANDO el CSV contiene filas sin `_id`, EL Sistema_Menu DEBERÁ crear nuevos productos.
6. CUANDO la importación finaliza, EL Sistema_Menu DEBERÁ retornar un resumen con la cantidad de productos creados, actualizados, y la lista de errores por fila.
7. CUANDO el administrador sube una imagen para un producto, EL Sistema_Menu DEBERÁ validar que el archivo sea una imagen (jpg, jpeg, png, webp) de máximo 5MB.
8. SI la imagen no cumple con el formato o tamaño permitido, ENTONCES EL Sistema_Menu DEBERÁ rechazar la subida con un error de validación (HTTP 422).
9. CUANDO la imagen se sube exitosamente, EL Sistema_Menu DEBERÁ almacenar el archivo y actualizar el campo `image_url` del producto con una URL accesible.

### Requisito 11: Inventario/Recetas/Proveedores — Repoblar datos desde FUDO

**Historia de Usuario:** Como administrador, quiero repoblar los datos de inventario, recetas y proveedores desde los archivos de FUDO, para poder tener la información base del negocio en el sistema.

#### Criterios de Aceptación

1. CUANDO el administrador ejecuta la repoblación de datos, EL Sistema_Inventario DEBERÁ importar ingredientes, recetas y proveedores desde los archivos FUDO (formato xlsx) a MongoDB.
2. CUANDO se importan datos de FUDO, EL Sistema_Inventario DEBERÁ validar la integridad de los datos antes de insertarlos en la base de datos.

### Requisito 12: Clientes — Vista mejorada

**Historia de Usuario:** Como administrador, quiero ver información detallada de cada cliente (total de órdenes, total gastado, tipo de venta), para poder entender mejor a mis clientes.

#### Criterios de Aceptación

1. CUANDO el administrador accede a la vista de clientes, EL Sistema_Clientes DEBERÁ mostrar para cada cliente: total de órdenes, total gastado, y fecha de última orden.
2. EL Sistema_Clientes DEBERÁ garantizar que `total_orders` sea igual al conteo de órdenes donde `customer_id` coincide con el ID del cliente.
3. EL Sistema_Clientes DEBERÁ garantizar que `total_spent` sea igual a la suma del campo `total` de todas las órdenes donde `customer_id` coincide con el ID del cliente.
4. CUANDO se muestra un cliente, EL Sistema_Clientes DEBERÁ incluir el tipo de venta predominante del cliente (local, delivery, o app).

### Requisito 13: Insights — Google Maps reviews e Insights de ventas

**Historia de Usuario:** Como administrador, quiero ver reviews de Google Maps e insights de ventas, para poder entender la percepción del cliente y tendencias del negocio.

#### Criterios de Aceptación

1. CUANDO el administrador accede a la vista de Insights, EL Sistema_Insights DEBERÁ mostrar reviews recientes de Google Maps del restaurante.
2. CUANDO el administrador accede a la vista de Insights, EL Sistema_Insights DEBERÁ mostrar métricas de tendencias de ventas basadas en datos de MongoDB.

### Requisito 14: Promociones — Conectar a base de datos

**Historia de Usuario:** Como administrador, quiero que las promociones estén conectadas a la base de datos, para poder crear, editar y activar promociones que se apliquen a las órdenes.

#### Criterios de Aceptación

1. CUANDO el administrador crea una promoción, EL Sistema_Promociones DEBERÁ almacenarla en la colección `promotions` de MongoDB.
2. CUANDO el administrador lista las promociones, EL Sistema_Promociones DEBERÁ consultar la colección `promotions` de MongoDB y mostrar los datos reales.
3. CUANDO el administrador edita o elimina una promoción, EL Sistema_Promociones DEBERÁ actualizar o eliminar el registro correspondiente en MongoDB.

### Requisito 15: Reportes — UI completa con gráficas

**Historia de Usuario:** Como administrador, quiero ver reportes visuales con gráficas de ventas por período, para poder analizar el rendimiento del negocio.

#### Criterios de Aceptación

1. CUANDO el administrador accede a Reportes, EL Sistema_Reportes DEBERÁ mostrar filtros de período: Hoy, Semana, Mes, Año, y rango personalizado.
2. CUANDO se selecciona un período, EL Sistema_Reportes DEBERÁ mostrar gráficas de ventas por día/semana/mes según corresponda.
3. CUANDO se genera un reporte de ventas, EL Sistema_Reportes DEBERÁ mostrar métricas: total de órdenes, ingreso total, ticket promedio, mejor cliente, mejor producto, peor producto, y mejor promoción.
4. CUANDO se muestran los productos en el reporte, EL Sistema_Reportes DEBERÁ listar los productos más vendidos y los menos vendidos con cantidad y revenue.
5. CUANDO se genera un reporte, EL Sistema_Reportes DEBERÁ desglosar las ventas por fuente (canal de venta) y por tipo de servicio.

### Requisito 16: Gastos — Plataforma de registro

**Historia de Usuario:** Como administrador, quiero registrar los gastos operativos del restaurante, para poder llevar un control financiero del negocio.

#### Criterios de Aceptación

1. CUANDO el administrador crea un gasto, EL Sistema_Gastos DEBERÁ almacenarlo en la colección `expenses` de MongoDB con los campos: descripción, monto, categoría, fecha, método de pago, notas, y usuario creador.
2. EL Sistema_Gastos DEBERÁ validar que la descripción tenga máximo 255 caracteres, el monto sea numérico y mayor a cero, la categoría sea una de las permitidas, y la fecha esté en formato ISO.
3. EL Sistema_Gastos DEBERÁ permitir únicamente las categorías: ingredientes, servicios, personal, alquiler, marketing, y otros.
4. CUANDO el administrador lista los gastos, EL Sistema_Gastos DEBERÁ consultar MongoDB y mostrar los gastos con opción de filtrar por período y categoría.
5. CUANDO el administrador edita un gasto, EL Sistema_Gastos DEBERÁ actualizar el registro en MongoDB manteniendo las mismas validaciones.
6. CUANDO el administrador elimina un gasto, EL Sistema_Gastos DEBERÁ remover el registro de MongoDB.
7. CUANDO el administrador solicita un resumen de gastos, EL Sistema_Gastos DEBERÁ retornar el total de gastos agrupado por categoría para el período seleccionado.

### Requisito 17: Revenue — Cálculo Ventas menos Gastos

**Historia de Usuario:** Como administrador, quiero ver el revenue (ingresos netos) calculado como Ventas menos Gastos, para poder conocer la rentabilidad real del negocio.

#### Criterios de Aceptación

1. CUANDO el administrador consulta el revenue, EL Sistema_Revenue DEBERÁ calcular `revenue = total_ventas - total_gastos` para el período seleccionado.
2. EL Sistema_Revenue DEBERÁ soportar los períodos: hoy, semana, mes, y año.
3. CUANDO se genera el reporte de revenue, EL Sistema_Revenue DEBERÁ incluir un desglose diario donde cada día muestra ventas, gastos, y revenue de ese día.
4. EL Sistema_Revenue DEBERÁ garantizar que la suma del revenue diario del desglose sea igual al revenue total del período.
5. EL Sistema_Revenue DEBERÁ excluir órdenes con estado "cancelled" del cálculo de ventas totales.

# Documento de Requisitos de Bugfix — v2.4.1 Admin Fixes

## Introducción

Tras la revisión del despliegue v2.4.0, se identificaron múltiples defectos en el panel de administración que afectan la usabilidad y la precisión de los datos mostrados. Los problemas abarcan: controles de paginación mal posicionados o ausentes en Clientes, Inventario y Gastos; orden incorrecto de categorías en el menú público; horas incorrectas en Caja por falta de conversión de timezone; ausencia de modal de detalle al hacer clic en una venta; KPIs del Dashboard que no calculan datos semanales ni filtran clientes nuevos correctamente; y la necesidad de actualizar la versión a v2.4.1.

## Análisis de Bugs

### Comportamiento Actual (Defecto)

1.1 CUANDO el usuario accede a la página de Clientes ENTONCES el selector "Por página" y los botones de paginación (Anterior/Siguiente) se muestran debajo de la tabla, obligando al usuario a hacer scroll hasta el final para cambiar de página

1.2 CUANDO el usuario accede a la página de Inventario y hay más de una página de resultados ENTONCES los controles de paginación (Anterior/Siguiente) solo se muestran si `lastPage > 1`, pero están posicionados dentro del contenedor de la tabla en lugar de ser siempre visibles cuando hay múltiples páginas

1.3 CUANDO el usuario accede a la página de Gastos ENTONCES el sistema carga todos los gastos (3,581+) sin paginación, causando lentitud y dificultad para navegar los registros

1.4 CUANDO el usuario visita el menú público ENTONCES las categorías se ordenan alfabéticamente, mostrando "Bebidas" primero en lugar del orden lógico deseado por el negocio

1.5 CUANDO el menú público muestra el conteo de resultados ENTONCES muestra el total de items en la base de datos (111) en lugar de solo los items disponibles (available=true), que deberían ser 104

1.6 CUANDO el usuario ve los arqueos de caja en la tabla de historial ENTONCES las horas de apertura y cierre se muestran incorrectamente (ej: "9:00 a.m.") porque los timestamps almacenados en UTC no se convierten a la zona horaria America/Mexico_City antes de mostrarse

1.7 CUANDO el usuario hace clic en una fila de la tabla de Ventas ENTONCES no sucede nada — no hay handler de clic ni modal de detalle que muestre los productos, estatus y detalles de la orden

1.8 CUANDO el Dashboard muestra el KPI "Órdenes esta Semana" ENTONCES muestra 0 porque el backend `dashboard()` no calcula `orders_week` ni `sales_week` — solo calcula datos de hoy y del mes

1.9 CUANDO el Dashboard muestra el KPI "Nuevos Clientes" ENTONCES muestra el total de clientes (893) en lugar de los clientes registrados en los últimos 2 meses, porque `mapDashboardResponse` usa `total_customers` como fallback y el backend no envía `new_customers_week`

1.10 CUANDO el usuario ve la versión en el sidebar del admin ENTONCES muestra "v2.4.0" en lugar de "v2.4.1"

### Comportamiento Esperado (Correcto)

2.1 CUANDO el usuario accede a la página de Clientes ENTONCES el sistema DEBERÁ mostrar el selector "Por página" y los botones de paginación (Anterior/Siguiente) arriba de la tabla, junto a los filtros existentes, para acceso rápido sin necesidad de scroll

2.2 CUANDO el usuario accede a la página de Inventario y hay más de una página de resultados ENTONCES el sistema DEBERÁ mostrar los controles de paginación (Anterior/Siguiente) de forma visible y accesible, siempre que `lastPage > 1`

2.3 CUANDO el usuario accede a la página de Gastos ENTONCES el sistema DEBERÁ paginar los resultados con un selector de "Por página" arriba de la tabla, con controles de navegación (Anterior/Siguiente) y mostrando el número de página actual

2.4 CUANDO el usuario visita el menú público ENTONCES el sistema DEBERÁ ordenar las categorías en el siguiente orden fijo: Especialidades, Sopas y Ramen, Entradas, Kushiages, Makis, Makis Especiales, Yakimeshi, Yakisoba, Teppanyaki, Tempuras, Paquetes, Pastas Queen, Postres, Bebidas

2.5 CUANDO el menú público muestra el conteo de resultados ENTONCES el sistema DEBERÁ mostrar únicamente el conteo de items con `available=true`

2.6 CUANDO el usuario ve los arqueos de caja ENTONCES el sistema DEBERÁ convertir los timestamps de `opened_at` y `closed_at` de UTC a la zona horaria America/Mexico_City (UTC-6/UTC-5 según horario de verano) antes de mostrarlos

2.7 CUANDO el usuario hace clic en una fila de la tabla de Ventas ENTONCES el sistema DEBERÁ abrir un modal mostrando: los productos de la orden (items con nombre, cantidad y precio), el estatus de la orden, y los detalles generales del pedido (número de orden, fecha, cliente, total, método de pago)

2.8 CUANDO el Dashboard muestra el KPI "Órdenes esta Semana" ENTONCES el sistema DEBERÁ calcular y mostrar el número real de órdenes creadas desde el inicio de la semana actual (lunes), y el backend DEBERÁ incluir `orders_week` y `sales_week` en la respuesta del endpoint dashboard

2.9 CUANDO el Dashboard muestra el KPI "Nuevos Clientes" ENTONCES el sistema DEBERÁ mostrar el conteo de clientes registrados en los últimos 2 meses (60 días), no el total acumulado de clientes

2.10 CUANDO el usuario ve la versión en el sidebar del admin ENTONCES el sistema DEBERÁ mostrar "v2.4.1"

### Comportamiento Sin Cambios (Prevención de Regresiones)

3.1 CUANDO el usuario usa la búsqueda, filtros de tier y filtros de source en Clientes ENTONCES el sistema DEBERÁ CONTINUAR filtrando correctamente los resultados

3.2 CUANDO el usuario hace clic en un cliente en la tabla de Clientes ENTONCES el sistema DEBERÁ CONTINUAR abriendo el modal de detalle del cliente con su información, órdenes y productos favoritos

3.3 CUANDO el usuario busca ingredientes, ordena columnas o crea/edita ingredientes en Inventario ENTONCES el sistema DEBERÁ CONTINUAR funcionando correctamente con búsqueda, ordenamiento y CRUD

3.4 CUANDO el usuario crea, edita o elimina gastos ENTONCES el sistema DEBERÁ CONTINUAR permitiendo las operaciones CRUD de gastos sin afectación

3.5 CUANDO el usuario usa los filtros de período (Hoy, Semana, Mes, Año, Personalizado) en Gastos ENTONCES el sistema DEBERÁ CONTINUAR filtrando los gastos por período correctamente

3.6 CUANDO el usuario ve el resumen por categoría en Gastos ENTONCES el sistema DEBERÁ CONTINUAR mostrando el resumen con totales y porcentajes por categoría

3.7 CUANDO el menú público muestra items dentro de cada categoría ENTONCES el sistema DEBERÁ CONTINUAR mostrando los items ordenados por `sort_order` dentro de cada categoría

3.8 CUANDO el usuario abre o cierra caja, registra movimientos ENTONCES el sistema DEBERÁ CONTINUAR funcionando correctamente para todas las operaciones de caja

3.9 CUANDO el Dashboard muestra KPIs de "Ventas Hoy", "Ventas Mes" y "Órdenes Hoy" ENTONCES el sistema DEBERÁ CONTINUAR calculando estos valores correctamente

3.10 CUANDO el Dashboard muestra "Top Items" con el fallback de menú (sin órdenes POS) ENTONCES el sistema DEBERÁ CONTINUAR mostrando items del menú con "0 uds" y la nota "Sin datos de productos — basado en menú"

3.11 CUANDO el usuario filtra ventas por cliente o cambia la paginación en Ventas ENTONCES el sistema DEBERÁ CONTINUAR filtrando y paginando correctamente

3.12 CUANDO el selector "Por página" en Inventario está arriba con opciones 200/400 ENTONCES el sistema DEBERÁ CONTINUAR mostrándolo en su posición actual sin cambios

# Documento de Diseño: Mealli Release Improvements

## Resumen

Mealli es la plataforma POS (Punto de Venta) para el restaurante Sushi Queen. Esta versión mayor aborda 11 áreas de mejora: Dashboard con datos reales de MongoDB, rediseño del POS (layout de mesas, filtros de canal, imágenes de productos, métodos de pago con manejo de efectivo), Delivery integrado al POS, mejoras en Ventas con filtros de cliente, KDS (Cocina) con WebSocket en tiempo real, Menú con edición masiva e imágenes, restauración de datos de Inventario/Recetas/Proveedores, mejoras en Clientes, nuevo módulo de Insights (Google Maps + analytics), Reportes completos con gráficas, y un nuevo módulo de Gastos con cálculo de rentabilidad.

El stack actual es React/Vite/TypeScript (frontend), Laravel/Lumen PHP (backend), y MongoDB. Los datos históricos provienen de archivos Fudo (DatosFudo/) y los productos del menú deben migrar desde el sitio web de Sushi Queen.

## Arquitectura

### Arquitectura General del Sistema

```mermaid
graph TD
    subgraph Frontend["Frontend (React/Vite/TypeScript)"]
        DASH[Dashboard]
        POS_UI[POS - Punto de Venta]
        KDS[Cocina KDS]
        MENU_MGR[Menu Manager]
        SALES[Ventas]
        CUST[Clientes]
        REPORTS[Reportes]
        EXPENSES[Gastos]
        INSIGHTS_UI[Insights]
        INV[Inventario/Recetas/Proveedores]
    end

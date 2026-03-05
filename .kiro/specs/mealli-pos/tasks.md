# MealLi POS - Tasks de Implementación

## Fase 1A: Eliminar Fudo + POS Core Interno

- [x] 1. Eliminar FudoService.php y config/fudo.php
- [x] 2. Refactorizar OrderController: quitar envío a Fudo, procesar órdenes internamente
- [x] 3. Agregar campos nuevos al modelo Order (order_number, payment_method, payment_status, type, tip, prepared_items, cash_register_id, table_id)
- [x] 4. Refactorizar WebhookController: eliminar lógica de Fudo, mantener solo WhatsApp
- [x] 5. Limpiar rutas API: eliminar rutas /fudo/*, /fudo/test-*, /fudo/sync-menu-public
- [x] 6. Actualizar frontend types: eliminar fudo_order_id, agregar nuevos campos de Order
- [x] 7. Crear POSService.php con lógica de generación de número de orden secuencial por día
- [x] 8. Actualizar OrderController.store() para usar POSService y generar order_number
- [x] 9. Quitar botón "Sincronizar con Fudo" del MenuManager.tsx
- [x] 10. Eliminar campo fudo_id del modelo MenuItem, agregar campos prices y available_hours

## Fase 1B: Caja y Arqueos

- [x] 11. Crear modelo CashRegister.php
- [x] 12. Crear CashRegisterController.php (open, close, movement, current, history)
- [x] 13. Crear rutas API para caja en routes/api.php
- [x] 14. Crear página frontend admin/CashRegister.tsx (abrir/cerrar caja, movimientos, arqueo)
- [x] 15. Integrar pagos de órdenes con caja (al pagar una orden, registrar movimiento en caja)
- [x] 16. Agregar ruta /admin/cash-register en App.tsx

## Fase 1C: Kitchen Display System (KDS)

- [x] 17. Crear KitchenController.php (listar órdenes activas, marcar items preparados)
- [x] 18. Crear rutas API para KDS
- [x] 19. Crear página frontend admin/Kitchen.tsx (vista de cocina con órdenes en tiempo real)
- [x] 20. Implementar polling cada 10s para actualizar órdenes en KDS
- [x] 21. Implementar timer por orden y alertas visuales
- [x] 22. Agregar ruta /admin/kitchen en App.tsx
- [x] 23. Agregar sonido de alerta para órdenes nuevas en admin (Dashboard + Kitchen)

## Fase 1D: POS - Punto de Venta (Mostrador)

- [x] 24. Crear página frontend admin/POS.tsx (interfaz rápida para crear órdenes desde mostrador)
- [x] 25. Implementar selección rápida de productos por categoría
- [x] 26. Implementar carrito rápido con modificadores
- [x] 27. Implementar cobro con selección de método de pago
- [x] 28. Integrar con caja abierta para registrar venta
- [x] 29. Agregar ruta /admin/pos en App.tsx

## Fase 2A: Inventario

- [x] 30. Crear modelo Ingredient.php
- [x] 31. Crear modelo InventoryMovement.php
- [x] 32. Crear InventoryController.php (CRUD ingredientes, movimientos, conteo)
- [x] 33. Crear InventoryService.php (lógica de descuento automático al vender)
- [x] 34. Crear rutas API para inventario
- [x] 35. Crear página frontend admin/Inventory.tsx
- [x] 36. Implementar alertas de stock bajo en Dashboard
- [x] 37. Agregar ruta /admin/inventory en App.tsx

## Fase 2B: Recetas

- [x] 38. Crear modelo Recipe.php
- [x] 39. Crear RecipeController.php (CRUD recetas, cálculo de costo)
- [x] 40. Crear rutas API para recetas
- [x] 41. Crear página frontend admin/Recipes.tsx
- [x] 42. Vincular recetas con descuento automático de inventario al crear orden
- [x] 43. Mostrar costo y margen en MenuManager
- [x] 44. Agregar ruta /admin/recipes en App.tsx

## Fase 3A: Gestión de Mesas

- [x] 45. Crear modelo Table.php
- [x] 46. Crear TableController.php (CRUD mesas, cambio estado, asignar orden)
- [x] 47. Crear rutas API para mesas
- [x] 48. Crear página frontend admin/Tables.tsx (mapa visual de mesas)
- [x] 49. Integrar mesas con órdenes (asignar mesa al crear orden)
- [x] 50. Agregar ruta /admin/tables en App.tsx

## Fase 3B: Proveedores

- [x] 51. Crear modelo Supplier.php
- [x] 52. Crear SupplierController.php (CRUD)
- [x] 53. Crear rutas API para proveedores
- [x] 54. Crear página frontend admin/Suppliers.tsx
- [x] 55. Vincular proveedores con ingredientes
- [x] 56. Agregar ruta /admin/suppliers en App.tsx

## Fase 3C: Reportes Avanzados

- [x] 57. Crear ReportController.php (ventas, productos, inventario, estado de resultados)
- [x] 58. Crear rutas API para reportes
- [x] 59. Crear página frontend admin/Reports.tsx con gráficos interactivos
- [x] 60. Implementar exportación CSV/PDF
- [x] 61. Agregar ruta /admin/reports en App.tsx

## Fase 4: Delivery y Extras

- [ ] 62. Agregar gestión de repartidores (modelo, controller, UI)
- [ ] 63. Implementar zonas de cobertura con costos de envío
- [ ] 64. Implementar tracking de entregas
- [ ] 65. Preparar estructura para facturación electrónica CFDI

#!/bin/bash

# Script para probar los endpoints de fallback JSON
# Asegúrate de que el backend esté corriendo: php artisan serve

echo "🧪 Probando endpoints de fallback JSON..."
echo ""

BASE_URL="http://localhost:8000/api"

# Test 1: Clientes
echo "1️⃣ Probando /admin/customers-json..."
curl -s "${BASE_URL}/admin/customers-json" | jq '.data | length' 2>/dev/null || echo "❌ Error"
echo ""

# Test 2: Órdenes
echo "2️⃣ Probando /admin/orders-json..."
curl -s "${BASE_URL}/admin/orders-json?per_page=5" | jq '.data | length' 2>/dev/null || echo "❌ Error"
echo ""

# Test 3: Menú
echo "3️⃣ Probando /admin/menu-json..."
curl -s "${BASE_URL}/admin/menu-json" | jq '.data | length' 2>/dev/null || echo "❌ Error"
echo ""

# Test 4: Ingredientes
echo "4️⃣ Probando /admin/ingredients-json..."
curl -s "${BASE_URL}/admin/ingredients-json" | jq '.data | length' 2>/dev/null || echo "❌ Error"
echo ""

# Test 5: Proveedores
echo "5️⃣ Probando /admin/suppliers-json..."
curl -s "${BASE_URL}/admin/suppliers-json" | jq '.data | length' 2>/dev/null || echo "❌ Error"
echo ""

# Test 6: Movimientos de caja
echo "6️⃣ Probando /admin/cash-register-json..."
curl -s "${BASE_URL}/admin/cash-register-json" | jq '.data | length' 2>/dev/null || echo "❌ Error"
echo ""

echo "✅ Pruebas completadas!"
echo ""
echo "📊 Resumen esperado:"
echo "  - Clientes: 901"
echo "  - Órdenes: 5 (con paginación)"
echo "  - Menú: ~200 productos únicos"
echo "  - Ingredientes: 178"
echo "  - Proveedores: 62"
echo "  - Movimientos de caja: 3,833"

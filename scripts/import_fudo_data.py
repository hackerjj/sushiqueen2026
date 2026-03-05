#!/usr/bin/env python3
"""
Script para importar datos de Fudo desde archivos Excel a JSON
"""
import pandas as pd
import json
import os
from datetime import datetime
import glob

def convert_to_serializable(obj):
    """Convierte objetos no serializables a string"""
    if pd.isna(obj):
        return None
    if isinstance(obj, (datetime, pd.Timestamp)):
        return obj.isoformat()
    if isinstance(obj, (pd.Int64Dtype, pd.Float64Dtype)):
        return float(obj) if not pd.isna(obj) else None
    return str(obj)

def convert_excel_to_json(excel_file, output_file):
    """Convierte un archivo Excel a JSON"""
    try:
        # Leer Excel
        df = pd.read_excel(excel_file)
        
        # Convertir a JSON con manejo de tipos
        data = json.loads(df.to_json(orient='records', date_format='iso', default_handler=str))
        
        # Guardar JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Convertido: {excel_file} -> {output_file} ({len(data)} registros)")
        return len(data)
    except Exception as e:
        print(f"✗ Error en {excel_file}: {str(e)}")
        return 0

def main():
    # Crear directorio de salida
    output_dir = 'backend/storage/app/fudo_data'
    os.makedirs(output_dir, exist_ok=True)
    
    total_records = 0
    
    # Clientes
    print("\n📋 Importando CLIENTES...")
    clientes_file = 'DatosFudo/clientes-63956-20260305-1-i5hlt5.xlsx'
    if os.path.exists(clientes_file):
        total_records += convert_excel_to_json(clientes_file, f'{output_dir}/clientes.json')
    
    # Ventas (todos los archivos)
    print("\n💰 Importando VENTAS...")
    ventas_files = glob.glob('DatosFudo/ventas*.xls') + glob.glob('DatosFudo/Reporte-Ventas*.xlsx')
    all_ventas = []
    for venta_file in ventas_files:
        try:
            df = pd.read_excel(venta_file)
            all_ventas.extend(df.to_dict('records'))
            print(f"  ✓ {venta_file}: {len(df)} registros")
        except Exception as e:
            print(f"  ✗ Error en {venta_file}: {str(e)}")
    
    if all_ventas:
        # Convertir a JSON serializable
        ventas_json = json.loads(pd.DataFrame(all_ventas).to_json(orient='records', date_format='iso', default_handler=str))
        with open(f'{output_dir}/ventas.json', 'w', encoding='utf-8') as f:
            json.dump(ventas_json, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Total ventas: {len(all_ventas)} registros")
        total_records += len(all_ventas)
    
    # Productos
    print("\n🍱 Importando PRODUCTOS...")
    productos_files = glob.glob('DatosFudo/productos*.xls') + glob.glob('DatosFudo/Reporte-Productos*.xlsx')
    all_productos = []
    for prod_file in productos_files:
        try:
            df = pd.read_excel(prod_file)
            all_productos.extend(df.to_dict('records'))
            print(f"  ✓ {prod_file}: {len(df)} registros")
        except Exception as e:
            print(f"  ✗ Error en {prod_file}: {str(e)}")
    
    if all_productos:
        productos_json = json.loads(pd.DataFrame(all_productos).to_json(orient='records', date_format='iso', default_handler=str))
        with open(f'{output_dir}/productos.json', 'w', encoding='utf-8') as f:
            json.dump(productos_json, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Total productos: {len(all_productos)} registros")
        total_records += len(all_productos)
    
    # Ingredientes
    print("\n🥬 Importando INGREDIENTES...")
    ingredientes_file = 'DatosFudo/ingredientes.xls'
    if os.path.exists(ingredientes_file):
        total_records += convert_excel_to_json(ingredientes_file, f'{output_dir}/ingredientes.json')
    
    # Proveedores
    print("\n🚚 Importando PROVEEDORES...")
    proveedores_file = 'DatosFudo/proveedores-63956-20260305-1-wnc3uh.xlsx'
    if os.path.exists(proveedores_file):
        total_records += convert_excel_to_json(proveedores_file, f'{output_dir}/proveedores.json')
    
    # Gastos
    print("\n💸 Importando GASTOS...")
    gastos_files = glob.glob('DatosFudo/gastos*.xlsx') + glob.glob('DatosFudo/Reporte-Gastos*.xlsx')
    all_gastos = []
    for gasto_file in gastos_files:
        try:
            df = pd.read_excel(gasto_file)
            all_gastos.extend(df.to_dict('records'))
            print(f"  ✓ {gasto_file}: {len(df)} registros")
        except Exception as e:
            print(f"  ✗ Error en {gasto_file}: {str(e)}")
    
    if all_gastos:
        gastos_json = json.loads(pd.DataFrame(all_gastos).to_json(orient='records', date_format='iso', default_handler=str))
        with open(f'{output_dir}/gastos.json', 'w', encoding='utf-8') as f:
            json.dump(gastos_json, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Total gastos: {len(all_gastos)} registros")
        total_records += len(all_gastos)
    
    # Movimientos de caja
    print("\n💵 Importando MOVIMIENTOS DE CAJA...")
    caja_files = glob.glob('DatosFudo/movimientos-de-caja*.xls')
    all_caja = []
    for caja_file in caja_files:
        try:
            df = pd.read_excel(caja_file)
            all_caja.extend(df.to_dict('records'))
            print(f"  ✓ {caja_file}: {len(df)} registros")
        except Exception as e:
            print(f"  ✗ Error en {caja_file}: {str(e)}")
    
    if all_caja:
        caja_json = json.loads(pd.DataFrame(all_caja).to_json(orient='records', date_format='iso', default_handler=str))
        with open(f'{output_dir}/movimientos_caja.json', 'w', encoding='utf-8') as f:
            json.dump(caja_json, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Total movimientos: {len(all_caja)} registros")
        total_records += len(all_caja)
    
    # Propinas
    print("\n💝 Importando PROPINAS...")
    propinas_files = glob.glob('DatosFudo/propinas*.xls')
    all_propinas = []
    for propina_file in propinas_files:
        try:
            df = pd.read_excel(propina_file)
            all_propinas.extend(df.to_dict('records'))
            print(f"  ✓ {propina_file}: {len(df)} registros")
        except Exception as e:
            print(f"  ✗ Error en {propina_file}: {str(e)}")
    
    if all_propinas:
        propinas_json = json.loads(pd.DataFrame(all_propinas).to_json(orient='records', date_format='iso', default_handler=str))
        with open(f'{output_dir}/propinas.json', 'w', encoding='utf-8') as f:
            json.dump(propinas_json, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Total propinas: {len(all_propinas)} registros")
        total_records += len(all_propinas)
    
    print(f"\n✅ IMPORTACIÓN COMPLETADA")
    print(f"📊 Total de registros importados: {total_records}")
    print(f"📁 Archivos JSON guardados en: {output_dir}/")

if __name__ == '__main__':
    main()

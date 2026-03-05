import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface SalesReport {
  period: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  by_source: { source: string; orders: number; revenue: number }[];
  by_type: { type: string; orders: number; revenue: number }[];
  by_payment: { method: string; orders: number; revenue: number }[];
  top_items: { name: string; quantity: number; revenue: number }[];
}

const Reports: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/insights?period=${period}`);
      const d = data.data;
      setReport({
        period,
        total_orders: d?.conversions?.total_orders || 0,
        total_revenue: d?.revenue?.total || 0,
        avg_order_value: d?.avg_order_value || 0,
        by_source: d?.revenue_by_source || [],
        by_type: [],
        by_payment: [],
        top_items: d?.top_items || [],
      });
    } catch {
      setReport(null);
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { if (isAuthenticated) fetchReport(); }, [fetchReport, isAuthenticated]);

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  const exportCSV = () => {
    if (!report) return;
    const rows = [['Producto', 'Cantidad', 'Ingreso']];
    report.top_items.forEach(i => rows.push([i.name, String(i.quantity), String(i.revenue)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reporte-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ];

  return (
    <AdminLayout title="Reportes">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {periods.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p.value ? 'bg-sushi-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={exportCSV} disabled={!report} className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Exportar CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{fmt(report.total_revenue)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500">Órdenes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{report.total_orders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500">Ticket Promedio</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(report.avg_order_value)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Source */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Ingresos por Canal</h3>
              {report.by_source.length > 0 ? (
                <div className="space-y-3">
                  {report.by_source.map(s => {
                    const pct = report.total_revenue > 0 ? (s.revenue / report.total_revenue * 100) : 0;
                    return (
                      <div key={s.source}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 capitalize">{s.source}</span>
                          <span className="font-medium">{fmt(s.revenue)} ({s.orders} órdenes)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-sushi-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-gray-400">Sin datos</p>}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Productos Más Vendidos</h3>
              {report.top_items.length > 0 ? (
                <div className="space-y-2">
                  {report.top_items.slice(0, 10).map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{i + 1}</span>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{item.quantity} uds</span>
                        <span className="text-gray-400 ml-2">{fmt(item.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">Sin datos</p>}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-400 py-12">No se pudieron cargar los reportes</p>
      )}
    </AdminLayout>
  );
};

export default Reports;

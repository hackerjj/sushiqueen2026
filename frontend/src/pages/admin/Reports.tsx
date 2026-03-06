import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface SalesReportData {
  total_orders: number;
  total_revenue: number;
  avg_ticket: number;
  best_customer: { name: string; total_spent: number; order_count: number } | null;
  best_product: { name: string; quantity: number; revenue: number } | null;
  worst_product: { name: string; quantity: number } | null;
  best_promotion: { title: string; usage_count: number; discount_type: string } | null;
  sales_by_day: { date: string; total: number; orders: number }[];
  sales_by_source: { source: string; total: number; orders: number }[];
  sales_by_type: { type: string; total: number; orders: number }[];
  top_products: { name: string; quantity: number; revenue: number }[];
  low_products: { name: string; quantity: number; revenue: number }[];
}

interface RevenueData {
  period: string;
  total_sales: number;
  total_expenses: number;
  revenue: number;
  breakdown: { date: string; sales: number; expenses: number; revenue: number }[];
}

const PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'custom', label: 'Personalizado' },
];

const sourceLabels: Record<string, string> = {
  tables: '🪑 Mesas',
  counter: '🏪 Mostrador',
  delivery: '🛵 Delivery',
  express: '⚡ Express',
  web: '🌐 Web',
  whatsapp: '💬 WhatsApp',
  unknown: '❓ Otro',
};

const typeLabels: Record<string, string> = {
  dine_in: '🍽️ En mesa',
  takeout: '🥡 Para llevar',
  delivery: '🛵 Delivery',
  express: '⚡ Express',
  unknown: '❓ Otro',
};

const Reports: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [report, setReport] = useState<SalesReportData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin/login');
  }, [isAuthenticated, navigate]);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = { period };
      if (period === 'custom') {
        if (customStart) params.start_date = customStart;
        if (customEnd) params.end_date = customEnd;
      }
      const [salesRes, revenueRes] = await Promise.all([
        api.get('/admin/reports/sales', { params }),
        api.get('/admin/reports/revenue', { params }),
      ]);
      setReport(salesRes.data.data);
      setRevenueData(revenueRes.data.data);
    } catch {
      setError('Error al cargar los reportes');
      setReport(null);
      setRevenueData(null);
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    if (isAuthenticated && (period !== 'custom' || (customStart && customEnd))) {
      fetchReport();
    }
  }, [fetchReport, isAuthenticated, period, customStart, customEnd]);

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportCSV = () => {
    if (!report) return;
    const rows = [['Producto', 'Cantidad', 'Ingreso']];
    report.top_products.forEach((i) =>
      rows.push([i.name, String(i.quantity), String(i.revenue)])
    );
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart helpers
  const maxDailySale = report
    ? Math.max(...report.sales_by_day.map((d) => d.total), 1)
    : 1;

  return (
    <AdminLayout title="Reportes">
      {/* Period Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-sushi-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          disabled={!report}
          className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="flex gap-4 mb-6 items-center">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-gray-400">a</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{fmt(report.total_revenue)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Órdenes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{report.total_orders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Promedio</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(report.avg_ticket)}</p>
            </div>
          </div>

          {/* Revenue Section */}
          {revenueData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💰 Revenue (Ventas − Gastos)</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Ventas</p>
                  <p className="text-xl font-bold text-green-600">{fmt(revenueData.total_sales)}</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Gastos</p>
                  <p className="text-xl font-bold text-red-500">{fmt(revenueData.total_expenses)}</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${revenueData.revenue >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Revenue</p>
                  <p className={`text-xl font-bold ${revenueData.revenue >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {revenueData.revenue < 0 ? '-' : ''}{fmt(Math.abs(revenueData.revenue))}
                  </p>
                </div>
              </div>

              {/* Revenue daily chart */}
              {revenueData.breakdown.length > 0 && (
                <>
                  <div className="flex items-end gap-1 h-32 overflow-x-auto mb-2">
                    {(() => {
                      const maxVal = Math.max(...revenueData.breakdown.map((d) => Math.max(d.sales, d.expenses)), 1);
                      return revenueData.breakdown.map((day) => {
                        const salesH = maxVal > 0 ? (day.sales / maxVal) * 100 : 0;
                        const expH = maxVal > 0 ? (day.expenses / maxVal) * 100 : 0;
                        return (
                          <div
                            key={day.date}
                            className="flex items-end gap-px flex-shrink-0 group"
                            style={{ minWidth: '16px' }}
                            title={`${day.date}\nVentas: ${fmt(day.sales)}\nGastos: ${fmt(day.expenses)}\nRevenue: ${fmt(day.revenue)}`}
                          >
                            <div
                              className="bg-green-400 rounded-t w-2"
                              style={{ height: `${Math.max(salesH, 2)}%`, minHeight: '2px' }}
                            />
                            <div
                              className="bg-red-400 rounded-t w-2"
                              style={{ height: `${Math.max(expH, 2)}%`, minHeight: '2px' }}
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-4">
                    <span>{revenueData.breakdown[0]?.date}</span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full inline-block" /> Ventas</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" /> Gastos</span>
                    </div>
                    <span>{revenueData.breakdown[revenueData.breakdown.length - 1]?.date}</span>
                  </div>

                  {/* Revenue breakdown table */}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Ver desglose diario ({revenueData.breakdown.length} días)
                    </summary>
                    <div className="overflow-x-auto mt-3 max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 text-gray-500 font-medium">Fecha</th>
                            <th className="text-right py-2 text-gray-500 font-medium">Ventas</th>
                            <th className="text-right py-2 text-gray-500 font-medium">Gastos</th>
                            <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueData.breakdown.map((day) => (
                            <tr key={day.date} className="border-b border-gray-50">
                              <td className="py-2 text-gray-600">{day.date}</td>
                              <td className="py-2 text-right text-green-600">{fmt(day.sales)}</td>
                              <td className="py-2 text-right text-red-500">{fmt(day.expenses)}</td>
                              <td className={`py-2 text-right font-medium ${day.revenue >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {day.revenue < 0 ? '-' : ''}{fmt(Math.abs(day.revenue))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </>
              )}
            </div>
          )}

          {/* Highlight Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {report.best_customer && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">🏆 Mejor Cliente</p>
                <p className="font-semibold text-gray-900 mt-1 truncate">{report.best_customer.name}</p>
                <p className="text-sm text-gray-500">{fmt(report.best_customer.total_spent)} · {report.best_customer.order_count} órdenes</p>
              </div>
            )}
            {report.best_product && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">⭐ Mejor Producto</p>
                <p className="font-semibold text-gray-900 mt-1 truncate">{report.best_product.name}</p>
                <p className="text-sm text-gray-500">{report.best_product.quantity} uds · {fmt(report.best_product.revenue)}</p>
              </div>
            )}
            {report.worst_product && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">📉 Menos Vendido</p>
                <p className="font-semibold text-gray-900 mt-1 truncate">{report.worst_product.name}</p>
                <p className="text-sm text-gray-500">{report.worst_product.quantity} uds</p>
              </div>
            )}
            {report.best_promotion && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">🎯 Mejor Promoción</p>
                <p className="font-semibold text-gray-900 mt-1 truncate">{report.best_promotion.title}</p>
                <p className="text-sm text-gray-500">{report.best_promotion.usage_count} usos</p>
              </div>
            )}
          </div>

          {/* Sales by Day Chart */}
          {report.sales_by_day.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📊 Ventas por Día</h3>
              <div className="flex items-end gap-1 h-40 overflow-x-auto">
                {report.sales_by_day.map((day) => {
                  const height = maxDailySale > 0 ? (day.total / maxDailySale) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center flex-shrink-0 group"
                      style={{ minWidth: '20px' }}
                    >
                      <div className="relative w-full">
                        <div
                          className="bg-sushi-primary rounded-t hover:bg-sushi-accent transition-colors w-full"
                          style={{ height: `${Math.max(height, 2)}%`, minHeight: '2px' }}
                          title={`${day.date}: ${fmt(day.total)} (${day.orders} órdenes)`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{report.sales_by_day[0]?.date}</span>
                <span>{report.sales_by_day[report.sales_by_day.length - 1]?.date}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Source (Channel) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">📡 Ventas por Canal</h3>
              {report.sales_by_source.length > 0 ? (
                <div className="space-y-3">
                  {report.sales_by_source.map((s) => {
                    const pct = report.total_revenue > 0 ? (s.total / report.total_revenue) * 100 : 0;
                    return (
                      <div key={s.source}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            {sourceLabels[s.source] || s.source}
                          </span>
                          <span className="font-medium">
                            {fmt(s.total)} ({s.orders} órdenes)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-sushi-primary h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin datos</p>
              )}
            </div>

            {/* Sales by Type (Service Type) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">🍽️ Ventas por Tipo de Servicio</h3>
              {report.sales_by_type.length > 0 ? (
                <div className="space-y-3">
                  {report.sales_by_type.map((t) => {
                    const pct = report.total_revenue > 0 ? (t.total / report.total_revenue) * 100 : 0;
                    return (
                      <div key={t.type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            {typeLabels[t.type] || t.type}
                          </span>
                          <span className="font-medium">
                            {fmt(t.total)} ({t.orders} órdenes)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin datos</p>
              )}
            </div>
          </div>

          {/* Product Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">🏆 Productos Más Vendidos</h3>
              {report.top_products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">#</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Producto</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Cantidad</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Ingreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.top_products.map((item, i) => (
                        <tr key={item.name} className="border-b border-gray-50">
                          <td className="py-2.5 text-gray-400">{i + 1}</td>
                          <td className="py-2.5 font-medium text-gray-900">{item.name}</td>
                          <td className="py-2.5 text-right text-gray-600">{item.quantity}</td>
                          <td className="py-2.5 text-right font-medium text-green-600">{fmt(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin datos</p>
              )}
            </div>

            {/* Least Sold Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">📉 Productos Menos Vendidos</h3>
              {report.low_products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">#</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Producto</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Cantidad</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Ingreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.low_products.map((item, i) => (
                        <tr key={item.name} className="border-b border-gray-50">
                          <td className="py-2.5 text-gray-400">{i + 1}</td>
                          <td className="py-2.5 font-medium text-gray-900">{item.name}</td>
                          <td className="py-2.5 text-right text-gray-600">{item.quantity}</td>
                          <td className="py-2.5 text-right font-medium text-red-500">{fmt(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin datos</p>
              )}
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

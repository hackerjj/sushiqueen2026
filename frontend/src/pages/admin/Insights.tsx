import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

interface InsightsResponse {
  period: string;
  start_date: string;
  end_date: string;
  visits: { total: number; source: string };
  conversions: { total_orders: number; completed: number; cancelled: number; completion_rate: number };
  revenue: { total: number; subtotal: number; tax: number; order_count: number };
  revenue_by_source: { source: string; revenue: number; orders: number }[];
  customer_acquisition: { total_new: number; by_source: { source: string; new_customers: number }[] };
  orders_by_status: Record<string, number>;
  avg_order_value: number;
  top_items: { name: string; count: number; revenue: number }[];
}

const PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

const Insights: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/insights?period=${period}`);
      setData(res.data.data);
    } catch {
      setError('Error al cargar insights');
      setData({
        period,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        visits: { total: 1250, source: 'estimated' },
        conversions: { total_orders: 84, completed: 72, cancelled: 5, completion_rate: 85.7 },
        revenue: { total: 252000, subtotal: 208264, tax: 43736, order_count: 84 },
        revenue_by_source: [
          { source: 'web', revenue: 151200, orders: 50 },
          { source: 'whatsapp', revenue: 88200, orders: 30 },
          { source: 'facebook', revenue: 12600, orders: 4 },
        ],
        customer_acquisition: {
          total_new: 38,
          by_source: [
            { source: 'web', new_customers: 22 },
            { source: 'whatsapp', new_customers: 14 },
            { source: 'facebook', new_customers: 2 },
          ],
        },
        orders_by_status: { pending: 3, confirmed: 2, preparing: 1, ready: 1, delivered: 72, cancelled: 5 },
        avg_order_value: 3000,
        top_items: [
          { name: 'Dragon Roll', count: 45, revenue: 126000 },
          { name: 'Philadelphia Roll', count: 38, revenue: 91200 },
          { name: 'Combo Familiar', count: 22, revenue: 165000 },
          { name: 'Spicy Tuna Roll', count: 18, revenue: 46800 },
          { name: 'Nigiri Salmón x5', count: 15, revenue: 33000 },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

  const sourceEmoji: Record<string, string> = {
    web: '🌐',
    whatsapp: '💬',
    facebook: '📘',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-sushi-secondary">
            📊 Insights & Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Métricas de rendimiento y conversión</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-sushi-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          {error} — mostrando datos de ejemplo
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sushi-primary" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Visitas</p>
              <p className="text-2xl font-bold text-sushi-secondary mt-1">{data.visits.total.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{data.visits.source}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Pedidos</p>
              <p className="text-2xl font-bold text-sushi-secondary mt-1">{data.conversions.total_orders}</p>
              <p className="text-xs text-green-500 mt-1">{data.conversions.completion_rate}% completados</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Revenue</p>
              <p className="text-2xl font-bold text-sushi-primary mt-1">{formatCurrency(data.revenue.total)}</p>
              <p className="text-xs text-gray-400 mt-1">{data.revenue.order_count} órdenes</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Promedio</p>
              <p className="text-2xl font-bold text-sushi-secondary mt-1">{formatCurrency(data.avg_order_value)}</p>
              <p className="text-xs text-gray-400 mt-1">por pedido</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card p-6">
              <h3 className="font-semibold text-sushi-secondary mb-4">Revenue por Canal</h3>
              <div className="space-y-3">
                {data.revenue_by_source.map((s) => {
                  const pct = data.revenue.total > 0 ? Math.round((s.revenue / data.revenue.total) * 100) : 0;
                  return (
                    <div key={s.source}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{sourceEmoji[s.source] || '📊'} {s.source}</span>
                        <span className="font-medium">{formatCurrency(s.revenue)} ({s.orders} pedidos)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-sushi-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-sushi-secondary mb-4">Nuevos Clientes ({data.customer_acquisition.total_new})</h3>
              <div className="space-y-3">
                {data.customer_acquisition.by_source.map((s) => {
                  const pct = data.customer_acquisition.total_new > 0 ? Math.round((s.new_customers / data.customer_acquisition.total_new) * 100) : 0;
                  return (
                    <div key={s.source}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{sourceEmoji[s.source] || '📊'} {s.source}</span>
                        <span className="font-medium">{s.new_customers} clientes</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-sushi-accent h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-sushi-secondary mb-4">🏆 Top Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">#</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Producto</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Cantidad</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_items.map((item, i) => (
                    <tr key={item.name} className="border-b border-gray-50">
                      <td className="py-3 text-gray-400">{i + 1}</td>
                      <td className="py-3 font-medium text-sushi-secondary">{item.name}</td>
                      <td className="py-3 text-right text-gray-600">{item.count}</td>
                      <td className="py-3 text-right font-medium text-sushi-primary">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Insights;
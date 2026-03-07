import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { mapDashboardResponse } from '../../utils/mapDashboardResponse';
import type { DashboardKPIs, Order } from '../../types';

const DASHBOARD_CACHE_KEY = 'dashboard_cache';

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<{ name: string; current_stock: number; min_stock: number; unit: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setConnectionError(null);

      const [dashRes, ordersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/orders', { params: { per_page: 10 } }),
      ]);

      const dashData = dashRes.data.data || dashRes.data;
      const ordersData = Array.isArray(ordersRes.data.data) ? ordersRes.data.data : [];
      const mapped = mapDashboardResponse(dashData);
      const stock = dashData?.low_stock_alerts || [];

      setKpis(mapped);
      setRecentOrders(ordersData.slice(0, 10));
      setLowStock(stock);

      try { localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({ kpis: mapped, recentOrders: ordersData.slice(0, 10), lowStock: stock })); } catch { /* */ }
    } catch {
      try {
        const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setKpis(parsed.kpis ?? null);
          setRecentOrders(parsed.recentOrders ?? []);
          setLowStock(parsed.lowStock ?? []);
          setConnectionError('Conexión limitada — mostrando datos en caché');
        } else {
          setConnectionError('Sin conexión a la base de datos');
        }
      } catch {
        setConnectionError('Sin conexión a la base de datos');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

  const kpiCards = kpis ? [
    { label: kpis.last_day_label ? `Ventas ${kpis.last_day_label}` : 'Ventas Hoy', value: formatCurrency(kpis.sales_today), color: 'bg-green-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Ventas Mes', value: formatCurrency(kpis.sales_month), color: 'bg-blue-500', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'Órdenes Hoy', value: kpis.orders_today.toString(), color: 'bg-sushi-primary', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Nuevos Clientes', value: kpis.new_customers_week.toString(), color: 'bg-sushi-accent', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  ] : [];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmada', preparing: 'Preparando',
    ready: 'Lista', delivered: 'Entregada', cancelled: 'Cancelada',
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sushi-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {connectionError && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{connectionError}</span>
        </div>
      )}
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Items</h3>
          {kpis?.top_items_note && (
            <p className="text-xs text-amber-600 mb-3">{kpis.top_items_note}</p>
          )}
          <div className="space-y-3">
            {kpis?.top_items?.filter(item => !item.name.startsWith('Venta #')).map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-sushi-accent' : i === 1 ? 'bg-gray-400' : 'bg-gray-300'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
                <span className="text-sm font-medium text-gray-900">{item.count} uds</span>
              </div>
            ))}
            {(!kpis?.top_items || kpis.top_items.filter(i => !i.name.startsWith('Venta #')).length === 0) && (
              <p className="text-sm text-gray-400">Sin datos aún</p>
            )}
          </div>
        </div>

        {/* Revenue by Source */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Ventas por Semana</h3>
          <div className="space-y-4">
            {[
              { label: 'Hoy', value: kpis?.sales_today || 0, max: kpis?.sales_month || 1 },
              { label: 'Semana', value: kpis?.sales_week || 0, max: kpis?.sales_month || 1 },
              { label: 'Mes', value: kpis?.sales_month || 0, max: kpis?.sales_month || 1 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(row.value)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-sushi-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((row.value / row.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Source */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Órdenes esta Semana</h3>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-4xl font-bold text-sushi-primary">{kpis?.orders_week || 0}</p>
              <p className="text-sm text-gray-500 mt-1">órdenes totales</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['web', 'whatsapp', 'facebook'].map((src) => (
              <div key={src} className="text-center bg-gray-50 rounded-lg py-2">
                <p className="text-xs text-gray-500 capitalize">{src}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-red-800 mb-2">Alertas de Stock Bajo ({lowStock.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {lowStock.map((item: any, i: number) => (
              <div key={i} className="bg-white rounded-lg px-3 py-2 border border-red-100">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-red-600">{item.current_stock} {item.unit} (min: {item.min_stock})</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ventas Recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Ventas Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Tipo de Venta</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const typeLabels: Record<string, string> = { dine_in: 'Local', takeout: 'Mostrador', delivery: 'Delivery' };
                return (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{order.order_number || order._id.slice(-6).toUpperCase()}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(order.created_at).toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                    <td className="px-5 py-3 text-gray-700">{(order as any).customer?.name || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{typeLabels[order.type] || order.type || order.source}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabels[order.status] || order.status}</span></td>
                    <td className="px-5 py-3 font-medium text-gray-900 text-right">${formatCurrency(order.total)}</td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No hay ventas recientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;

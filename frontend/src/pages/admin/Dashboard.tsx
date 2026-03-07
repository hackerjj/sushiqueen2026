import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { mapDashboardResponse } from '../../utils/mapDashboardResponse';
import type { DashboardKPIs, Order } from '../../types';

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterDay, setFilterDay] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setConnectionError(null);
      const params: Record<string, string> = {};
      if (filterYear) {
        const y = parseInt(filterYear), m = filterMonth ? parseInt(filterMonth) : 0, d = filterDay ? parseInt(filterDay) : 0;
        if (d > 0 && m > 0) {
          const ds = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          params.from = ds; params.to = ds;
        } else if (m > 0) {
          params.from = `${y}-${String(m).padStart(2,'0')}-01`;
          params.to = `${y}-${String(m).padStart(2,'0')}-${new Date(y, m, 0).getDate()}`;
        } else { params.from = `${y}-01-01`; params.to = `${y}-12-31`; }
      }
      const [dashRes, ordersRes] = await Promise.all([
        api.get('/admin/dashboard', { params }),
        api.get('/admin/orders', { params: { per_page: 10 } }),
      ]);
      const dashData = dashRes.data.data || dashRes.data;
      setKpis(mapDashboardResponse(dashData));
      setRecentOrders((Array.isArray(ordersRes.data.data) ? ordersRes.data.data : []).slice(0, 10));
    } catch {
      setConnectionError('Sin conexión a la base de datos');
    } finally { setLoading(false); }
  }, [filterYear, filterMonth, filterDay]);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [fetchData, isAuthenticated]);

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
  const daysInMonth = filterMonth && filterYear ? new Date(parseInt(filterYear), parseInt(filterMonth), 0).getDate() : 31;

  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800', preparing: 'bg-purple-100 text-purple-800', ready: 'bg-green-100 text-green-800', delivered: 'bg-gray-100 text-gray-800', cancelled: 'bg-red-100 text-red-800' };
  const statusLabels: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', preparing: 'Preparando', ready: 'Lista', delivered: 'Entregada', cancelled: 'Cancelada' };

  if (loading) return <AdminLayout title="Dashboard"><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div></AdminLayout>;

  return (
    <AdminLayout title="Dashboard">
      {connectionError && <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-3 mb-4 text-sm">{connectionError}</div>}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); setFilterDay(''); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Año</option><option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option><option value="2021">2021</option>
        </select>
        {filterYear && (
          <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setFilterDay(''); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Todo el año</option>
            {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => <option key={i} value={String(i+1)}>{m}</option>)}
          </select>
        )}
        {filterYear && filterMonth && (
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Todo el mes</option>
            {Array.from({ length: daysInMonth }, (_, i) => <option key={i} value={String(i+1)}>{i+1}</option>)}
          </select>
        )}
        <button onClick={fetchData} className="text-sushi-primary hover:text-red-700 text-sm font-medium">↻ Actualizar</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: kpis?.last_day_label ? `Ventas ${kpis.last_day_label}` : 'Ventas Hoy', value: fmt(kpis?.sales_today || 0), color: 'bg-green-500' },
          { label: 'Ventas Período', value: fmt(kpis?.sales_month || 0), color: 'bg-blue-500' },
          { label: 'Órdenes Período', value: String(kpis?.orders_week || 0), color: 'bg-sushi-primary' },
          { label: 'Clientes', value: String(kpis?.new_customers_week || 0), color: 'bg-sushi-accent' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Productos</h3>
          {kpis?.top_items_note && <p className="text-xs text-amber-600 mb-3">{kpis.top_items_note}</p>}
          <div className="space-y-2">
            {kpis?.top_items?.filter(i => !i.name.startsWith('Venta #')).slice(0, 10).map((item, i) => {
              const maxQ = kpis.top_items![0]?.count || 1;
              return (
                <div key={item.name} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${i < 3 ? 'bg-sushi-accent' : 'bg-gray-300'}`}>{i+1}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
                  <div className="w-24 bg-gray-100 rounded-full h-2"><div className="bg-sushi-primary h-2 rounded-full" style={{ width: `${(item.count / maxQ) * 100}%` }} /></div>
                  <span className="text-xs font-medium text-gray-600 w-12 text-right">{item.count}</span>
                </div>
              );
            })}
            {(!kpis?.top_items || kpis.top_items.length === 0) && <p className="text-sm text-gray-400">Sin datos</p>}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Ventas por Categoría</h3>
          {kpis?.sales_by_category && kpis.sales_by_category.length > 0 ? (
            <div className="space-y-2">
              {kpis.sales_by_category.slice(0, 10).map((cat) => {
                const maxRev = kpis.sales_by_category![0]?.revenue || 1;
                const total = kpis.sales_by_category!.reduce((s, c) => s + c.revenue, 0);
                const pct = total > 0 ? ((cat.revenue / total) * 100).toFixed(1) : '0';
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600 truncate">{cat.category}</span>
                      <span className="font-medium text-gray-900">{fmt(cat.revenue)} <span className="text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-sushi-primary h-2 rounded-full" style={{ width: `${(cat.revenue / maxRev) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-gray-400">Sin datos</p>}
        </div>
      </div>

      {/* Ventas Recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Ventas Recientes</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3 font-medium">ID</th><th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Cliente</th><th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Estado</th><th className="px-5 py-3 font-medium text-right">Total</th>
            </tr></thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{order.order_number || order._id.slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(order.created_at).toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  <td className="px-5 py-3 text-gray-700">{(order as any).customer?.name || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{{ dine_in:'Local', takeout:'Mostrador', delivery:'Delivery' }[order.type] || order.type || order.source}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabels[order.status] || order.status}</span></td>
                  <td className="px-5 py-3 font-medium text-gray-900 text-right">${fmt(order.total)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No hay ventas recientes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-semibold text-gray-900">Venta #{selectedOrder.order_number || selectedOrder._id.slice(-6).toUpperCase()}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Fecha:</span><p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p></div>
                <div><span className="text-gray-500">Estado:</span><p><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabels[selectedOrder.status] || selectedOrder.status}</span></p></div>
                <div><span className="text-gray-500">Cliente:</span><p className="font-medium">{(selectedOrder as any).customer?.name || '—'}</p></div>
                <div><span className="text-gray-500">Tipo:</span><p className="font-medium">{{ dine_in:'Local', takeout:'Mostrador', delivery:'Delivery' }[selectedOrder.type] || selectedOrder.type || '—'}</p></div>
                <div><span className="text-gray-500">Pago:</span><p className="font-medium">{({ cash:'Efectivo', card:'Tarjeta', transfer:'Transferencia' } as Record<string,string>)[(selectedOrder as any).payment_method] || (selectedOrder as any).payment_method || '—'}</p></div>
                <div><span className="text-gray-500">Fuente:</span><p className="font-medium">{selectedOrder.source || '—'}</p></div>
              </div>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Productos</h4>
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                    {selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="px-4 py-2 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          {item.modifiers && item.modifiers.length > 0 && <p className="text-xs text-gray-400">{item.modifiers.map((m: any) => m.name).join(', ')}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.quantity} × ${fmt(item.price)}</p>
                          <p className="text-xs text-gray-500">${fmt(item.quantity * item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedOrder.notes && <div><span className="text-gray-500 text-sm">Notas:</span><p className="text-sm">{selectedOrder.notes}</p></div>}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-xl text-sushi-primary">${fmt(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { Order, OrderStatus, ApiResponse } from '../../types';

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Lista' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  delivered: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const Orders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, per_page: 20 };
      if (filterStatus) params.status = filterStatus;
      if (filterSource) params.source = filterSource;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const { data } = await api.get<ApiResponse<Order[]>>('/admin/orders', { params });
      setOrders(Array.isArray(data.data) ? data.data : []);
      // Try to read pagination meta
      const meta = (data as any).meta;
      if (meta) {
        setTotalPages(meta.last_page || 1);
        setTotalOrders(meta.total || 0);
      } else {
        setTotalOrders(Array.isArray(data.data) ? data.data.length : 0);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, filterStatus, filterSource, dateFrom, dateTo]);

  useEffect(() => { if (isAuthenticated) fetchOrders(); }, [fetchOrders, isAuthenticated]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status } : o));
      if (detailOrder?._id === orderId) setDetailOrder({ ...detailOrder, status });
    } catch { /* ignore */ }
  };

  const formatCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AdminLayout title="Gestión de Órdenes">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
          <option value="">Todos los estados</option>
          {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
          <option value="">Todas las fuentes</option>
          <option value="web">Web</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="facebook">Facebook</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" placeholder="Desde" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" placeholder="Hasta" />
        <button onClick={fetchOrders} className="text-sushi-primary hover:text-red-700 text-sm font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Actualizar
        </button>
        <span className="text-sm text-gray-500 ml-auto">{totalOrders} órdenes</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Fuente</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{order._id.slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-3 text-gray-700">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border ${statusColors[order.status] || ''} cursor-pointer outline-none`}
                    >
                      {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className="capitalize text-gray-600">{order.source}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{new Date(order.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => setDetailOrder(order)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Ver detalle</button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No hay órdenes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
        </div>
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Orden #{detailOrder._id.slice(-6).toUpperCase()}</h3>
              <button onClick={() => setDetailOrder(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[detailOrder.status]}`}>
                  {statusOptions.find((s) => s.value === detailOrder.status)?.label}
                </span>
                <span className="text-sm text-gray-500 capitalize">{detailOrder.source}</span>
                <span className="text-sm text-gray-400 ml-auto">{new Date(detailOrder.created_at).toLocaleString('es-MX')}</span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
                <div className="space-y-2">
                  {detailOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-700">{item.quantity}x {item.name}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(detailOrder.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">IVA</span><span>{formatCurrency(detailOrder.tax)}</span></div>
                <div className="flex justify-between text-sm font-bold"><span>Total</span><span>{formatCurrency(detailOrder.total)}</span></div>
              </div>

              {detailOrder.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Notas</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{detailOrder.notes}</p>
                </div>
              )}

              {detailOrder.delivery_address && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Dirección</h4>
                  <p className="text-sm text-gray-600">{detailOrder.delivery_address}</p>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar estado</label>
                <select
                  value={detailOrder.status}
                  onChange={(e) => updateStatus(detailOrder._id, e.target.value as OrderStatus)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none"
                >
                  {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Orders;

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { Order, OrderStatus, Customer } from '../../types';

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
  { value: 'preparing', label: 'En cocina', color: 'bg-purple-100 text-purple-800' },
  { value: 'ready', label: 'Lista (2 min)', color: 'bg-green-100 text-green-800' },
  { value: 'delivering', label: 'En camino', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'Entregada', color: 'bg-gray-100 text-gray-600' },
];

const Delivery: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes] = await Promise.all([
        api.get('/admin/orders', { params: { type: 'delivery', status: 'pending,confirmed,preparing,ready,delivering' } }),
        api.get('/admin/customers')
      ]);
      setOrders(Array.isArray(ordersRes.data.data) ? ordersRes.data.data : []);
      setCustomers(Array.isArray(customersRes.data.data) ? customersRes.data.data : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [fetchData, isAuthenticated]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    } catch { /* ignore */ }
  };

  const filteredCustomers = search
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    : customers;

  const customerOrders = selectedCustomer
    ? orders.filter(o => o.customer_id === selectedCustomer)
    : orders;

  const fmt = (n: number) => `${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  return (
    <AdminLayout title="Gestión de Delivery">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Clientes</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-sushi-primary outline-none"
          />
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sushi-primary" /></div>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No hay clientes</p>
            ) : (
              filteredCustomers.map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCustomer(c._id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedCustomer === c._id
                      ? 'bg-sushi-primary/10 border-sushi-primary'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                  {c.address && <p className="text-xs text-gray-400 mt-1 truncate">{c.address}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{c.total_orders} órdenes</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-medium text-sushi-primary">{fmt(c.total_spent)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {selectedCustomer ? 'Órdenes del cliente' : 'Todas las órdenes de delivery'}
            </h3>
            {selectedCustomer && (
              <button
                onClick={() => setSelectedCustomer('')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Ver todas
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
          ) : customerOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-400">No hay órdenes de delivery</p>
            </div>
          ) : (
            customerOrders.map(order => {
              const customer = customers.find(c => c._id === order.customer_id);
              return (
                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs text-gray-500">#{order.order_number || order._id.slice(-6).toUpperCase()}</p>
                      <p className="font-medium text-gray-900">{customer?.name || 'Cliente'}</p>
                      <p className="text-sm text-gray-500">{customer?.phone}</p>
                      {order.delivery_address && (
                        <p className="text-xs text-gray-400 mt-1">📍 {order.delivery_address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{fmt(order.total)}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.quantity}x {item.name}</span>
                          <span className="text-gray-500">{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer outline-none ${
                        statusOptions.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusOptions.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {order.notes && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-yellow-800">📝 {order.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Delivery;

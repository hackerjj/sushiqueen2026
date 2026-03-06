import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

/** Build a map of customer_id → count of delivery orders */
function buildDeliveryCountMap(orders: Order[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const o of orders) {
    const cid = o.customer_id;
    if (cid) {
      map.set(cid, (map.get(cid) || 0) + 1);
    }
  }
  return map;
}

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
      let fetchedOrders: Order[] = [];
      let fetchedCustomers: Customer[] = [];

      // Try MongoDB endpoints first, fallback to JSON
      try {
        const [ordersRes, customersRes] = await Promise.all([
          api.get('/admin/orders', { params: { type: 'delivery' } }),
          api.get('/admin/customers'),
        ]);
        fetchedOrders = Array.isArray(ordersRes.data.data) ? ordersRes.data.data : [];
        fetchedCustomers = Array.isArray(customersRes.data.data) ? customersRes.data.data : [];
      } catch {
        // Fallback to JSON endpoints
        try {
          const [ordersRes, customersRes] = await Promise.all([
            api.get('/admin/orders-json', { params: { type: 'delivery' } }),
            api.get('/admin/customers-json'),
          ]);
          fetchedOrders = Array.isArray(ordersRes.data.data) ? ordersRes.data.data : [];
          fetchedCustomers = Array.isArray(customersRes.data.data) ? customersRes.data.data : [];
        } catch {
          /* both failed */
        }
      }

      // Filter to delivery orders only (in case backend doesn't filter)
      fetchedOrders = fetchedOrders.filter(
        (o) => o.type === 'delivery' || (o as any).source === 'delivery'
      );

      setOrders(fetchedOrders);
      setCustomers(fetchedCustomers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [fetchData, isAuthenticated]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    } catch { /* ignore */ }
  };

  // Map of customer_id → delivery order count
  const deliveryCountMap = useMemo(() => buildDeliveryCountMap(orders), [orders]);

  // Only show customers that have delivery orders, sorted by order count desc
  const customersWithDelivery = useMemo(() => {
    return customers
      .filter(c => deliveryCountMap.has(c._id))
      .sort((a, b) => (deliveryCountMap.get(b._id) || 0) - (deliveryCountMap.get(a._id) || 0));
  }, [customers, deliveryCountMap]);

  // Apply search filter on customers with delivery orders
  const filteredCustomers = search
    ? customersWithDelivery.filter(
        c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
      )
    : customersWithDelivery;

  // Filter orders by selected customer
  const customerOrders = selectedCustomer
    ? orders.filter(o => o.customer_id === selectedCustomer)
    : orders;

  const fmt = (n: number) => `${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  // Lookup helper for customer data
  const getCustomer = (customerId: string): Customer | undefined =>
    customers.find(c => c._id === customerId);

  const selectedCustomerData = selectedCustomer ? getCustomer(selectedCustomer) : undefined;

  return (
    <AdminLayout title="Gestión de Delivery">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Clientes con Delivery
            {!loading && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({customersWithDelivery.length})
              </span>
            )}
          </h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-sushi-primary outline-none"
          />
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sushi-primary" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No hay clientes con órdenes de delivery</p>
            ) : (
              filteredCustomers.map(c => {
                const deliveryCount = deliveryCountMap.get(c._id) || 0;
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelectedCustomer(selectedCustomer === c._id ? '' : c._id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedCustomer === c._id
                        ? 'bg-sushi-primary/10 border-sushi-primary'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500">📞 {c.phone}</p>
                    {c.address && <p className="text-xs text-gray-400 mt-1 truncate">📍 {c.address}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">🛵 {deliveryCount} delivery</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium text-sushi-primary">${fmt(c.total_spent)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {selectedCustomerData
                ? `Órdenes de ${selectedCustomerData.name}`
                : 'Todas las órdenes de delivery'}
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({customerOrders.length})
              </span>
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

          {/* Selected customer info banner */}
          {selectedCustomerData && (
            <div className="bg-sushi-primary/5 border border-sushi-primary/20 rounded-xl p-4 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{selectedCustomerData.name}</p>
                <p className="text-sm text-gray-600">📞 {selectedCustomerData.phone}</p>
                {selectedCustomerData.address && (
                  <p className="text-sm text-gray-500 truncate">📍 {selectedCustomerData.address}</p>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-500">{selectedCustomerData.total_orders} órdenes totales</p>
                <p className="font-medium text-sushi-primary">${fmt(selectedCustomerData.total_spent)} gastado</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" />
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-400">No hay órdenes de delivery</p>
            </div>
          ) : (
            customerOrders.map(order => {
              const customer = getCustomer(order.customer_id);
              return (
                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs text-gray-500">
                        #{order.order_number || order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="font-medium text-gray-900">{customer?.name || 'Cliente'}</p>
                      {customer?.phone && (
                        <p className="text-sm text-gray-500">📞 {customer.phone}</p>
                      )}
                      {(order.delivery_address || customer?.address) && (
                        <p className="text-xs text-gray-400 mt-1">
                          📍 {order.delivery_address || customer?.address}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${fmt(order.total)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.quantity}x {item.name}</span>
                          <span className="text-gray-500">${fmt(item.price * item.quantity)}</span>
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

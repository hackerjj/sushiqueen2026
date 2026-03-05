import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { Customer, ApiResponse, PaginatedResponse, Order } from '../../types';

const tierColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  regular: 'bg-blue-100 text-blue-700',
  gold: 'bg-yellow-100 text-yellow-800',
  vip: 'bg-purple-100 text-purple-800',
};

const tierLabels: Record<string, string> = {
  new: 'Nuevo', regular: 'Regular', gold: 'Gold', vip: 'VIP',
};

interface CustomerDetail extends Customer {
  orders?: Order[];
}

const Customers: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, per_page: 15 };
      if (search) params.search = search;
      if (filterTier) params.tier = filterTier;
      if (filterSource) params.source = filterSource;

      // Try fallback endpoint first (JSON data from Fudo)
      try {
        const { data } = await api.get<PaginatedResponse<Customer>>('/admin/customers-json', { params });
        setCustomers(Array.isArray(data.data) ? data.data : []);
        if (data.meta) {
          setTotalPages(data.meta.last_page);
          setTotal(data.meta.total);
        } else {
          setTotal(Array.isArray(data.data) ? data.data.length : 0);
        }
        return;
      } catch {
        // If fallback fails, try MongoDB endpoint
        const { data } = await api.get<PaginatedResponse<Customer>>('/admin/customers', { params });
        setCustomers(Array.isArray(data.data) ? data.data : []);
        if (data.meta) {
          setTotalPages(data.meta.last_page);
          setTotal(data.meta.total);
        }
      }
    } catch {
      // Final fallback: try simple response
      try {
        const { data } = await api.get<ApiResponse<Customer[]>>('/admin/customers');
        setCustomers(Array.isArray(data.data) ? data.data : []);
        setTotal(Array.isArray(data.data) ? data.data.length : 0);
      } catch { /* ignore */ }
    } finally { setLoading(false); }
  }, [page, search, filterTier, filterSource]);

  useEffect(() => { if (isAuthenticated) fetchCustomers(); }, [fetchCustomers, isAuthenticated]);

  const openDetail = async (customer: Customer) => {
    setDetail({ ...customer });
    setEditMode(false);
    setDetailLoading(true);
    try {
      // Try fallback endpoint first
      try {
        const { data } = await api.get<ApiResponse<any>>(`/admin/customers-json/${customer._id}`);
        if (data.data) {
          setDetail({ ...data.data.customer || data.data, orders: data.data.orders || [] });
        } else {
          setDetail({ ...customer, orders: [] });
        }
      } catch {
        // If fallback fails, try MongoDB endpoint
        const { data } = await api.get<ApiResponse<any>>(`/admin/customers/${customer._id}`);
        if (data.data) {
          setDetail({ ...data.data.customer || data.data, orders: data.data.orders || [] });
        } else {
          setDetail({ ...customer, orders: [] });
        }
      }
    } catch {
      setDetail({ ...customer, orders: [] });
    } finally { 
      setDetailLoading(false); 
    }
  };

  const startEdit = () => {
    if (!detail) return;
    setEditForm({ name: detail.name, phone: detail.phone, email: detail.email, address: detail.address });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!detail) return;
    try {
      setSaving(true);
      await api.put(`/admin/customers/${detail._id}`, editForm);
      setDetail({ ...detail, ...editForm });
      setEditMode(false);
      fetchCustomers();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const formatCurrency = (n: number | undefined | null) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filtered = customers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <AdminLayout title="Gestión de Clientes">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none"
          />
        </div>
        <select value={filterTier} onChange={(e) => { setFilterTier(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
          <option value="">Todos los tiers</option>
          <option value="new">Nuevo</option>
          <option value="regular">Regular</option>
          <option value="gold">Gold</option>
          <option value="vip">VIP</option>
        </select>
        <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
          <option value="">Todas las fuentes</option>
          <option value="web">Web</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="facebook">Facebook</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">{total} clientes</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Teléfono</th>
                <th className="px-5 py-3 font-medium">Tier</th>
                <th className="px-5 py-3 font-medium">Fuente</th>
                <th className="px-5 py-3 font-medium">Órdenes</th>
                <th className="px-5 py-3 font-medium">Total Gastado</th>
                <th className="px-5 py-3 font-medium">Última Orden</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(c)}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[c.tier] || 'bg-gray-100 text-gray-600'}`}>
                      {tierLabels[c.tier] || c.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3 capitalize text-gray-600">{c.source}</td>
                  <td className="px-5 py-3 text-gray-900 font-medium">{c.total_orders}</td>
                  <td className="px-5 py-3 text-gray-900">{formatCurrency(c.total_spent)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('es-AR') : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No se encontraron clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Customer Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Detalle de Cliente</h3>
              <button onClick={() => { setDetail(null); setEditMode(false); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
              ) : editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                    <button onClick={saveEdit} disabled={saving} className="bg-sushi-primary hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-sushi-primary/10 flex items-center justify-center text-sushi-primary text-xl font-bold">
                        {detail.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{detail.name}</h4>
                        <p className="text-sm text-gray-500">{detail.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[detail.tier]}`}>
                            {tierLabels[detail.tier] || detail.tier}
                          </span>
                          <span className="text-xs text-gray-400 capitalize">{detail.source}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={startEdit} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{detail.total_orders}</p>
                      <p className="text-xs text-gray-500">Órdenes</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(detail.total_spent)}</p>
                      <p className="text-xs text-gray-500">Total Gastado</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(detail.ai_profile?.avg_order_value || 0)}</p>
                      <p className="text-xs text-gray-500">Ticket Promedio</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Información de Contacto</h5>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                      <p><span className="text-gray-500">Teléfono:</span> <span className="text-gray-900">{detail.phone}</span></p>
                      <p><span className="text-gray-500">Dirección:</span> <span className="text-gray-900">{detail.address || '—'}</span></p>
                      {detail.last_order_at && (
                        <p><span className="text-gray-500">Última orden:</span> <span className="text-gray-900">{new Date(detail.last_order_at).toLocaleDateString('es-AR')}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Preferences */}
                  {detail.preferences && detail.preferences.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Preferencias</h5>
                      <div className="flex flex-wrap gap-2">
                        {detail.preferences.map((p, i) => (
                          <span key={i} className="bg-sushi-accent/10 text-sushi-accent px-2 py-1 rounded-full text-xs font-medium">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Profile */}
                  {detail.ai_profile?.favorite_items && detail.ai_profile.favorite_items.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Items Favoritos (AI)</h5>
                      <div className="flex flex-wrap gap-2">
                        {detail.ai_profile.favorite_items.map((item, i) => (
                          <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order History */}
                  {detail.orders && detail.orders.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Historial de Órdenes ({detail.orders.length})</h5>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {detail.orders.map((order) => (
                          <div key={order._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-gray-500">#{order.order_number || order._id.slice(-6).toUpperCase()}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">{order.items?.length || 0} items • {order.type || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{formatCurrency(order.total)}</span>
                              <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('es-AR')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Customers;

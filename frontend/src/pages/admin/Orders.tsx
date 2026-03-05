import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface Venta {
  _id: string;
  order_number: number;
  created_at: string;
  closed_at: string | null;
  delivery_time_min: number | null;
  customer_name: string | null;
  type: string;
  total: number;
  payment_method: string;
  source: string;
  status: string;
}

type SortField = 'created_at' | 'order_number';
type SortDir = 'asc' | 'desc';

const Orders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVentas, setTotalVentas] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, per_page: perPage };
      
      try {
        const { data } = await api.get('/admin/orders-json', { params });
        const list = Array.isArray(data.data) ? data.data : [];
        setVentas(list);
        const meta = data.meta;
        if (meta) {
          setTotalPages(meta.last_page || 1);
          setTotalVentas(meta.total || list.length);
        } else {
          setTotalVentas(list.length);
        }
      } catch {
        const { data } = await api.get('/admin/orders', { params });
        const list = Array.isArray(data.data) ? data.data : [];
        setVentas(list);
        setTotalVentas(list.length);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, perPage]);

  useEffect(() => { if (isAuthenticated) fetchVentas(); }, [fetchVentas, isAuthenticated]);

  // Client-side sorting
  const sorted = [...ventas].sort((a, b) => {
    if (sortField === 'created_at') {
      const da = a.created_at || '';
      const db = b.created_at || '';
      return sortDir === 'desc' ? db.localeCompare(da) : da.localeCompare(db);
    }
    if (sortField === 'order_number') {
      return sortDir === 'desc' ? b.order_number - a.order_number : a.order_number - b.order_number;
    }
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-block">
      {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  const formatTime = (min: number | null) => {
    if (min === null || min === undefined) return '—';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  return (
    <AdminLayout title="Gestión de Ventas">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Mostrar:</label>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={400}>400</option>
          </select>
        </div>
        <button onClick={fetchVentas} className="text-sushi-primary hover:text-red-700 text-sm font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Actualizar
        </button>
        <span className="text-sm text-gray-500 ml-auto">{totalVentas.toLocaleString()} ventas totales</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-gray-900 select-none" onClick={() => toggleSort('order_number')}>
                    ID <SortIcon field="order_number" />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-gray-900 select-none" onClick={() => toggleSort('created_at')}>
                    Fecha Creación <SortIcon field="created_at" />
                  </th>
                  <th className="px-4 py-3 font-medium">Tiempo Entrega</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Tipo de Venta</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((v) => (
                  <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{v.order_number}</td>
                    <td className="px-4 py-2.5 text-gray-700 text-xs">{formatDate(v.created_at)}</td>
                    <td className="px-4 py-2.5">
                      {v.delivery_time_min !== null ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.delivery_time_min <= 30 ? 'bg-green-100 text-green-700' :
                          v.delivery_time_min <= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {formatTime(v.delivery_time_min)}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 text-xs">{v.customer_name || <span className="text-gray-400">Sin cliente</span>}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        v.type === 'Delivery' ? 'bg-indigo-100 text-indigo-700' :
                        v.type === 'Local' ? 'bg-green-100 text-green-700' :
                        v.type === 'Mostrador' ? 'bg-blue-100 text-blue-700' :
                        v.type?.includes('Efectivo') ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {v.type || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 text-right">{fmt(v.total)}</td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay ventas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
        </div>
      )}
    </AdminLayout>
  );
};

export default Orders;

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  customer_id?: string | null;
  type: string;
  total: number;
  payment_method: string;
  source: string;
  status: string;
}

interface CustomerOption {
  _id: string;
  name: string;
  phone: string;
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

  // Customer filter state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search customers as user types
  const searchCustomers = useCallback(async (term: string) => {
    if (term.length < 2) {
      setCustomerOptions([]);
      setShowDropdown(false);
      return;
    }
    setSearchingCustomers(true);
    try {
      const { data } = await api.get('/admin/customers', { params: { search: term, per_page: 10 } });
      const list: CustomerOption[] = (Array.isArray(data.data) ? data.data : []).map((c: any) => ({
        _id: c._id,
        name: c.name || '',
        phone: c.phone || '',
      }));
      setCustomerOptions(list);
      setShowDropdown(list.length > 0);
    } catch {
      setCustomerOptions([]);
    } finally {
      setSearchingCustomers(false);
    }
  }, []);

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    if (selectedCustomer) {
      setSelectedCustomer(null);
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchCustomers(value), 300);
  };

  const handleSelectCustomer = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowDropdown(false);
    setPage(1);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerOptions([]);
    setShowDropdown(false);
    setPage(1);
  };

  /** Parse MongoDB dates: handles UTCDateTime objects, ISO strings, and date strings */
  const parseMongoDate = (d: any): Date | null => {
    if (!d) return null;
    if (typeof d === 'string') {
      const parsed = new Date(d.replace(' ', 'T'));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof d === 'object' && d.$date) {
      const ts = d.$date.$numberLong || d.$date;
      const parsed = new Date(parseInt(String(ts)));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (d instanceof Date) return d;
    return null;
  };

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (selectedCustomer) { params.customer_name = selectedCustomer.name; }

      const { data } = await api.get('/admin/orders', { params });
      const list = Array.isArray(data.data) ? data.data : [];

      // Map MongoDB order format to Venta format
      const mapped: Venta[] = list.map((o: any) => {
        let deliveryTime: number | null = null;
        const createdDate = parseMongoDate(o.created_at);
        const closedDate = parseMongoDate(o.closed_at);
        if (createdDate && closedDate) {
          const diff = (closedDate.getTime() - createdDate.getTime()) / 60000;
          if (diff > 0 && diff < 1440) deliveryTime = Math.round(diff);
        }
        if (deliveryTime === null && o.delivery_time_min != null) {
          deliveryTime = o.delivery_time_min;
        }

        const typeMap: Record<string, string> = { dine_in: 'Local', takeout: 'Mostrador', delivery: 'Delivery' };
        return {
          _id: o._id,
          order_number: o.order_number || 0,
          created_at: o.created_at,
          closed_at: o.closed_at || o.updated_at,
          delivery_time_min: deliveryTime,
          customer_name: o.customer?.name || o.customer_name || null,
          type: typeMap[o.type] || o.type || o.channel || '—',
          total: o.total || 0,
          payment_method: o.payment_method || '',
          source: o.source || '',
          status: o.status || '',
        };
      });

      setVentas(mapped);
      const meta = data.meta;
      if (meta) { setTotalPages(meta.last_page || 1); setTotalVentas(meta.total || mapped.length); }
      else { setTotalVentas(mapped.length); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, perPage, selectedCustomer]);

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

  // Calculate accumulated total for filtered results
  const totalAcumulado = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

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
        {/* Customer search filter */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-sm text-gray-500 mr-1">Cliente:</label>
          <div className="inline-flex items-center">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => handleCustomerSearchChange(e.target.value)}
              placeholder="Buscar cliente..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none w-52"
            />
            {(selectedCustomer || customerSearch) && (
              <button
                onClick={handleClearCustomer}
                className="ml-1 text-gray-400 hover:text-gray-600 text-sm"
                title="Limpiar filtro"
              >
                ✕
              </button>
            )}
            {searchingCustomers && (
              <span className="ml-1 animate-spin text-gray-400 text-xs">⟳</span>
            )}
          </div>
          {showDropdown && customerOptions.length > 0 && (
            <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {customerOptions.map((c) => (
                <button
                  key={c._id}
                  onClick={() => handleSelectCustomer(c)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium text-gray-900">{c.name}</span>
                  {c.phone && <span className="text-gray-500 ml-2 text-xs">{c.phone}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

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

      {/* Selected customer banner with accumulated total */}
      {selectedCustomer && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-sm font-medium">
              Filtrando por: {selectedCustomer.name}
            </span>
            {selectedCustomer.phone && (
              <span className="text-blue-400 text-xs">({selectedCustomer.phone})</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-700 font-semibold">
              Total acumulado: {fmt(totalAcumulado)}
            </span>
            <span className="text-xs text-blue-500">
              {ventas.length} orden{ventas.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>
      )}

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

          {/* Accumulated total footer when customer is selected */}
          {selectedCustomer && ventas.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex justify-end">
              <span className="text-sm font-semibold text-gray-700">
                Total acumulado de {selectedCustomer.name}: <span className="text-green-700 text-base">{fmt(totalAcumulado)}</span>
              </span>
            </div>
          )}
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

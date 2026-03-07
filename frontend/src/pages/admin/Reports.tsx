import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

type Tab = 'ventas' | 'productos';

interface ProductSalesData {
  total_quantity: number;
  total_revenue: number;
  top_products: { name: string; quantity: number; revenue: number }[];
  by_category: { category: string; quantity: number; revenue: number }[];
  evolution: { month: string; quantity: number; revenue: number }[];
}

const Reports: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('productos');
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState('');
  const [loading, setLoading] = useState(true);
  // Productos tab
  const [prodData, setProdData] = useState<ProductSalesData | null>(null);
  // Ventas tab
  const [salesData, setSalesData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = { period: 'custom' };
    const y = parseInt(filterYear || String(new Date().getFullYear()));
    const m = filterMonth ? parseInt(filterMonth) : 0;
    if (m > 0) {
      params.start_date = `${y}-${String(m).padStart(2,'0')}-01`;
      params.end_date = `${y}-${String(m).padStart(2,'0')}-${new Date(y, m, 0).getDate()}`;
    } else {
      params.start_date = `${y}-01-01`;
      params.end_date = `${y}-12-31`;
    }
    return params;
  }, [filterYear, filterMonth]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = buildParams();
    try {
      if (tab === 'productos') {
        const { data } = await api.get('/admin/reports/product-sales', { params });
        setProdData(data.data);
      } else {
        const [s, r] = await Promise.all([
          api.get('/admin/reports/sales', { params }),
          api.get('/admin/reports/revenue', { params }),
        ]);
        setSalesData(s.data.data);
        setRevenueData(r.data.data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [tab, buildParams]);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [fetchData, isAuthenticated]);

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <AdminLayout title="Reportes">
      {/* Tabs + Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['ventas','productos'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-sushi-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
              {t === 'ventas' ? 'Ventas' : 'Productos'}
            </button>
          ))}
        </div>
        <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option><option value="2021">2021</option>
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Todo el año</option>
          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => <option key={i} value={String(i+1)}>{m}</option>)}
        </select>
        <button onClick={fetchData} className="text-sushi-primary hover:text-red-700 text-sm font-medium">↻ Actualizar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : tab === 'productos' && prodData ? (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-500">Total productos vendidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{prodData.total_quantity.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-500">Ingresos totales</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{fmt(prodData.total_revenue)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-500">Top producto</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{prodData.top_products[0]?.name || '—'}</p>
              <p className="text-xs text-gray-500">{prodData.top_products[0]?.quantity || 0} uds</p>
            </div>
          </div>

          {/* Top Products Table + Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Productos por cantidad de ventas</h3></div>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Bar chart */}
              <div className="p-5 border-r border-gray-100">
                <div className="space-y-2">
                  {prodData.top_products.slice(0, 10).map((p, i) => {
                    const maxQ = prodData.top_products[0]?.quantity || 1;
                    return (
                      <div key={p.name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-32 truncate text-right">{p.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4">
                          <div className="h-4 rounded-full transition-all" style={{ width: `${(p.quantity / maxQ) * 100}%`, backgroundColor: ['#E63946','#457B9D','#2A9D8F','#E9C46A','#264653','#F4A261','#606C38','#BC6C25','#023047','#8ECAE6'][i % 10] }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">{p.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="px-4 py-3 font-medium">#</th><th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium text-right">Cantidad</th><th className="px-4 py-3 font-medium text-right">Venta ($)</th>
                    <th className="px-4 py-3 font-medium text-right">%</th>
                  </tr></thead>
                  <tbody>
                    {prodData.top_products.slice(0, 15).map((p, i) => (
                      <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400">{i+1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-2.5 text-right">{p.quantity}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-green-600">{fmt(p.revenue)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{prodData.total_revenue > 0 ? ((p.revenue / prodData.total_revenue) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Evolution Chart */}
          {prodData.evolution.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Evolución de ventas por mes</h3>
              <div className="flex items-end gap-2 h-48">
                {prodData.evolution.map(e => {
                  const maxR = Math.max(...prodData.evolution.map(x => x.revenue), 1);
                  const [,m] = e.month.split('-');
                  return (
                    <div key={e.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <span className="text-[9px] text-gray-500">{e.revenue >= 1000 ? `${(e.revenue/1000).toFixed(0)}k` : Math.round(e.revenue)}</span>
                      <div className="w-full bg-sushi-primary/80 rounded-t transition-all" style={{ height: `${Math.max((e.revenue / maxR) * 100, 3)}%` }} />
                      <span className="text-[9px] text-gray-400">{monthNames[parseInt(m)-1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sales by Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Ventas por categoría</h3>
            <div className="space-y-2">
              {prodData.by_category.map((cat, i) => {
                const maxR = prodData.by_category[0]?.revenue || 1;
                const total = prodData.by_category.reduce((s, c) => s + c.revenue, 0);
                const pct = total > 0 ? ((cat.revenue / total) * 100).toFixed(1) : '0';
                const colors = ['#E63946','#457B9D','#2A9D8F','#E9C46A','#264653','#F4A261','#606C38','#BC6C25','#023047','#8ECAE6'];
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="text-sm text-gray-700 w-32 truncate">{cat.category}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div className="h-3 rounded-full transition-all" style={{ width: `${(cat.revenue / maxR) * 100}%`, backgroundColor: colors[i % colors.length] }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 text-right">{fmt(cat.revenue)}</span>
                    <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : tab === 'ventas' && salesData ? (
        <div className="space-y-6">
          {/* Ventas KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500">Total de ventas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{fmt(salesData.total_revenue)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500">Ventas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{salesData.total_orders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500">Promedio por venta</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(salesData.avg_ticket)}</p>
            </div>
            {revenueData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
                <p className="text-xs text-gray-500">Revenue</p>
                <p className={`text-2xl font-bold mt-1 ${revenueData.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(revenueData.revenue)}</p>
              </div>
            )}
          </div>

          {/* Sales by Day */}
          {salesData.sales_by_day?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Evolución de ventas</h3>
              <div className="flex items-end gap-1 h-40">
                {salesData.sales_by_day.map((d: any) => {
                  const max = Math.max(...salesData.sales_by_day.map((x: any) => x.total), 1);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.date}: ${fmt(d.total)}`}>
                      <div className="w-full bg-sushi-primary/80 rounded-t" style={{ height: `${Math.max((d.total / max) * 100, 2)}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>{salesData.sales_by_day[0]?.date}</span>
                <span>{salesData.sales_by_day[salesData.sales_by_day.length - 1]?.date}</span>
              </div>
            </div>
          )}

          {/* Sales by Type + Source */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {salesData.sales_by_type?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Origen de las ventas</h3>
                {salesData.sales_by_type.map((t: any) => {
                  const max = Math.max(...salesData.sales_by_type.map((x: any) => x.total), 1);
                  const labels: Record<string,string> = { dine_in: 'Mesas', takeout: 'Mostrador', delivery: 'Delivery' };
                  return (
                    <div key={t.type} className="mb-2">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-600">{labels[t.type] || t.type}</span>
                        <span className="font-medium">{fmt(t.total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(t.total / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {salesData.sales_by_source?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Medios de pago</h3>
                {salesData.sales_by_source.map((s: any) => {
                  const max = Math.max(...salesData.sales_by_source.map((x: any) => x.total), 1);
                  return (
                    <div key={s.source} className="mb-2">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-600">{s.source}</span>
                        <span className="font-medium">{fmt(s.total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="bg-sushi-primary h-3 rounded-full" style={{ width: `${(s.total / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-400 py-12">No se pudieron cargar los reportes</p>
      )}
    </AdminLayout>
  );
};

export default Reports;

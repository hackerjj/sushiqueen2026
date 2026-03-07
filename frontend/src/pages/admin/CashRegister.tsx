import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { CashRegister as CashRegisterType, CashMovementType, PaymentMethod } from '../../types';

const movementTypeLabels: Record<string, string> = {
  sale: 'Venta', expense: 'Gasto', withdrawal: 'Retiro', deposit: 'Depósito', tip: 'Propina',
};

const CashRegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentRegister, setCurrentRegister] = useState<CashRegisterType | null>(null);
  const [loading, setLoading] = useState(true);
  const [closeAmount, setCloseAmount] = useState(0);
  const [movementModal, setMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: 'expense' as CashMovementType,
    amount: 0,
    description: '',
    payment_method: 'cash' as PaymentMethod,
  });
  const [history, setHistory] = useState<CashRegisterType[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterMode, setFilterMode] = useState<'preset' | 'custom'>('preset');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchCurrent = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/cash-register/current');
      setCurrentRegister(data.data || null);
    } catch {
      setCurrentRegister(null);
    } finally { setLoading(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page: historyPage, per_page: 50 };
      if (filterStatus) params.status = filterStatus;
      if (filterMode === 'custom' && customFrom && customTo) {
        params.from = customFrom;
        params.to = customTo;
      } else if (filterYear) {
        const y = parseInt(filterYear);
        const m = filterMonth ? parseInt(filterMonth) : 0;
        if (m > 0) {
          params.from = `${y}-${String(m).padStart(2, '0')}-01`;
          const lastDay = new Date(y, m, 0).getDate();
          params.to = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
        } else {
          params.from = `${y}-01-01`;
          params.to = `${y}-12-31`;
        }
      }
      const { data } = await api.get('/admin/cash-register', { params });
      const list = Array.isArray(data.data) ? data.data : [];
      setHistory(list);
      if (data.meta) setHistoryTotalPages(data.meta.last_page || 1);
    } catch {
      try {
        const { data } = await api.get('/admin/cash-register/history');
        setHistory(Array.isArray(data.data) ? data.data : []);
      } catch { /* ignore */ }
    }
  }, [historyPage, filterStatus, filterYear, filterMonth, filterMode, customFrom, customTo]);

  useEffect(() => {
    if (isAuthenticated) { fetchCurrent(); fetchHistory(); }
  }, [fetchCurrent, fetchHistory, isAuthenticated]);

  const closeRegister = async () => {
    try {
      await api.post('/admin/cash-register/close', { actual_amount: closeAmount });
      setCloseAmount(0);
      fetchCurrent();
    } catch { /* ignore */ }
  };

  const addMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/cash-register/movement', movementForm);
      setMovementModal(false);
      setMovementForm({ type: 'expense', amount: 0, description: '', payment_method: 'cash' });
      fetchCurrent();
    } catch { /* ignore */ }
  };

  const fmt = (n: number) => `${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: any) => { if (!d) return '—'; try { let s = d; if (typeof d === 'object' && d.$date) s = typeof d.$date === 'string' ? d.$date : new Date(parseInt(d.$date.$numberLong || d.$date)).toISOString(); const dt = typeof s === 'string' ? new Date(s.replace(' ', 'T')) : new Date(s); if (isNaN(dt.getTime())) return '—'; return dt.toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit', timeZone: 'America/Mexico_City' }); } catch { return '—'; } };

  // Chart data: group history by day, sum expected_amount (sales)
  const chartData = useMemo(() => {
    const byDay: Record<string, number> = {};
    history.forEach(reg => {
      if (!reg.opened_at) return;
      try {
        let s: any = reg.opened_at;
        if (typeof s === 'object' && s.$date) s = typeof s.$date === 'string' ? s.$date : new Date(parseInt(s.$date.$numberLong || s.$date)).toISOString();
        const dt = typeof s === 'string' ? new Date(s.replace(' ', 'T')) : new Date(s);
        if (isNaN(dt.getTime())) return;
        const key = dt.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', timeZone: 'America/Mexico_City' });
        const amt = (reg as any).system_amount ?? reg.expected_amount ?? 0;
        byDay[key] = (byDay[key] || 0) + amt;
      } catch { /* skip */ }
    });
    return Object.entries(byDay).reverse().slice(0, 31).reverse();
  }, [history]);

  const totalPeriod = useMemo(() => history.reduce((sum, reg) => sum + ((reg as any).system_amount ?? reg.expected_amount ?? 0), 0), [history]);
  const maxBar = useMemo(() => Math.max(...chartData.map(([, v]) => v), 1), [chartData]);
  const hasFilter = filterYear || (filterMode === 'custom' && customFrom && customTo);

  if (loading) {
    return (
      <AdminLayout title="Caja">
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Caja">
      {/* Current register controls (only when open) */}
      {currentRegister && (
        <div className="space-y-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Monto Inicial</p>
              <p className="text-xl font-bold text-gray-900">${fmt(currentRegister.initial_amount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Ventas</p>
              <p className="text-xl font-bold text-green-600">${fmt(currentRegister.summary?.total_sales || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Gastos/Retiros</p>
              <p className="text-xl font-bold text-red-600">${fmt((currentRegister.summary?.total_expenses || 0) + (currentRegister.summary?.total_withdrawals || 0))}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Esperado en Caja</p>
              <p className="text-xl font-bold text-blue-600">${fmt(currentRegister.expected_amount)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500">Efectivo</p>
              <p className="text-lg font-bold">${fmt(currentRegister.summary?.total_cash || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500">Tarjeta</p>
              <p className="text-lg font-bold">${fmt(currentRegister.summary?.total_card || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500">Transferencia</p>
              <p className="text-lg font-bold">${fmt(currentRegister.summary?.total_transfer || 0)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setMovementModal(true)} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Registrar Movimiento</button>
            <button onClick={() => { setCloseAmount(currentRegister.expected_amount); }} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cerrar Caja</button>
          </div>
          {closeAmount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Arqueo de Caja</h3>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Monto Real en Caja</label>
                  <input type="number" min={0} step={0.01} value={closeAmount} onChange={(e) => setCloseAmount(parseFloat(e.target.value) || 0)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Diferencia</label>
                  <p className={`text-lg font-bold ${closeAmount - currentRegister.expected_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>${fmt(closeAmount - currentRegister.expected_amount)}</p>
                </div>
                <button onClick={closeRegister} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium ml-auto">Confirmar Cierre</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Movimientos del Turno</h3></div>
            <div className="divide-y divide-gray-50">
              {(currentRegister.movements || []).slice().reverse().map((mov, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mov.type === 'sale' ? 'bg-green-100 text-green-700' : mov.type === 'tip' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{movementTypeLabels[mov.type] || mov.type}</span>
                    <span className="text-sm text-gray-600 ml-2">{mov.description}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${['sale', 'deposit', 'tip'].includes(mov.type) ? 'text-green-600' : 'text-red-600'}`}>{['sale', 'deposit', 'tip'].includes(mov.type) ? '+' : '-'}${fmt(mov.amount)}</p>
                    <p className="text-xs text-gray-400">{mov.payment_method}</p>
                  </div>
                </div>
              ))}
              {(!currentRegister.movements || currentRegister.movements.length === 0) && (
                <p className="px-5 py-8 text-center text-gray-400 text-sm">No hay movimientos aún</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {movementModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Registrar Movimiento</h3>
              <button onClick={() => setMovementModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={addMovement} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value as CashMovementType })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="expense">Gasto</option><option value="withdrawal">Retiro</option><option value="deposit">Depósito</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monto</label><input type="number" min={0} step={0.01} required value={movementForm.amount} onChange={(e) => setMovementForm({ ...movementForm, amount: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><input required value={movementForm.description} onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label><select value={movementForm.payment_method} onChange={(e) => setMovementForm({ ...movementForm, payment_method: e.target.value as PaymentMethod })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option></select></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setMovementModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button><button type="submit" className="bg-sushi-primary hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Arqueos de Caja */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-lg">ARQUEOS DE CAJA</h3>
        </div>
        {/* Filters */}
        <div className="px-5 py-3 border-b flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => { setFilterMode('preset'); setCustomFrom(''); setCustomTo(''); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterMode === 'preset' ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600'}`}>Período</button>
            <button onClick={() => { setFilterMode('custom'); setFilterYear(''); setFilterMonth(''); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterMode === 'custom' ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600'}`}>Personalizado</button>
          </div>
          {filterMode === 'preset' ? (
            <>
              <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setHistoryPage(1); if (!e.target.value) setFilterMonth(''); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Año</option><option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
              </select>
              {filterYear && (
                <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setHistoryPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Mes</option>
                  <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
                  <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
                  <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
                  <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
                </select>
              )}
            </>
          ) : (
            <>
              <label className="text-sm text-gray-500">Desde</label>
              <input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setHistoryPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <label className="text-sm text-gray-500">Hasta</label>
              <input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setHistoryPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </>
          )}
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setHistoryPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Estado</option><option value="cerrado">Cerrado</option><option value="abierto">Abierto</option>
          </select>
          <button onClick={fetchHistory} className="text-sushi-primary hover:text-red-700 text-sm font-medium">↻ Actualizar</button>
        </div>

        {/* Bar chart + total */}
        {hasFilter && chartData.length > 0 && (
          <div className="px-5 py-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Ventas por día</h4>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total del período</p>
                <p className="text-xl font-bold text-sushi-primary">${fmt(totalPeriod)}</p>
              </div>
            </div>
            <div className="flex items-end gap-1 h-32">
              {chartData.map(([day, val]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[9px] text-gray-500 font-medium">${val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val)}</span>
                  <div className="w-full bg-sushi-primary/80 rounded-t" style={{ height: `${Math.max((val / maxBar) * 100, 2)}%` }} />
                  <span className="text-[8px] text-gray-400 truncate w-full text-center">{day}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="px-5 py-3 font-medium">Hora de apertura</th>
              <th className="px-5 py-3 font-medium">Hora de cierre</th>
              <th className="px-5 py-3 font-medium">Caja</th>
              <th className="px-5 py-3 font-medium text-right">Sistema</th>
              <th className="px-5 py-3 font-medium text-right">Usuario</th>
              <th className="px-5 py-3 font-medium text-right">Diferencia</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr></thead>
            <tbody>
              {history.map((reg) => {
                const sysAmt = (reg as any).system_amount ?? reg.expected_amount ?? 0;
                const usrAmt = (reg as any).user_amount ?? reg.actual_amount ?? reg.expected_amount ?? 0;
                const diff = (reg as any).difference ?? (usrAmt - sysAmt);
                return (
                  <tr key={reg._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{fmtDate(reg.opened_at)}</td>
                    <td className="px-5 py-3 text-gray-700">{fmtDate(reg.closed_at)}</td>
                    <td className="px-5 py-3 text-gray-600">{reg.name || 'Principal'}</td>
                    <td className="px-5 py-3 text-right font-medium">${fmt(sysAmt)}</td>
                    <td className="px-5 py-3 text-right font-medium">${fmt(usrAmt)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>${fmt(diff)}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${reg.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{reg.status === 'open' ? 'Abierto' : 'Cerrado'}</span></td>
                  </tr>
                );
              })}
              {history.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No hay arqueos de caja</td></tr>}
            </tbody>
          </table>
        </div>
        {historyTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t">
            <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">← Anterior</button>
            <span className="text-sm text-gray-600">Página {historyPage} de {historyTotalPages}</span>
            <button onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))} disabled={historyPage === historyTotalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Siguiente →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CashRegisterPage;

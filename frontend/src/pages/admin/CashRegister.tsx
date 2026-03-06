import React, { useEffect, useState, useCallback } from 'react';
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
  const [openAmount, setOpenAmount] = useState(0);
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
      const { data } = await api.get('/admin/cash-register', { params });
      const list = Array.isArray(data.data) ? data.data : [];
      setHistory(list);
      if (data.meta) setHistoryTotalPages(data.meta.last_page || 1);
    } catch {
      // Fallback to history endpoint
      try {
        const { data } = await api.get('/admin/cash-register/history');
        setHistory(Array.isArray(data.data) ? data.data : []);
      } catch { /* ignore */ }
    }
  }, [historyPage, filterStatus]);

  useEffect(() => {
    if (isAuthenticated) { fetchCurrent(); fetchHistory(); }
  }, [fetchCurrent, fetchHistory, isAuthenticated]);

  const openRegister = async () => {
    try {
      await api.post('/admin/cash-register/open', { initial_amount: openAmount });
      setOpenAmount(0);
      fetchCurrent();
    } catch { /* ignore */ }
  };

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

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: any) => { if (!d) return '—'; try { const dt = typeof d === 'string' ? new Date(d.replace(' ', 'T')) : new Date(d); if (isNaN(dt.getTime())) return '—'; return dt.toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }); } catch { return '—'; } };
  if (loading) {
    return (
      <AdminLayout title="Caja">
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Caja">
      {!currentRegister ? (
        /* No hay caja abierta */
        <div className="max-w-md mx-auto mt-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Abrir Caja</h2>
            <p className="text-sm text-gray-500 mb-6">Ingresa el monto inicial para comenzar el turno</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial</label>
              <input
                type="number" min={0} step={0.01} value={openAmount}
                onChange={(e) => setOpenAmount(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-center focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none"
                placeholder="$0.00"
              />
            </div>
            <button onClick={openRegister} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors">
              Abrir Caja
            </button>
            <button
              onClick={() => { fetchHistory(); }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Actualizar historial
            </button>
          </div>
        </div>
      ) : (
        /* Caja abierta */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Monto Inicial</p>
              <p className="text-xl font-bold text-gray-900">{fmt(currentRegister.initial_amount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Ventas</p>
              <p className="text-xl font-bold text-green-600">{fmt(currentRegister.summary?.total_sales || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Gastos/Retiros</p>
              <p className="text-xl font-bold text-red-600">{fmt((currentRegister.summary?.total_expenses || 0) + (currentRegister.summary?.total_withdrawals || 0))}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Esperado en Caja</p>
              <p className="text-xl font-bold text-blue-600">{fmt(currentRegister.expected_amount)}</p>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500">Efectivo</p>
              <p className="text-lg font-bold">{fmt(currentRegister.summary?.total_cash || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500">Tarjeta</p>
              <p className="text-lg font-bold">{fmt(currentRegister.summary?.total_card || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500">Transferencia</p>
              <p className="text-lg font-bold">{fmt(currentRegister.summary?.total_transfer || 0)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => setMovementModal(true)} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Registrar Movimiento
            </button>
            <button
              onClick={() => { setCloseAmount(currentRegister.expected_amount); }}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar Caja
            </button>
          </div>

          {/* Close register form */}
          {closeAmount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Arqueo de Caja</h3>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Monto Real en Caja</label>
                  <input
                    type="number" min={0} step={0.01} value={closeAmount}
                    onChange={(e) => setCloseAmount(parseFloat(e.target.value) || 0)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Diferencia</label>
                  <p className={`text-lg font-bold ${closeAmount - currentRegister.expected_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(closeAmount - currentRegister.expected_amount)}
                  </p>
                </div>
                <button onClick={closeRegister} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium ml-auto">
                  Confirmar Cierre
                </button>
              </div>
            </div>
          )}

          {/* Movements list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Movimientos del Turno</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {(currentRegister.movements || []).slice().reverse().map((mov, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      mov.type === 'sale' ? 'bg-green-100 text-green-700' :
                      mov.type === 'tip' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{movementTypeLabels[mov.type] || mov.type}</span>
                    <span className="text-sm text-gray-600 ml-2">{mov.description}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${['sale', 'deposit', 'tip'].includes(mov.type) ? 'text-green-600' : 'text-red-600'}`}>
                      {['sale', 'deposit', 'tip'].includes(mov.type) ? '+' : '-'}{fmt(mov.amount)}
                    </p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value as CashMovementType })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="expense">Gasto</option>
                  <option value="withdrawal">Retiro</option>
                  <option value="deposit">Depósito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input type="number" min={0} step={0.01} required value={movementForm.amount} onChange={(e) => setMovementForm({ ...movementForm, amount: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input required value={movementForm.description} onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select value={movementForm.payment_method} onChange={(e) => setMovementForm({ ...movementForm, payment_method: e.target.value as PaymentMethod })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMovementModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                <button type="submit" className="bg-sushi-primary hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Arqueos de Caja Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">ARQUEOS DE CAJA</h3>
          <button onClick={() => { setOpenAmount(0); }} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Nuevo arqueo de caja</button>
        </div>
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setHistoryPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Estado</option>
            <option value="cerrado">Cerrado</option>
            <option value="abierto">Abierto</option>
          </select>
          <button onClick={fetchHistory} className="text-sushi-primary hover:text-red-700 text-sm font-medium">↻ Actualizar</button>
        </div>
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
            <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
            <span className="text-sm text-gray-600">Página {historyPage} de {historyTotalPages}</span>
            <button onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))} disabled={historyPage === historyTotalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CashRegisterPage;

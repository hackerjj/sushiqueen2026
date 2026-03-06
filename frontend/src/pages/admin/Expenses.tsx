import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { Expense, ExpenseCategory, ApiResponse, PaymentMethod } from '../../types';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'ingredientes', label: 'Ingredientes' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'personal', label: 'Personal' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'otros', label: 'Otros' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
];

const PERIODS = [
  { value: '', label: 'Todos' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

const categoryColors: Record<string, string> = {
  ingredientes: 'bg-orange-100 text-orange-700',
  servicios: 'bg-blue-100 text-blue-700',
  personal: 'bg-purple-100 text-purple-700',
  alquiler: 'bg-green-100 text-green-700',
  marketing: 'bg-pink-100 text-pink-700',
  otros: 'bg-gray-100 text-gray-600',
};

interface ExpenseForm {
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  payment_method: PaymentMethod;
  receipt_url: string;
  notes: string;
}

const emptyForm: ExpenseForm = {
  description: '', amount: 0, category: 'otros', date: new Date().toISOString().slice(0, 10),
  payment_method: 'cash', receipt_url: '', notes: '',
};

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

const AdminExpenses: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [tab, setTab] = useState<'list' | 'summary'>('list');
  const [summary, setSummary] = useState<{ by_category: CategorySummary[]; total: number } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterCategory) params.category = filterCategory;
      if (filterPeriod) params.period = filterPeriod;
      const { data } = await api.get<ApiResponse<Expense[]>>('/admin/expenses', { params });
      setExpenses(Array.isArray(data.data) ? data.data : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [filterCategory, filterPeriod]);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const params: Record<string, string> = {};
      if (filterPeriod) params.period = filterPeriod;
      const { data } = await api.get('/admin/expenses/summary', { params });
      setSummary(data.data);
    } catch { /* ignore */ } finally { setSummaryLoading(false); }
  }, [filterPeriod]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExpenses();
      fetchSummary();
    }
  }, [fetchExpenses, fetchSummary, isAuthenticated]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (exp: Expense) => {
    setForm({
      description: exp.description, amount: exp.amount, category: exp.category,
      date: exp.date?.slice(0, 10) || '', payment_method: exp.payment_method,
      receipt_url: exp.receipt_url || '', notes: exp.notes || '',
    });
    setEditingId(exp._id);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, created_by: user?.name || 'admin' };
      if (editingId) {
        await api.put(`/admin/expenses/${editingId}`, payload);
      } else {
        await api.post('/admin/expenses', payload);
      }
      setModalOpen(false);
      fetchExpenses();
      fetchSummary();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/expenses/${id}`);
      setDeleteConfirm(null);
      fetchExpenses();
      fetchSummary();
    } catch { /* ignore */ }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <AdminLayout title="Gestión de Gastos">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => setTab('list')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'list' ? 'border-sushi-primary text-sushi-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Lista de Gastos
        </button>
        <button onClick={() => setTab('summary')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'summary' ? 'border-sushi-primary text-sushi-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Resumen por Categoría
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {tab === 'list' && (
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
              <option value="">Todas las categorías</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}
          <span className="text-sm text-gray-500">
            {tab === 'list' ? `${expenses.length} gastos — Total: $${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}
          </span>
        </div>
        <button onClick={openCreate} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Gasto
        </button>
      </div>

      {tab === 'list' && (
        <>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">Descripción</th>
                    <th className="px-5 py-3 font-medium">Monto</th>
                    <th className="px-5 py-3 font-medium">Categoría</th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Pago</th>
                    <th className="px-5 py-3 font-medium">Notas</th>
                    <th className="px-5 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{exp.description}</p>
                        {exp.created_by && <p className="text-xs text-gray-400">por {exp.created_by}</p>}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">${exp.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[exp.category] || categoryColors.otros}`}>
                          {CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{exp.date ? new Date(exp.date).toLocaleDateString('es-AR') : '—'}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {PAYMENT_METHODS.find(p => p.value === exp.payment_method)?.label || exp.payment_method}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 max-w-[150px] truncate">{exp.notes || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(exp)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                          {deleteConfirm === exp._id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(exp._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Sí</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 text-xs">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(exp._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No hay gastos registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'summary' && (
        <>
          {summaryLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
          ) : summary ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Total del Período</h3>
                <p className="text-3xl font-bold text-sushi-primary">${summary.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.by_category.filter(c => c.count > 0).map((cat) => (
                  <div key={cat.category} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[cat.category] || categoryColors.otros}`}>
                        {CATEGORIES.find(c => c.value === cat.category)?.label || cat.category}
                      </span>
                      <span className="text-xs text-gray-400">{cat.count} gastos</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${cat.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    {summary.total > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-sushi-primary rounded-full h-2" style={{ width: `${Math.round((cat.total / summary.total) * 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{Math.round((cat.total / summary.total) * 100)}% del total</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {summary.by_category.every(c => c.count === 0) && (
                <div className="text-center py-8 text-gray-400">No hay gastos en este período</div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No se pudo cargar el resumen</div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input required maxLength={255} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" placeholder="Ej: Compra de salmón" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                  <input type="number" required min={0.01} step={0.01} value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                  <select required value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
                    {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Notas adicionales..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Recibo (opcional)</label>
                <input value={form.receipt_url} onChange={(e) => setForm({ ...form, receipt_url: e.target.value })} placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-sushi-primary hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminExpenses;

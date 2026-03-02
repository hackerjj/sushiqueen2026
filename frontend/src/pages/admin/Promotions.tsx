import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { Promotion, ApiResponse, DiscountType } from '../../types';

interface PromoForm {
  title: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  code: string;
  starts_at: string;
  expires_at: string;
  active: boolean;
  max_usage: number;
  image_url: string;
}

const emptyForm: PromoForm = {
  title: '', description: '', discount_type: 'percentage', discount_value: 0,
  code: '', starts_at: '', expires_at: '', active: true, max_usage: 0, image_url: '',
};

const getPromoStatus = (promo: Promotion): { label: string; color: string } => {
  const now = new Date();
  const starts = new Date(promo.starts_at);
  const expires = new Date(promo.expires_at);
  if (!promo.active) return { label: 'Inactiva', color: 'bg-gray-100 text-gray-600' };
  if (now < starts) return { label: 'Próxima', color: 'bg-blue-100 text-blue-700' };
  if (now > expires) return { label: 'Expirada', color: 'bg-red-100 text-red-700' };
  return { label: 'Activa', color: 'bg-green-100 text-green-700' };
};

const discountLabels: Record<string, string> = {
  percentage: 'Porcentaje', fixed: 'Monto Fijo', bogo: 'BOGO',
};

const AdminPromotions: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ApiResponse<Promotion[]>>('/admin/promotions');
      setPromotions(Array.isArray(data.data) ? data.data : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchPromotions(); }, [fetchPromotions, isAuthenticated]);

  const toDateInput = (iso: string) => {
    if (!iso) return '';
    return iso.slice(0, 16); // yyyy-MM-ddTHH:mm
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (promo: Promotion) => {
    setForm({
      title: promo.title, description: promo.description, discount_type: promo.discount_type,
      discount_value: promo.discount_value, code: promo.code, starts_at: toDateInput(promo.starts_at),
      expires_at: toDateInput(promo.expires_at), active: promo.active, max_usage: promo.max_usage,
      image_url: promo.image_url || '',
    });
    setEditingId(promo._id);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (editingId) {
        await api.put(`/admin/promotions/${editingId}`, payload);
      } else {
        await api.post('/admin/promotions', payload);
      }
      setModalOpen(false);
      fetchPromotions();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/promotions/${id}`);
      setDeleteConfirm(null);
      fetchPromotions();
    } catch { /* ignore */ }
  };

  const filtered = promotions.filter((p) => {
    if (!filterStatus) return true;
    const status = getPromoStatus(p);
    return status.label.toLowerCase() === filterStatus;
  });

  const formatDiscount = (promo: Promotion) => {
    if (promo.discount_type === 'percentage') return `${promo.discount_value}%`;
    if (promo.discount_type === 'fixed') return `$${promo.discount_value.toLocaleString('es-AR')}`;
    return 'BOGO';
  };

  return (
    <AdminLayout title="Gestión de Promociones">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
            <option value="">Todas</option>
            <option value="activa">Activas</option>
            <option value="expirada">Expiradas</option>
            <option value="próxima">Próximas</option>
            <option value="inactiva">Inactivas</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} promociones</span>
        </div>
        <button onClick={openCreate} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nueva Promoción
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Promoción</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Descuento</th>
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Uso</th>
                <th className="px-5 py-3 font-medium">Vigencia</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((promo) => {
                const status = getPromoStatus(promo);
                return (
                  <tr key={promo._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{promo.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{promo.description}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-600">{discountLabels[promo.discount_type]}</span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{formatDiscount(promo)}</td>
                    <td className="px-5 py-3">
                      {promo.code ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{promo.code}</span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {promo.usage_count}{promo.max_usage > 0 ? `/${promo.max_usage}` : ''}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      <p>{new Date(promo.starts_at).toLocaleDateString('es-AR')}</p>
                      <p>{new Date(promo.expires_at).toLocaleDateString('es-AR')}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(promo)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                        {deleteConfirm === promo._id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(promo._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Sí</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 text-xs">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(promo._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-400">No hay promociones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Descuento</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as DiscountType })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none">
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Monto Fijo</option>
                    <option value="bogo">BOGO (2x1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <input type="number" required min={0} step={0.01} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUSHI20" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uso Máximo</label>
                  <input type="number" min={0} value={form.max_usage} onChange={(e) => setForm({ ...form, max_usage: parseInt(e.target.value) || 0 })} placeholder="0 = ilimitado" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                  <input type="datetime-local" required value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiración</label>
                  <input type="datetime-local" required value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="promo-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-gray-300 text-sushi-primary focus:ring-sushi-primary" />
                <label htmlFor="promo-active" className="text-sm text-gray-700">Activa</label>
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

export default AdminPromotions;

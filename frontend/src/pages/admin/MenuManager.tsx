import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { MenuItem, ApiResponse } from '../../types';

interface ModifierForm {
  name: string;
  price: number;
}

interface MenuItemForm {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  available: boolean;
  sort_order: number;
  modifiers: ModifierForm[];
}

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

const emptyForm: MenuItemForm = { name: '', description: '', price: 0, category: '', image_url: '', available: true, sort_order: 0, modifiers: [] };

const MenuManager: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
    fetchItems();
  }, [isAuthenticated, navigate]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      try {
        const { data } = await api.get<ApiResponse<MenuItem[]>>('/admin/menu-json');
        setItems(Array.isArray(data.data) ? data.data : []);
      } catch {
        const { data } = await api.get<ApiResponse<MenuItem[]>>('/admin/menu');
        setItems(Array.isArray(data.data) ? data.data : []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const categories = [...new Set(items.map((i) => i.category))].sort();
  const filtered = filterCategory ? items.filter((i) => i.category === filterCategory) : items;

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (item: MenuItem) => {
    setForm({ name: item.name, description: item.description, price: item.price, category: item.category, image_url: item.image_url, available: item.available, sort_order: item.sort_order || 0, modifiers: item.modifiers?.map(m => ({ name: m.name, price: m.price })) || [] });
    setEditingId(item._id);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/admin/menu/${editingId}`, form);
      } else {
        await api.post('/admin/menu', form);
      }
      setModalOpen(false);
      fetchItems();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/menu/${id}`);
      setDeleteConfirm(null);
      fetchItems();
    } catch { /* ignore */ }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await api.put(`/admin/menu/${item._id}`, { available: !item.available });
      fetchItems();
    } catch { /* ignore */ }
  };

  const addModifier = () => setForm({ ...form, modifiers: [...form.modifiers, { name: '', price: 0 }] });
  const removeModifier = (idx: number) => setForm({ ...form, modifiers: form.modifiers.filter((_, i) => i !== idx) });
  const updateModifier = (idx: number, field: keyof ModifierForm, value: string | number) => {
    const mods = [...form.modifiers];
    mods[idx] = { ...mods[idx], [field]: value };
    setForm({ ...form, modifiers: mods });
  };

  // --- Bulk Actions ---

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/menu/export-csv', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu-products.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      setImportResult(null);
      const formData = new FormData();
      formData.append('csv', file);
      const { data } = await api.post<ApiResponse<ImportResult>>('/admin/menu/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(data.data);
      fetchItems();
    } catch { /* ignore */ } finally {
      setImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    try {
      setUploadingImageId(itemId);
      const formData = new FormData();
      formData.append('image', file);
      await api.post(`/admin/menu/${itemId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchItems();
    } catch { /* ignore */ } finally {
      setUploadingImageId(null);
    }
  };

  return (
    <AdminLayout title="Gestión de Menú">
      {/* Import Result Banner */}
      {importResult && (
        <div className="mb-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-900">Resultado de importación CSV</h4>
            <button onClick={() => setImportResult(null)} className="text-blue-400 hover:text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-700">Creados: <strong>{importResult.created}</strong></span>
            <span className="text-blue-700">Actualizados: <strong>{importResult.updated}</strong></span>
            {importResult.errors.length > 0 && (
              <span className="text-red-700">Errores: <strong>{importResult.errors.length}</strong></span>
            )}
          </div>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 text-xs text-red-600 space-y-1">
              {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-sm text-gray-500">{filtered.length} items</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar CSV
          </button>
          <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {importing ? 'Importando...' : 'Importar CSV'}
            <input ref={csvInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button onClick={openCreate} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo Item
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Imagen</th>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Categoría</th>
                <th className="px-5 py-3 font-medium">Precio</th>
                <th className="px-5 py-3 font-medium">Disponible</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="relative group">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">Sin img</div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        {uploadingImageId === item._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(item._id, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{item.category}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">${item.price.toLocaleString('en-US')}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleAvailability(item)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.available ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.available ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                      {deleteConfirm === item._id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Sí</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 text-xs">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(item._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No hay items en el menú</td></tr>
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
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Item' : 'Nuevo Item'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                  <input type="number" required min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" placeholder="Rolls, Sashimi..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Visualización</label>
                <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
              </div>
              {/* Modifiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Modificadores</label>
                  <button type="button" onClick={addModifier} className="text-sushi-primary hover:text-red-700 text-xs font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Agregar
                  </button>
                </div>
                {form.modifiers.map((mod, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input value={mod.name} onChange={(e) => updateModifier(idx, 'name', e.target.value)} placeholder="Nombre" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                    <input type="number" min={0} step={0.01} value={mod.price} onChange={(e) => updateModifier(idx, 'price', parseFloat(e.target.value) || 0)} placeholder="Precio" className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-sushi-primary focus:border-transparent outline-none" />
                    <button type="button" onClick={() => removeModifier(idx)} className="text-red-400 hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="available" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded border-gray-300 text-sushi-primary focus:ring-sushi-primary" />
                <label htmlFor="available" className="text-sm text-gray-700">Disponible</label>
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

export default MenuManager;

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { MenuItem, ApiResponse } from '../../types';

interface Ingredient { _id: string; name: string; unit: string; cost_per_unit: number; }
interface RecipeIngredient { ingredient_id: string; quantity: number; unit: string; }
interface Recipe { _id: string; menu_item_id: string; ingredients: RecipeIngredient[]; total_cost: number; yield: number; notes: string; }
interface CostDetail { ingredient: string; quantity: number; unit: string; cost_per_unit: number; line_cost: number; }
interface CostData { menu_item: string; price: number; total_cost: number; margin: number; margin_pct: number; details: CostDetail[]; }

const Recipes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ menu_item_id: '', ingredients: [] as RecipeIngredient[], yield: 1, notes: '' });
  const [saving, setSaving] = useState(false);
  const [costView, setCostView] = useState<CostData | null>(null);

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      // Try fallback endpoints first
      try {
        const [recRes, menuRes, ingRes] = await Promise.all([
          api.get('/admin/recipes'),
          api.get<ApiResponse<MenuItem[]>>('/admin/menu-json'),
          api.get('/admin/ingredients-json'),
        ]);
        setRecipes(Array.isArray(recRes.data.data) ? recRes.data.data : []);
        const items = Array.isArray(menuRes.data.data) ? menuRes.data.data : [];
        setMenuItems(items);
        setIngredients(Array.isArray(ingRes.data.data) ? ingRes.data.data : []);
      } catch {
        // If fallback fails, try MongoDB endpoints
        const [recRes, menuRes, ingRes] = await Promise.all([
          api.get('/admin/recipes'),
          api.get<ApiResponse<MenuItem[]>>('/admin/menu'),
          api.get('/admin/ingredients'),
        ]);
        setRecipes(Array.isArray(recRes.data.data) ? recRes.data.data : []);
        const items = Array.isArray(menuRes.data.data) ? menuRes.data.data : [];
        setMenuItems(items);
        setIngredients(Array.isArray(ingRes.data.data) ? ingRes.data.data : []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchAll(); }, [fetchAll, isAuthenticated]);

  const getMenuItemName = (id: string) => menuItems.find(m => m._id === id)?.name || 'Desconocido';
  const getMenuItemPrice = (id: string) => menuItems.find(m => m._id === id)?.price || 0;

  const openCreate = () => {
    setForm({ menu_item_id: menuItems[0]?._id || '', ingredients: [{ ingredient_id: '', quantity: 0, unit: 'g' }], yield: 1, notes: '' });
    setEditingId(null); setModalOpen(true);
  };

  const openEdit = (r: Recipe) => {
    setForm({ menu_item_id: r.menu_item_id, ingredients: r.ingredients, yield: r.yield, notes: r.notes });
    setEditingId(r._id); setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, ingredients: form.ingredients.filter(i => i.ingredient_id) };
      if (editingId) await api.put(`/admin/recipes/${editingId}`, payload);
      else await api.post('/admin/recipes', payload);
      setModalOpen(false); fetchAll();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar receta?')) return;
    try { await api.delete(`/admin/recipes/${id}`); fetchAll(); } catch { /* ignore */ }
  };

  const viewCost = async (id: string) => {
    try {
      const { data } = await api.get(`/admin/recipes/${id}/cost`);
      setCostView(data.data);
    } catch { /* ignore */ }
  };

  const addIngredientRow = () => setForm({ ...form, ingredients: [...form.ingredients, { ingredient_id: '', quantity: 0, unit: 'g' }] });
  const removeIngredientRow = (idx: number) => setForm({ ...form, ingredients: form.ingredients.filter((_, i) => i !== idx) });
  const updateIngredientRow = (idx: number, field: string, value: string | number) => {
    const updated = [...form.ingredients];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, ingredients: updated });
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <AdminLayout title="Recetas">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500">{recipes.length} recetas</span>
        <button onClick={openCreate} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Nueva Receta</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="px-5 py-3 font-medium">Ingredientes</th>
                <th className="px-5 py-3 font-medium">Costo</th>
                <th className="px-5 py-3 font-medium">Precio</th>
                <th className="px-5 py-3 font-medium">Margen</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map(r => {
                const price = getMenuItemPrice(r.menu_item_id);
                const margin = price > 0 ? ((price - r.total_cost) / price * 100).toFixed(1) : '0';
                return (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{getMenuItemName(r.menu_item_id)}</td>
                    <td className="px-5 py-3 text-gray-600">{r.ingredients.length} ingredientes</td>
                    <td className="px-5 py-3 text-red-600 font-medium">{fmt(r.total_cost)}</td>
                    <td className="px-5 py-3 text-gray-900">{fmt(price)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${parseFloat(margin) >= 60 ? 'bg-green-100 text-green-700' : parseFloat(margin) >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => viewCost(r._id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Detalle</button>
                        <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                        <button onClick={() => handleDelete(r._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {recipes.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No hay recetas. Crea una para calcular costos.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Recipe Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Receta' : 'Nueva Receta'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto del Menú</label>
                <select value={form.menu_item_id} onChange={(e) => setForm({ ...form, menu_item_id: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                  <option value="">Seleccionar...</option>
                  {menuItems.map(m => <option key={m._id} value={m._id}>{m.name} - {fmt(m.price)}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ingredientes</label>
                  <button type="button" onClick={addIngredientRow} className="text-sushi-primary hover:text-red-700 text-xs font-medium">+ Agregar</button>
                </div>
                {form.ingredients.map((ri, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <select value={ri.ingredient_id} onChange={(e) => updateIngredientRow(idx, 'ingredient_id', e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                      <option value="">Seleccionar...</option>
                      {ingredients.map(i => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                    </select>
                    <input type="number" min={0} step={0.001} value={ri.quantity} onChange={(e) => updateIngredientRow(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Cant." />
                    <input value={ri.unit} onChange={(e) => updateIngredientRow(idx, 'unit', e.target.value)} className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Unid." />
                    <button type="button" onClick={() => removeIngredientRow(idx)} className="text-red-400 hover:text-red-600 text-sm">&times;</button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rendimiento (porciones)</label>
                  <input type="number" min={1} value={form.yield} onChange={(e) => setForm({ ...form, yield: parseInt(e.target.value) || 1 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-sushi-primary hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cost Detail Modal */}
      {costView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Detalle de Costo: {costView.menu_item}</h3>
              <button onClick={() => setCostView(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-xs text-gray-500">Precio Venta</p><p className="text-lg font-bold text-gray-900">{fmt(costView.price)}</p></div>
                <div><p className="text-xs text-gray-500">Costo</p><p className="text-lg font-bold text-red-600">{fmt(costView.total_cost)}</p></div>
                <div><p className="text-xs text-gray-500">Margen</p><p className="text-lg font-bold text-green-600">{costView.margin_pct}%</p></div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Desglose</p>
                {costView.details.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">{d.ingredient} ({d.quantity} {d.unit})</span>
                    <span className="font-medium">{fmt(d.line_cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Recipes;

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface Ingredient {
  _id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  supplier_id?: string;
  category?: string;
}

interface IngredientForm {
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  category: string;
}

const emptyForm: IngredientForm = { name: '', unit: 'kg', current_stock: 0, min_stock: 0, cost_per_unit: 0, category: '' };
const units = ['kg', 'g', 'l', 'ml', 'pza', 'paq'];

const Inventory: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IngredientForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [movementModal, setMovementModal] = useState<string | null>(null);
  const [movementForm, setMovementForm] = useState({ type: 'purchase', quantity: 0, cost: 0, notes: '' });

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/ingredients');
      setIngredients(Array.isArray(data.data) ? data.data : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchIngredients(); }, [fetchIngredients, isAuthenticated]);

  const filtered = search
    ? ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : ingredients;

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (item: Ingredient) => {
    setForm({ name: item.name, unit: item.unit, current_stock: item.current_stock, min_stock: item.min_stock, cost_per_unit: item.cost_per_unit, category: item.category || '' });
    setEditingId(item._id);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) await api.put(`/admin/ingredients/${editingId}`, form);
      else await api.post('/admin/ingredients', form);
      setModalOpen(false);
      fetchIngredients();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar ingrediente?')) return;
    try { await api.delete(`/admin/ingredients/${id}`); fetchIngredients(); } catch { /* ignore */ }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModal) return;
    try {
      await api.post('/admin/inventory/movement', { ingredient_id: movementModal, ...movementForm });
      setMovementModal(null);
      setMovementForm({ type: 'purchase', quantity: 0, cost: 0, notes: '' });
      fetchIngredients();
    } catch { /* ignore */ }
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  const isLow = (i: Ingredient) => i.current_stock <= i.min_stock;

  return (
    <AdminLayout title="Inventario">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ingrediente..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-60 focus:ring-2 focus:ring-sushi-primary outline-none" />
          <span className="text-sm text-gray-500">{filtered.length} ingredientes</span>
        </div>
        <button onClick={openCreate} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Nuevo Ingrediente
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Ingrediente</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Mínimo</th>
                  <th className="px-5 py-3 font-medium">Costo/Unidad</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-5 py-3 text-gray-600">{item.category || '-'}</td>
                    <td className="px-5 py-3">{item.current_stock} {item.unit}</td>
                    <td className="px-5 py-3 text-gray-500">{item.min_stock} {item.unit}</td>
                    <td className="px-5 py-3">{fmt(item.cost_per_unit)}/{item.unit}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isLow(item) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {isLow(item) ? 'Bajo' : 'OK'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setMovementModal(item._id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Movimiento</button>
                        <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                        <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No hay ingredientes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ingredient Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Proteínas, Verduras..." />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                  <input type="number" min={0} step={0.01} value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input type="number" min={0} step={0.01} value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo/Unidad</label>
                  <input type="number" min={0} step={0.01} value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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

      {/* Movement Modal */}
      {movementModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Registrar Movimiento</h3>
              <button onClick={() => setMovementModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <form onSubmit={handleMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="purchase">Compra (entrada)</option>
                  <option value="waste">Merma (salida)</option>
                  <option value="adjustment">Ajuste</option>
                  <option value="count">Conteo físico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input type="number" min={0} step={0.01} required value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              {movementForm.type === 'purchase' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total</label>
                  <input type="number" min={0} step={0.01} value={movementForm.cost} onChange={(e) => setMovementForm({ ...movementForm, cost: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <input value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMovementModal(null)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Inventory;

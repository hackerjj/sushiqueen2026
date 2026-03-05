import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface TableItem {
  _id: string;
  number: number;
  name?: string;
  capacity: number;
  status: 'free' | 'occupied' | 'reserved' | 'billing';
  current_order_id?: string;
  zone?: string;
}

const statusLabels: Record<string, string> = { free: 'Libre', occupied: 'Ocupada', reserved: 'Reservada', billing: 'Por cobrar' };
const statusColors: Record<string, string> = {
  free: 'bg-green-100 border-green-300 text-green-800',
  occupied: 'bg-red-100 border-red-300 text-red-800',
  reserved: 'bg-blue-100 border-blue-300 text-blue-800',
  billing: 'bg-yellow-100 border-yellow-300 text-yellow-800',
};

const Tables: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ number: 1, name: '', capacity: 4, zone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/tables');
      setTables(Array.isArray(data.data) ? data.data : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchTables(); }, [fetchTables, isAuthenticated]);

  const openCreate = () => { setForm({ number: tables.length + 1, name: '', capacity: 4, zone: '' }); setEditingId(null); setModalOpen(true); };
  const openEdit = (t: TableItem) => {
    setForm({ number: t.number, name: t.name || '', capacity: t.capacity, zone: t.zone || '' });
    setEditingId(t._id);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) await api.put(`/admin/tables/${editingId}`, form);
      else await api.post('/admin/tables', form);
      setModalOpen(false);
      fetchTables();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/tables/${id}/status`, { status });
      fetchTables();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar mesa?')) return;
    try { await api.delete(`/admin/tables/${id}`); fetchTables(); } catch { /* ignore */ }
  };

  const zones = [...new Set(tables.map(t => t.zone).filter(Boolean))];
  const stats = {
    free: tables.filter(t => t.status === 'free').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    billing: tables.filter(t => t.status === 'billing').length,
  };

  return (
    <AdminLayout title="Mesas">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.free}</p>
          <p className="text-xs text-gray-500">Libres</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
          <p className="text-xs text-gray-500">Ocupadas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.reserved}</p>
          <p className="text-xs text-gray-500">Reservadas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.billing}</p>
          <p className="text-xs text-gray-500">Por cobrar</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{tables.length} mesas</span>
        <button onClick={openCreate} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Nueva Mesa
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map(table => (
            <div key={table._id} className={`rounded-xl border-2 p-4 text-center ${statusColors[table.status]}`}>
              <p className="text-lg font-bold">Mesa {table.number}</p>
              {table.name && <p className="text-xs opacity-75">{table.name}</p>}
              <p className="text-xs mt-1">{table.capacity} personas</p>
              {table.zone && <p className="text-xs opacity-60">{table.zone}</p>}
              <p className="text-xs font-medium mt-2">{statusLabels[table.status]}</p>
              <div className="mt-3 flex flex-col gap-1">
                <select
                  value={table.status}
                  onChange={(e) => changeStatus(table._id, e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
                >
                  <option value="free">Libre</option>
                  <option value="occupied">Ocupada</option>
                  <option value="reserved">Reservada</option>
                  <option value="billing">Por cobrar</option>
                </select>
                <div className="flex gap-1 justify-center">
                  <button onClick={() => openEdit(table)} className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
                  <button onClick={() => handleDelete(table._id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Mesa' : 'Nueva Mesa'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input type="number" min={1} required value={form.number} onChange={(e) => setForm({ ...form, number: parseInt(e.target.value) || 1 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                  <input type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (opcional)</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Terraza, VIP..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Interior, Terraza..." list="zones" />
                <datalist id="zones">{zones.map(z => <option key={z} value={z} />)}</datalist>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-sushi-primary hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Tables;

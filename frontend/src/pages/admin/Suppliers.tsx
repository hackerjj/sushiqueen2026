import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface Supplier {
  _id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface SupplierForm {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyForm: SupplierForm = { name: '', contact_name: '', phone: '', email: '', address: '', notes: '' };

const Suppliers: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/suppliers');
        setSuppliers(Array.isArray(data.data) ? data.data : []);
      } catch {
        setSuppliers([]);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchSuppliers(); }, [fetchSuppliers, isAuthenticated]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, contact_name: s.contact_name || '', phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' });
    setEditingId(s._id);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) await api.put(`/admin/suppliers/${editingId}`, form);
      else await api.post('/admin/suppliers', form);
      setModalOpen(false);
      fetchSuppliers();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar proveedor?')) return;
    try { await api.delete(`/admin/suppliers/${id}`); fetchSuppliers(); } catch { /* ignore */ }
  };

  return (
    <AdminLayout title="Proveedores">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500">{suppliers.length} proveedores</span>
        <button onClick={openCreate} className="bg-sushi-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Nuevo Proveedor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Contacto</th>
                <th className="px-5 py-3 font-medium">Teléfono</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-5 py-3 text-gray-600">{s.contact_name || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{s.phone || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{s.email || '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                      <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No hay proveedores</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Empresa</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Contacto</label>
                <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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

export default Suppliers;

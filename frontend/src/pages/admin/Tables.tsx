import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

type TableShape = 'square' | 'circle' | 'star';
type TableSize = 'small' | 'medium' | 'large';
type TableStatus = 'free' | 'occupied' | 'reserved' | 'billing';

interface TableItem {
  _id: string;
  number: number;
  name?: string;
  capacity: number;
  status: TableStatus;
  current_order_id?: string;
  zone?: string;
  shape?: TableShape;
  size?: TableSize;
  position_x?: number;
  position_y?: number;
}

const statusColors: Record<string, string> = {
  free: 'bg-green-400 border-green-500 text-white',
  occupied: 'bg-red-400 border-red-500 text-white',
  reserved: 'bg-blue-400 border-blue-500 text-white',
  billing: 'bg-yellow-400 border-yellow-500 text-white',
};
const statusLabels: Record<string, string> = { free: 'Libre', occupied: 'Ocupada', reserved: 'Reservada', billing: 'Por cobrar' };

const sizeMap: Record<TableSize, string> = { small: 'w-20 h-20', medium: 'w-28 h-28', large: 'w-36 h-36' };
const sizeFontMap: Record<TableSize, string> = { small: 'text-xl', medium: 'text-2xl', large: 'text-3xl' };

const GRID_COLS = 6;
const GRID_ROWS = 4;

const defaultTables: TableItem[] = [
  { _id: '1', number: 1, capacity: 4, zone: 'Salón', status: 'free', shape: 'square', size: 'medium', position_x: 0, position_y: 1 },
  { _id: '2', number: 2, capacity: 4, zone: 'Salón', status: 'free', shape: 'square', size: 'medium', position_x: 1, position_y: 1 },
  { _id: '3', number: 3, capacity: 6, zone: 'Salón', status: 'free', shape: 'square', size: 'medium', position_x: 2, position_y: 1 },
  { _id: '4', number: 4, capacity: 4, zone: 'Salón', status: 'free', shape: 'square', size: 'large', position_x: 2, position_y: 0 },
  { _id: '5', number: 5, capacity: 4, zone: 'Terraza', status: 'free', shape: 'square', size: 'medium', position_x: 0, position_y: 0 },
  { _id: '6', number: 6, capacity: 4, zone: 'Terraza', status: 'free', shape: 'square', size: 'medium', position_x: 0, position_y: 1 },
];

const Tables: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState('Salón');
  const [configMode, setConfigMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ number: 1, name: '', capacity: 4, zone: 'Salón', shape: 'square' as TableShape, size: 'medium' as TableSize, position_x: 0, position_y: 0 });
  const [saving, setSaving] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/tables');
      const list = Array.isArray(data.data) ? data.data : [];
      setTables(list.length > 0 ? list.map((t: TableItem) => ({ ...t, shape: t.shape || 'square', size: t.size || 'medium' })) : defaultTables);
    } catch {
      setTables(defaultTables);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchTables(); }, [fetchTables, isAuthenticated]);

  const zones = [...new Set(tables.map(t => t.zone || 'Sin zona'))];
  const zoneTables = tables.filter(t => (t.zone || 'Sin zona') === activeZone);

  const openCreate = () => {
    const nextNum = Math.max(0, ...tables.map(t => t.number)) + 1;
    setForm({ number: nextNum, name: '', capacity: 4, zone: activeZone, shape: 'square', size: 'medium', position_x: 0, position_y: 0 });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (t: TableItem) => {
    setForm({ number: t.number, name: t.name || '', capacity: t.capacity, zone: t.zone || 'Salón', shape: t.shape || 'square', size: t.size || 'medium', position_x: t.position_x || 0, position_y: t.position_y || 0 });
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
    try { await api.patch(`/admin/tables/${id}/status`, { status }); fetchTables(); } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar mesa?')) return;
    try { await api.delete(`/admin/tables/${id}`); fetchTables(); setSelectedTable(null); } catch { /* ignore */ }
  };

  const renderShape = (table: TableItem) => {
    const sz = sizeMap[table.size || 'medium'];
    const font = sizeFontMap[table.size || 'medium'];
    const color = statusColors[table.status];
    const base = `${sz} ${color} border-2 flex items-center justify-center font-bold ${font} cursor-pointer transition-all hover:scale-105 select-none`;

    const onClick = () => {
      if (configMode) { openEdit(table); }
      else { setSelectedTable(selectedTable?._id === table._id ? null : table); }
    };

    if (table.shape === 'circle') return <div key={table._id} onClick={onClick} className={`${base} rounded-full`}>{table.number}</div>;
    if (table.shape === 'star') return (
      <div key={table._id} onClick={onClick} className={`${sz} flex items-center justify-center cursor-pointer transition-all hover:scale-105`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,5 63,35 95,35 70,57 80,90 50,70 20,90 30,57 5,35 37,35" className={table.status === 'free' ? 'fill-green-400 stroke-green-500' : table.status === 'occupied' ? 'fill-red-400 stroke-red-500' : table.status === 'reserved' ? 'fill-blue-400 stroke-blue-500' : 'fill-yellow-400 stroke-yellow-500'} strokeWidth="2" />
          <text x="50" y="58" textAnchor="middle" className="fill-white font-bold" fontSize="28">{table.number}</text>
        </svg>
      </div>
    );
    return <div key={table._id} onClick={onClick} className={`${base} rounded-xl`}>{table.number}</div>;
  };

  const stats = { free: tables.filter(t => t.status === 'free').length, occupied: tables.filter(t => t.status === 'occupied').length, reserved: tables.filter(t => t.status === 'reserved').length, billing: tables.filter(t => t.status === 'billing').length };

  return (
    <AdminLayout title="Salas y Mesas">
      {/* Stats bar */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400" /><span className="text-xs text-gray-600">{stats.free} Libres</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400" /><span className="text-xs text-gray-600">{stats.occupied} Ocupadas</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400" /><span className="text-xs text-gray-600">{stats.reserved} Reservadas</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400" /><span className="text-xs text-gray-600">{stats.billing} Por cobrar</span></div>
      </div>

      {/* Zone tabs + actions */}
      <div className="flex items-center gap-2 mb-4">
        {zones.map(z => (
          <button key={z} onClick={() => { setActiveZone(z); setSelectedTable(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeZone === z ? 'bg-white shadow text-gray-900' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            {z}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={openCreate} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">+ Nueva Mesa</button>
          <button onClick={() => setConfigMode(!configMode)} className={`px-4 py-2 rounded-lg text-sm font-medium ${configMode ? 'bg-orange-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {configMode ? '✓ Salir' : '⚙ Configurar'}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Grid area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)` }}>
              {Array.from({ length: GRID_ROWS }).map((_, row) =>
                Array.from({ length: GRID_COLS }).map((_, col) => {
                  const table = zoneTables.find(t => (t.position_x || 0) === col && (t.position_y || 0) === row);
                  if (table) return <div key={`${row}-${col}`} className="flex items-center justify-center">{renderShape(table)}</div>;
                  if (configMode) return (
                    <div key={`${row}-${col}`} className="flex items-center justify-center">
                      <button onClick={() => { setForm({ ...form, zone: activeZone, position_x: col, position_y: row, number: Math.max(0, ...tables.map(t => t.number)) + 1 }); setEditingId(null); setModalOpen(true); }} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
                        <span className="text-2xl">+</span>
                      </button>
                    </div>
                  );
                  return <div key={`${row}-${col}`} />;
                })
              )}
            </div>
          )}
        </div>

        {/* Right panel: selected table info or zone config */}
        <div className="w-72 bg-white rounded-xl border border-gray-200 p-4">
          {selectedTable ? (
            <div>
              <div className="bg-orange-500 text-white rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
                <span className="font-bold">MESA {selectedTable.number}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(selectedTable)} className="text-white/80 hover:text-white text-sm">✏</button>
                  <button onClick={() => handleDelete(selectedTable._id)} className="text-white/80 hover:text-white text-sm">🗑</button>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className="font-medium">{statusLabels[selectedTable.status]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Zona</span><span className="font-medium">{selectedTable.zone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Capacidad</span><span className="font-medium">{selectedTable.capacity} personas</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Forma</span><span className="font-medium capitalize">{selectedTable.shape || 'Cuadrada'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tamaño</span><span className="font-medium capitalize">{selectedTable.size || 'Mediana'}</span></div>
                <div className="pt-2">
                  <label className="text-xs text-gray-500 mb-1 block">Cambiar estado</label>
                  <select value={selectedTable.status} onChange={(e) => changeStatus(selectedTable._id, e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="free">Libre</option>
                    <option value="occupied">Ocupada</option>
                    <option value="reserved">Reservada</option>
                    <option value="billing">Por cobrar</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-orange-500 text-white rounded-lg px-4 py-2 mb-4 font-bold">{activeZone.toUpperCase()}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Mesas</span><span className="font-medium">{zoneTables.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Capacidad total</span><span className="font-medium">{zoneTables.reduce((s, t) => s + t.capacity, 0)} personas</span></div>
              </div>
              <p className="text-xs text-gray-400 mt-4">Selecciona una mesa para ver detalles o usa ⚙ Configurar para editar el layout.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="bg-orange-500 text-white rounded-t-2xl px-6 py-3 flex items-center justify-between">
              <h3 className="font-bold">{editingId ? `MESA ${form.number}` : 'NUEVA MESA'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white text-lg">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                <input type="number" min={1} required value={form.number} onChange={(e) => setForm({ ...form, number: parseInt(e.target.value) || 1 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sala *</label>
                <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                  <option value="Nueva sala">+ Nueva sala</option>
                </select>
                {form.zone === 'Nueva sala' && (
                  <input placeholder="Nombre de la sala" onChange={(e) => setForm({ ...form, zone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma *</label>
                <div className="flex gap-3">
                  {(['square', 'circle', 'star'] as TableShape[]).map(s => (
                    <button key={s} type="button" onClick={() => setForm({ ...form, shape: s })} className={`flex-1 py-3 rounded-lg border-2 text-center text-sm font-medium ${form.shape === s ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {s === 'square' ? '⬜ Cuadrada' : s === 'circle' ? '⭕ Circular' : '⭐ Estrella'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño *</label>
                <select value={form.size} onChange={(e) => { const s = e.target.value as TableSize; const cap = s === 'small' ? 2 : s === 'medium' ? 4 : 6; setForm({ ...form, size: s, capacity: cap }); }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="small">Chica (2 personas)</option>
                  <option value="medium">Mediana (4 personas)</option>
                  <option value="large">Grande (6+ personas)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-bold">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Tables;

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { menuData } from '../../data/menuData';
import type { MenuItem, ApiResponse, CartItem, PaymentMethod, OrderType } from '../../types';

interface POSCartItem extends CartItem {
  line_total: number;
}

interface CustomerMatch {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  total_orders?: number;
  last_order?: string;
}

const POS: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tables, setTables] = useState<{ _id: string; number: number; zone: string; status: string; capacity: number; shape?: string; size?: string; position_x?: number; position_y?: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedTableNum, setSelectedTableNum] = useState(0);
  const [activeZone, setActiveZone] = useState('Salón');
  const [customerMatches, setCustomerMatches] = useState<CustomerMatch[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ApiResponse<MenuItem[]>>('/admin/menu');
      const list = Array.isArray(data.data) ? data.data : [];
      const available = list.filter(i => i.available);
      setItems(available.length > 0 ? available : menuData);
    } catch {
      // Fallback to local menu data
      setItems(menuData);
    } finally { setLoading(false); }
  }, []);

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/admin/tables');
      const list = Array.isArray(data.data) ? data.data : [];
      setTables(list.length > 0 ? list : [
        { _id: '1', number: 1, zone: 'Salón', status: 'free', capacity: 4, shape: 'square', size: 'medium', position_x: 0, position_y: 1 },
        { _id: '2', number: 2, zone: 'Salón', status: 'free', capacity: 4, shape: 'square', size: 'medium', position_x: 1, position_y: 1 },
        { _id: '3', number: 3, zone: 'Salón', status: 'free', capacity: 6, shape: 'square', size: 'medium', position_x: 2, position_y: 1 },
        { _id: '4', number: 4, zone: 'Salón', status: 'free', capacity: 4, shape: 'square', size: 'large', position_x: 2, position_y: 0 },
        { _id: '5', number: 5, zone: 'Terraza', status: 'free', capacity: 4, shape: 'square', size: 'medium', position_x: 0, position_y: 0 },
        { _id: '6', number: 6, zone: 'Terraza', status: 'free', capacity: 4, shape: 'square', size: 'medium', position_x: 0, position_y: 1 },
      ]);
    } catch {
      setTables([
        { _id: '1', number: 1, zone: 'Salón', status: 'free', capacity: 4, shape: 'square', size: 'medium', position_x: 0, position_y: 1 },
        { _id: '2', number: 2, zone: 'Salón', status: 'free', capacity: 4, shape: 'square', size: 'medium', position_x: 1, position_y: 1 },
        { _id: '3', number: 3, zone: 'Salón', status: 'free', capacity: 6, shape: 'square', size: 'medium', position_x: 2, position_y: 1 },
        { _id: '4', number: 4, zone: 'Salón', status: 'free', capacity: 4, shape: 'square', size: 'large', position_x: 2, position_y: 0 },
        { _id: '5', number: 5, zone: 'Terraza', status: 'free', capacity: 4, shape: 'square', size: 'medium', position_x: 0, position_y: 0 },
        { _id: '6', number: 6, zone: 'Terraza', status: 'free', capacity: 4, shape: 'square', size: 'medium', position_x: 0, position_y: 1 },
      ]);
    }
  };

  const selectTable = (t: typeof tables[0]) => {
    setSelectedTable(t._id);
    setSelectedTableNum(t.number);
    setOrderType('dine_in');
  };

  const clearTable = () => {
    setSelectedTable('');
    setSelectedTableNum(0);
    setCart([]);
  };

  const zones = [...new Set(tables.map(t => t.zone))];
  const zoneTables = tables.filter(t => t.zone === activeZone);

  useEffect(() => { if (isAuthenticated) { fetchMenu(); fetchTables(); } }, [fetchMenu, isAuthenticated]);

  // Search customers by phone for autocomplete
  const searchCustomers = async (phone: string) => {
    if (phone.length < 3) { setCustomerMatches([]); setShowMatches(false); return; }
    try {
      const { data } = await api.get(`/admin/customers?search=${phone}`);
      const list = Array.isArray(data.data) ? data.data : [];
      setCustomerMatches(list.slice(0, 5));
      setShowMatches(list.length > 0);
    } catch {
      setCustomerMatches([]);
      setShowMatches(false);
    }
  };

  const selectCustomer = (c: CustomerMatch) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    if (c.address) setCustomerAddress(c.address);
    setSelectedCustomerId(c._id);
    setShowMatches(false);
    // Fetch customer order history
    fetchCustomerHistory(c._id);
  };

  const fetchCustomerHistory = async (customerId: string) => {
    try {
      const { data } = await api.get(`/admin/customers/${customerId}`);
      const customer = data.data || data;
      setCustomerHistory(customer.top_items || []);
    } catch {
      setCustomerHistory([]);
    }
  };

  const categories = [...new Set(items.map(i => i.category))].sort();
  const filtered = items.filter(i => {
    if (category && i.category !== category) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === item._id);
      if (existing) {
        return prev.map(c => c.menu_item_id === item._id
          ? { ...c, quantity: c.quantity + 1, line_total: (c.quantity + 1) * c.price }
          : c
        );
      }
      return [...prev, {
        menu_item_id: item._id,
        name: item.name,
        quantity: 1,
        price: item.price,
        modifiers: [],
        line_total: item.price,
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.menu_item_id === id ? { ...c, quantity: c.quantity + delta, line_total: (c.quantity + delta) * c.price } : c)
      .filter(c => c.quantity > 0)
    );
  };

  const total = cart.reduce((sum, c) => sum + c.line_total, 0);

  const canSubmit = () => {
    if (cart.length === 0 || submitting) return false;
    if (orderType === 'dine_in') return !!selectedTable;
    if (orderType === 'takeout') return !!customerName && !!customerPhone;
    if (orderType === 'delivery') return !!customerName && !!customerPhone && !!customerAddress;
    return false;
  };

  const submitOrder = async () => {
    if (!canSubmit()) return;
    try {
      setSubmitting(true);
      await api.post('/orders', {
        customer: { name: customerName || 'Mesa', phone: customerPhone || '', address: customerAddress },
        items: cart.map(c => ({ menu_item_id: c.menu_item_id, name: c.name, price: c.price, quantity: c.quantity, modifiers: [] })),
        source: 'pos',
        type: orderType,
        payment_method: paymentMethod,
        table_id: selectedTable || undefined,
        guest_count: orderType === 'dine_in' ? guestCount : undefined,
      });
      setLastOrder('OK');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerHistory([]);
      setSelectedCustomerId('');
      setTimeout(() => setLastOrder(null), 4000);
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-700 text-sm">← Admin</button>
          <h1 className="text-lg font-bold text-gray-900">Punto de Venta</h1>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar..." className="ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-48 focus:ring-2 focus:ring-sushi-primary outline-none" />
        </div>

        {/* Category tabs + search */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <button onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${!category ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Todos
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${category === c ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Products or Table Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {orderType === 'dine_in' && !selectedTable ? (
            /* Table selection grid */
            <div>
              <div className="flex gap-2 mb-4">
                {zones.map(z => (
                  <button key={z} onClick={() => setActiveZone(z)} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeZone === z ? 'bg-white shadow text-gray-900 border' : 'bg-gray-200 text-gray-600'}`}>{z}</button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-3" style={{ gridTemplateRows: `repeat(4, 1fr)` }}>
                {Array.from({ length: 4 }).map((_, row) =>
                  Array.from({ length: 6 }).map((_, col) => {
                    const t = zoneTables.find(tb => (tb.position_x || 0) === col && (tb.position_y || 0) === row);
                    if (!t) return <div key={`${row}-${col}`} />;
                    const colors: Record<string, string> = { free: 'bg-green-400 text-white', occupied: 'bg-red-400 text-white', reserved: 'bg-blue-400 text-white', billing: 'bg-yellow-400 text-white' };
                    const sz = t.size === 'large' ? 'w-28 h-28 text-3xl' : t.size === 'small' ? 'w-16 h-16 text-lg' : 'w-20 h-20 text-2xl';
                    const shape = t.shape === 'circle' ? 'rounded-full' : t.shape === 'star' ? 'rounded-xl' : 'rounded-xl';
                    return (
                      <div key={`${row}-${col}`} className="flex items-center justify-center">
                        <button onClick={() => selectTable(t)} className={`${sz} ${colors[t.status]} ${shape} font-bold flex items-center justify-center hover:scale-105 transition-transform shadow-md`}>
                          {t.number}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-gray-400 mt-4">Selecciona una mesa para tomar la comanda</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(item => (
                <button key={item._id} onClick={() => addToCart(item)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-left hover:shadow-md hover:border-sushi-primary/30 transition-all active:scale-95">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-20 object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-xs text-gray-400">Sin imagen</div>
                  )}
                  <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm font-bold text-sushi-primary">{fmt(item.price)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {orderType === 'dine_in' && selectedTableNum > 0 ? `Mesa ${selectedTableNum}` : 'Orden Actual'}
          </h2>
          {orderType === 'dine_in' && selectedTable && (
            <button onClick={clearTable} className="text-xs text-gray-500 hover:text-red-500">✕ Cambiar</button>
          )}
        </div>

        {/* Order type */}
        <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
          {(['dine_in', 'takeout', 'delivery'] as OrderType[]).map(t => (
            <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${orderType === t ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
              {t === 'dine_in' ? 'Mesa' : t === 'takeout' ? 'Para llevar' : 'Delivery'}
            </button>
          ))}
        </div>

        {/* Context fields based on order type */}
        <div className="px-4 py-2 border-b border-gray-100 space-y-2">
          {orderType === 'dine_in' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Personas:</label>
                <select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs">
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre (opcional)" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs" />
            </>
          )}
          {orderType === 'takeout' && (
            <>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs" />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Teléfono *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs" />
            </>
          )}
          {orderType === 'delivery' && (
            <div className="relative">
              <input value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); searchCustomers(e.target.value); }} placeholder="Teléfono *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs" />
              {showMatches && customerMatches.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {customerMatches.map(c => (
                    <button key={c._id} onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <p className="text-xs font-medium">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone}</p>
                    </button>
                  ))}
                </div>
              )}
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs mt-2" />
              <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Dirección *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs mt-2" />
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Agrega productos</p>
          ) : cart.map(item => (
            <div key={item.menu_item_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{fmt(item.price)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.menu_item_id, -1)} className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center hover:bg-gray-300">-</button>
                <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.menu_item_id, 1)} className="w-6 h-6 rounded-full bg-sushi-primary text-white text-xs flex items-center justify-center hover:bg-red-700">+</button>
              </div>
              <p className="text-sm font-bold text-gray-900 ml-2 w-16 text-right">{fmt(item.line_total)}</p>
            </div>
          ))}
        </div>

        {/* Customer history (delivery) */}
        {orderType === 'delivery' && selectedCustomerId && customerHistory.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 bg-blue-50">
            <p className="text-xs font-semibold text-blue-700 mb-1">Pedidos anteriores</p>
            {customerHistory.slice(0, 5).map((item, i) => (
              <p key={i} className="text-xs text-blue-600">• {item}</p>
            ))}
          </div>
        )}

        {/* Payment */}
        <div className="border-t border-gray-100 px-4 py-2">
          <div className="flex gap-2">
            {(['cash', 'card', 'transfer'] as PaymentMethod[]).map(m => (
              <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${paymentMethod === m ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {m === 'cash' ? 'Efectivo' : m === 'card' ? 'Tarjeta' : 'Transferencia'}
              </button>
            ))}
          </div>
        </div>

        {/* Total + Submit */}
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-2xl font-bold text-gray-900">{fmt(total)}</span>
          </div>
          <button onClick={submitOrder} disabled={!canSubmit()} className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm">
            {submitting ? 'Procesando...' : `Cobrar ${fmt(total)}`}
          </button>
          {lastOrder && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
              <p className="text-green-700 text-sm font-medium">Orden creada ✓</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;

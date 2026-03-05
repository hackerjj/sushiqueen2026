import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { MenuItem, ApiResponse, CartItem, PaymentMethod, OrderType } from '../../types';

interface POSCartItem extends CartItem {
  line_total: number;
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
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tables, setTables] = useState<{ _id: string; number: number; status: string }[]>([]);
  const [selectedTable, setSelectedTable] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ApiResponse<MenuItem[]>>('/admin/menu');
      const list = Array.isArray(data.data) ? data.data : [];
      setItems(list.filter(i => i.available));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) { fetchMenu(); fetchTables(); } }, [fetchMenu, isAuthenticated]);

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/admin/tables');
      setTables(Array.isArray(data.data) ? data.data : []);
    } catch { /* ignore */ }
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

  const submitOrder = async () => {
    if (cart.length === 0 || !customerName || !customerPhone) return;
    try {
      setSubmitting(true);
      const { data } = await api.post('/orders', {
        customer: { name: customerName, phone: customerPhone, address: '' },
        items: cart.map(c => ({
          menu_item_id: c.menu_item_id,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          modifiers: [],
        })),
        source: 'pos',
        type: orderType,
        payment_method: paymentMethod,
        table_id: selectedTable || undefined,
      });
      setLastOrder(data.data?.order_number || 'OK');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setTimeout(() => setLastOrder(null), 5000);
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-700 text-sm">← Admin</button>
          <h1 className="text-lg font-bold text-gray-900">Punto de Venta</h1>
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
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-40 focus:ring-2 focus:ring-sushi-primary outline-none"
          />
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(item => (
                <button
                  key={item._id}
                  onClick={() => addToCart(item)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-left hover:shadow-md hover:border-sushi-primary/30 transition-all active:scale-95"
                >
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
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Orden Actual</h2>
        </div>

        {/* Order type */}
        <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
          {(['dine_in', 'takeout', 'delivery'] as OrderType[]).map(t => (
            <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${orderType === t ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
              {t === 'dine_in' ? 'Mesa' : t === 'takeout' ? 'Para llevar' : 'Delivery'}
            </button>
          ))}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">

        {/* Table selector for dine_in */}
        {orderType === 'dine_in' && tables.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-100">
            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs">
              <option value="">Sin mesa asignada</option>
              {tables.filter(t => t.status === 'free').map(t => (
                <option key={t._id} value={t._id}>Mesa {t.number}</option>
              ))}
            </select>
          </div>
        )}
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

        {/* Customer + Payment */}
        <div className="border-t border-gray-100 px-4 py-3 space-y-2">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre cliente" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs" />
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Teléfono" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs" />
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
          <button
            onClick={submitOrder}
            disabled={submitting || cart.length === 0 || !customerName || !customerPhone}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {submitting ? 'Procesando...' : `Cobrar ${fmt(total)}`}
          </button>
          {lastOrder && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
              <p className="text-green-700 text-sm font-medium">Orden {lastOrder} creada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;

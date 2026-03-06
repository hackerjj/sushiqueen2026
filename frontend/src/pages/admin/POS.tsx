import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { menuData } from '../../data/menuData';
import type { MenuItem, ApiResponse, CartItem, PaymentMethod, OrderType } from '../../types';
import { SALES_CHANNELS, channelToOrderType, channelDefaultCustomerName } from '../../utils/salesChannels';
import type { SalesChannel } from '../../utils/salesChannels';
import PaymentModal from '../../components/admin/PaymentModal';
import type { PaymentDetails } from '../../utils/paymentUtils';

interface POSCartItem extends CartItem { line_total: number; person: number; }
interface CustomerMatch { _id: string; name: string; phone: string; address?: string; }

const TICKET_HEADER = `Sushi Queen\nJose Tomas Cuellar 39 Loc. 1-C\nEdna Garcia\nRFC: GAGE620314GG02\nTEL: 5589905396`;
const TICKET_FOOTER = `Agradecemos tu preferencia, propina no incluida.\nEste documento no es valido como factura.\n¡Gracias por elegir Sushi Queen!`;

/** Product image with graceful error fallback to "Sin imagen" placeholder */
const ProductImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-xs text-gray-400">Sin imagen</div>;
  }
  return <img src={src} alt={alt} className="w-full h-20 object-cover rounded-lg mb-2" onError={() => setError(true)} />;
};

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
  const [sentToKitchen, setSentToKitchen] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [tableCarts, setTableCarts] = useState<Record<string, { items: POSCartItem[]; guestCount: number; sent: boolean }>>({});
  const [activeChannel, setActiveChannel] = useState<SalesChannel>('tables');
  // Payment details
  const [cashReceived, setCashReceived] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [cardLast4, setCardLast4] = useState('');
  const [cardApproval, setCardApproval] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  // PaymentModal for takeout/delivery/counter/express orders
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPaymentDetails, setPendingPaymentDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => { if (!isAuthenticated) navigate('/admin/login'); }, [isAuthenticated, navigate]);

  // Build image lookup from menuData to restore images for API items missing image_url
  const imageByName = useRef<Record<string, string>>(
    Object.fromEntries(menuData.filter(i => i.image_url).map(i => [i.name.toLowerCase(), i.image_url]))
  );

  const enrichImages = useCallback((list: MenuItem[]): MenuItem[] =>
    list.map(item => (!item.image_url && imageByName.current[item.name.toLowerCase()])
      ? { ...item, image_url: imageByName.current[item.name.toLowerCase()] }
      : item
    ), []);

  const fetchMenu = useCallback(async () => {
    try { 
      setLoading(true); 
      // Try fallback endpoint first
      try {
        const { data } = await api.get<ApiResponse<MenuItem[]>>('/admin/menu-json'); 
        const l = Array.isArray(data.data) ? data.data.filter(i => i.available) : []; 
        setItems(l.length > 0 ? enrichImages(l) : menuData);
      } catch {
        // If fallback fails, try MongoDB endpoint
        const { data } = await api.get<ApiResponse<MenuItem[]>>('/admin/menu'); 
        const l = Array.isArray(data.data) ? data.data.filter(i => i.available) : []; 
        setItems(l.length > 0 ? enrichImages(l) : menuData);
      }
    } catch { setItems(menuData); } finally { setLoading(false); }
  }, [enrichImages]);

  const fetchTables = async () => { 
    try { 
      const { data } = await api.get('/admin/tables'); 
      const l = Array.isArray(data.data) ? data.data : []; 
      setTables(l); 
    } catch { 
      setTables([]); 
    } 
  };
  
  useEffect(() => { 
    if (isAuthenticated) { 
      fetchMenu(); 
      fetchTables(); 
      // Poll tables every 10 seconds to sync status
      const interval = setInterval(fetchTables, 10000);
      return () => clearInterval(interval);
    } 
  }, [fetchMenu, isAuthenticated]);

  const selectTable = (t: typeof tables[0]) => {
    if (selectedTable && cart.length > 0) setTableCarts(p => ({ ...p, [selectedTable]: { items: cart, guestCount, sent: sentToKitchen } }));
    const saved = tableCarts[t._id];
    setCart(saved?.items || []); setGuestCount(saved?.guestCount || 2); setSentToKitchen(saved?.sent || false);
    setSelectedTable(t._id); setSelectedTableNum(t.number); setOrderType('dine_in'); setShowPayment(false);
  };
  const goBackToGrid = () => {
    if (selectedTable && cart.length > 0) setTableCarts(p => ({ ...p, [selectedTable]: { items: cart, guestCount, sent: sentToKitchen } }));
    setSelectedTable(''); setSelectedTableNum(0); setShowPayment(false);
  };
  const clearTable = () => { setTableCarts(p => { const n = { ...p }; delete n[selectedTable]; return n; }); setSelectedTable(''); setSelectedTableNum(0); setCart([]); setSentToKitchen(false); setShowPayment(false); resetPaymentFields(); setPendingPaymentDetails(null); };
  const tableHasItems = (id: string) => id === selectedTable ? cart.length > 0 : !!tableCarts[id]?.items?.length;
  const resetPaymentFields = () => { setCashReceived(''); setTipAmount(''); setCardType('debit'); setCardLast4(''); setCardApproval(''); setTransferNumber(''); };

  const switchChannel = (channel: SalesChannel) => {
    setActiveChannel(channel);
    setShowPayment(false);
    setOrderType(channelToOrderType(channel));
    if (channel !== 'tables') {
      setSelectedTable(''); setSelectedTableNum(0);
    }
  };

  const zones = [...new Set(tables.map(t => t.zone))];
  const zoneTables = tables
    .filter(t => t.zone === activeZone)
    .sort((a, b) => a.number - b.number);
  const gridCols = Math.min(6, Math.ceil(Math.sqrt(zoneTables.length)));
  const searchCustomers = async (term: string) => { if (term.length < 3) { setCustomerMatches([]); setShowMatches(false); return; } try { const { data } = await api.get(`/admin/customers?search=${encodeURIComponent(term)}`); setCustomerMatches(Array.isArray(data.data) ? data.data.slice(0, 5) : []); setShowMatches(true); } catch { setCustomerMatches([]); } };
  const selectCustomer = (c: CustomerMatch) => { setCustomerName(c.name); setCustomerPhone(c.phone); if (c.address) setCustomerAddress(c.address); setShowMatches(false); };

  const categories = [...new Set(items.map(i => i.category))].sort();
  const filtered = items.filter(i => { if (category && i.category !== category) return false; if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false; return true; });

  const addToCart = (item: MenuItem) => {
    setCart(prev => { const ex = prev.find(c => c.menu_item_id === item._id && c.person === 1); if (ex) return prev.map(c => c.menu_item_id === item._id && c.person === 1 ? { ...c, quantity: c.quantity + 1, line_total: (c.quantity + 1) * c.price } : c); return [...prev, { menu_item_id: item._id, name: item.name, quantity: 1, price: item.price, modifiers: [], line_total: item.price, person: 1 }]; });
  };
  const updateQty = (id: string, person: number, delta: number) => { setCart(prev => prev.map(c => c.menu_item_id === id && c.person === person ? { ...c, quantity: c.quantity + delta, line_total: (c.quantity + delta) * c.price } : c).filter(c => c.quantity > 0)); };
  const changePerson = (id: string, old: number, nw: number) => { setCart(prev => prev.map(c => c.menu_item_id === id && c.person === old ? { ...c, person: nw } : c)); };

  const total = cart.reduce((s, c) => s + c.line_total, 0);
  const tip = parseFloat(tipAmount) || 0;
  const cashChange = (parseFloat(cashReceived) || 0) - total - tip;
  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  const canClose = () => {
    if (paymentMethod === 'cash') return parseFloat(cashReceived) >= total;
    if (paymentMethod === 'card') return cardLast4.length === 4 && cardApproval.length > 0;
    if (paymentMethod === 'transfer') return transferNumber.length > 0;
    return false;
  };

  const canSubmit = () => { if (cart.length === 0 || submitting) return false; if (activeChannel === 'tables' && orderType === 'dine_in') return !!selectedTable; if (activeChannel === 'counter' || activeChannel === 'express') return true; if (orderType === 'takeout') return !!customerName && !!customerPhone; if (orderType === 'delivery') return !!customerName && !!customerPhone && !!customerAddress; return false; };

  const sendToKitchen = async () => {
    if (!canSubmit()) return;
    // For non-dine_in orders, show payment modal first
    if (orderType !== 'dine_in' && !pendingPaymentDetails) {
      setShowPaymentModal(true);
      return;
    }
    try {
      setSubmitting(true);
      const orderPayload: Record<string, unknown> = {
        customer: { name: customerName || channelDefaultCustomerName(activeChannel, selectedTableNum), phone: customerPhone || '', address: customerAddress },
        items: cart.map(c => ({ menu_item_id: c.menu_item_id, name: c.name, price: c.price, quantity: c.quantity, modifiers: [], person: c.person })),
        source: 'pos',
        type: orderType,
        payment_method: paymentMethod,
        table_id: selectedTable || undefined,
        guest_count: orderType === 'dine_in' ? guestCount : undefined,
        channel: activeChannel,
      };
      if (pendingPaymentDetails) {
        orderPayload.payment_details = pendingPaymentDetails;
      }
      await api.post('/orders', orderPayload).catch(() => {});
      setSentToKitchen(true);
      setPendingPaymentDetails(null);
      if (selectedTable) { setTableCarts(p => ({ ...p, [selectedTable]: { items: cart, guestCount, sent: true } })); setSelectedTable(''); setSelectedTableNum(0); }
      setLastOrder('OK'); setTimeout(() => setLastOrder(null), 3000);
    } finally { setSubmitting(false); }
  };

  const handlePaymentConfirm = (details: PaymentDetails) => {
    setPendingPaymentDetails(details);
    setShowPaymentModal(false);
    // Map PaymentDetails method to existing PaymentMethod type for ticket display
    if (details.method === 'cash') setPaymentMethod('cash');
    else setPaymentMethod('card');
  };

  // Trigger sendToKitchen after payment details are set
  useEffect(() => {
    if (pendingPaymentDetails && !submitting) {
      sendToKitchen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPaymentDetails]);

  const closeOrder = () => {
    // Save to localStorage for Orders page fallback
    try {
      const saved = JSON.parse(localStorage.getItem('pos_completed_orders') || '[]');
      saved.unshift({ _id: String(Date.now()), order_number: Date.now() % 100000, items: cart, total, subtotal: total, tax: 0, status: 'completed', source: 'pos', type: orderType, payment_method: paymentMethod, tip, table_id: selectedTable, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      localStorage.setItem('pos_completed_orders', JSON.stringify(saved.slice(0, 100)));
    } catch { /* ignore */ }
    clearTable(); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setShowTicket(false); setShowPayment(false); resetPaymentFields();
  };
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  // ─── Ticket Print View ─────────────────────────────────────
  if (showTicket) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="bg-white max-w-sm w-full shadow-xl rounded-xl print:shadow-none print:rounded-none">
        <div ref={ticketRef} id="ticket-print" className="p-6 font-mono text-sm print:p-2" style={{ maxWidth: '300px', margin: '0 auto' }}>
          <div className="text-center mb-4">
            <img src="/images/logo.png" alt="Sushi Queen" className="w-16 h-16 mx-auto mb-2" />
            {TICKET_HEADER.split('\n').map((l, i) => <p key={i} className="text-xs">{l}</p>)}
          </div>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="flex justify-between text-xs"><span>Fecha: {dateStr}</span><span>Hora: {timeStr}</span></div>
          {selectedTableNum > 0 && <p className="text-xs">Mesa: {selectedTableNum} | Personas: {guestCount}</p>}
          {customerName && <p className="text-xs">Cliente: {customerName}</p>}
          <div className="border-t border-dashed border-gray-400 my-2" />
          <table className="w-full text-xs"><thead><tr className="border-b border-gray-300"><th className="text-left py-1">Cant</th><th className="text-left py-1">Producto</th><th className="text-right py-1">Precio</th></tr></thead><tbody>
            {cart.map((c, i) => (<tr key={i} className="border-b border-gray-100"><td className="py-1">{c.quantity}</td><td className="py-1">{c.name}</td><td className="py-1 text-right">{fmt(c.line_total)}</td></tr>))}
          </tbody></table>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>{fmt(total)}</span></div>
          {tip > 0 && <div className="flex justify-between text-xs"><span>Propina</span><span>{fmt(tip)}</span></div>}
          <p className="text-xs mt-1">Pago: {paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? `Tarjeta ${cardType === 'credit' ? 'Crédito' : 'Débito'} ****${cardLast4}` : `Transferencia #${transferNumber}`}</p>
          {paymentMethod === 'cash' && cashChange >= 0 && <p className="text-xs">Recibido: {fmt(parseFloat(cashReceived) || 0)} | Cambio: {fmt(cashChange)}</p>}
          <div className="border-t border-dashed border-gray-400 my-3" />
          <div className="text-center text-xs">{TICKET_FOOTER.split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
        </div>
        <div className="p-4 border-t flex gap-2 print:hidden">
          <button onClick={() => setShowTicket(false)} className="flex-1 py-2 rounded-lg border text-sm">Volver</button>
          <button onClick={() => window.print()} className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm">🖨 Imprimir</button>
          <button onClick={closeOrder} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm">✓ Cerrar</button>
        </div>
      </div>
    </div>
  );

  // ─── Main POS View ─────────────────────────────────────────
  return (
    <div className="h-screen bg-gray-100 flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-700 text-sm">← Admin</button>
          <h1 className="text-lg font-bold text-gray-900">Punto de Venta</h1>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar..." className="ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-32 lg:w-48 focus:ring-2 focus:ring-sushi-primary outline-none" />
        </div>
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <button onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${!category ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
          {categories.map(c => (<button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${category === c ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {activeChannel === 'tables' && !selectedTable ? (
            <div>
              {/* Sales Channel Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                {SALES_CHANNELS.map(ch => (
                  <button key={ch.id}
                    onClick={() => switchChannel(ch.id)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeChannel === ch.id
                        ? 'border-b-2 border-sushi-primary text-sushi-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {ch.icon} {ch.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">{zones.map(z => (<button key={z} onClick={() => setActiveZone(z)} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeZone === z ? 'bg-white shadow text-gray-900 border' : 'bg-gray-200 text-gray-600'}`}>{z}</button>))}</div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
                {zoneTables.map(t => {
                  const hasItems = tableHasItems(t._id);
                  const color = hasItems
                    ? 'bg-orange-500 text-white'
                    : t.status === 'occupied'
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500 text-white';
                  return (
                    <button
                      key={t._id}
                      onClick={() => selectTable(t)}
                      className={`${color} rounded-lg p-4 font-bold text-lg hover:scale-105 transition-transform shadow-md`}
                    >
                      {t.number}
                    </button>
                  );
                })}
              </div>
              {lastOrder && <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center"><p className="text-green-700 text-xs font-medium">Comanda enviada a cocina ✓</p></div>}
            </div>
          ) : activeChannel !== 'tables' && !selectedTable ? (
            <div>
              {/* Sales Channel Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                {SALES_CHANNELS.map(ch => (
                  <button key={ch.id}
                    onClick={() => switchChannel(ch.id)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeChannel === ch.id
                        ? 'border-b-2 border-sushi-primary text-sushi-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {ch.icon} {ch.label}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filtered.map(item => (<button key={item._id} onClick={() => addToCart(item)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-left hover:shadow-md hover:border-sushi-primary/30 transition-all active:scale-95">
                    <ProductImage src={item.image_url} alt={item.name} />
                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm font-bold text-sushi-primary">{fmt(item.price)}</p>
                  </button>))}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sushi-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(item => (<button key={item._id} onClick={() => addToCart(item)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-left hover:shadow-md hover:border-sushi-primary/30 transition-all active:scale-95">
                <ProductImage src={item.image_url} alt={item.name} />
                <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-sm font-bold text-sushi-primary">{fmt(item.price)}</p>
              </button>))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col max-h-screen lg:max-h-none">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{orderType === 'dine_in' && selectedTableNum > 0 ? `Mesa ${selectedTableNum}` : activeChannel === 'counter' ? 'Mostrador' : activeChannel === 'express' ? 'Mostrador Express' : activeChannel === 'delivery' ? 'Delivery' : 'Orden Actual'}</h2>
          {orderType === 'dine_in' && selectedTable && <button onClick={goBackToGrid} className="text-xs text-gray-500 hover:text-red-500">← Mesas</button>}
        </div>
        <div className="px-4 py-2 border-b border-gray-100">
          {activeChannel === 'tables' ? (
            <div className="flex gap-2 overflow-x-auto">
              {(['dine_in', 'takeout', 'delivery'] as OrderType[]).map(t => (
                <button key={t} onClick={() => { setOrderType(t); if (t !== 'dine_in') { setSelectedTable(''); setSelectedTableNum(0); } setShowPayment(false); }} className={`flex-1 min-w-[80px] py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${orderType === t ? 'bg-sushi-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {t === 'dine_in' ? 'Mesa' : t === 'takeout' ? 'Para llevar' : 'Delivery'}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
              <span className="text-xs font-medium text-gray-600">
                {activeChannel === 'counter' ? '🏪 Mostrador — Sin mesa asignada' : activeChannel === 'express' ? '⚡ Express — Sin mesa asignada' : '🛵 Delivery'}
              </span>
            </div>
          )}
        </div>
        <div className="px-4 py-2 border-b border-gray-100 space-y-2">
          {orderType === 'dine_in' && selectedTable && (<div className="flex items-center gap-2"><label className="text-xs text-gray-500">Personas:</label><select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-xs">{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}</select></div>)}
          {(activeChannel === 'counter' || activeChannel === 'express') && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
              {activeChannel === 'express' ? '⚡ Orden rápida sin mesa' : '🏪 Orden de mostrador sin mesa'}
            </div>
          )}
          {orderType === 'takeout' && activeChannel === 'tables' && (
            <div className="relative">
              <input value={customerName} onChange={(e) => { setCustomerName(e.target.value); searchCustomers(e.target.value); }} placeholder="Nombre *" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs" />
              <input value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); searchCustomers(e.target.value); }} placeholder="Teléfono *" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs mt-2" />
              {showMatches && customerMatches.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-32 overflow-y-auto">
                  {customerMatches.map(c => (
                    <button key={c._id} onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs border-b last:border-0">
                      <span className="font-medium">{c.name}</span> — {c.phone}
                    </button>
                  ))}
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 mt-2">
                📦 Tracking: Podrás ver el estado en la sección Delivery
              </div>
            </div>
          )}
          {(orderType === 'delivery' || activeChannel === 'delivery') && (<div className="relative"><input value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); searchCustomers(e.target.value); }} placeholder="Teléfono *" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs" />{showMatches && customerMatches.length > 0 && (<div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-32 overflow-y-auto">{customerMatches.map(c => (<button key={c._id} onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs border-b last:border-0"><span className="font-medium">{c.name}</span> — {c.phone}</button>))}</div>)}<input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre *" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs mt-2" /><input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Dirección *" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs mt-2" /></div>)}
        </div>
        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.length === 0 ? (<p className="text-center text-gray-400 text-sm py-8">Agrega productos</p>) : cart.map((item, idx) => (
            <div key={`${item.menu_item_id}-${item.person}-${idx}`} className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900 truncate">{item.name}</p><p className="text-xs text-gray-500">{fmt(item.price)} c/u</p></div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.menu_item_id, item.person, -1)} className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center">-</button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.menu_item_id, item.person, 1)} className="w-6 h-6 rounded-full bg-sushi-primary text-white text-xs flex items-center justify-center">+</button>
                </div>
                <p className="text-sm font-bold text-gray-900 ml-2 w-14 text-right">{fmt(item.line_total)}</p>
              </div>
              {orderType === 'dine_in' && guestCount > 1 && (<select value={item.person} onChange={(e) => changePerson(item.menu_item_id, item.person, Number(e.target.value))} className="mt-1 text-xs border border-gray-200 rounded px-2 py-0.5 bg-white text-gray-600">{Array.from({ length: guestCount }, (_, i) => <option key={i + 1} value={i + 1}>Persona {i + 1}</option>)}</select>)}
            </div>
          ))}
        </div>

        {/* Payment details - only when checking out */}
        {showPayment && (
          <div className="border-t border-gray-100 px-4 py-2 space-y-2 bg-gray-50">
            <div className="flex gap-2">
              {(['cash', 'card', 'transfer'] as PaymentMethod[]).map(m => (
                <button key={m} onClick={() => { setPaymentMethod(m); resetPaymentFields(); }} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${paymentMethod === m ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {m === 'cash' ? 'Efectivo' : m === 'card' ? 'Tarjeta' : 'Transferencia'}
                </button>
              ))}
            </div>
            {paymentMethod === 'cash' && (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs text-gray-500">Paga con:</label><input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" /></div>
                  <div className="flex-1"><label className="text-xs text-gray-500">Propina:</label><input type="number" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" /></div>
                </div>
                {parseFloat(cashReceived) > 0 && <p className="text-xs font-medium text-center">Cambio: <span className={cashChange >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(Math.max(0, cashChange))}</span></p>}
              </div>
            )}
            {paymentMethod === 'card' && (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <button onClick={() => setCardType('debit')} className={`flex-1 py-1 rounded text-xs ${cardType === 'debit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>Débito</button>
                  <button onClick={() => setCardType('credit')} className={`flex-1 py-1 rounded text-xs ${cardType === 'credit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>Crédito</button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs text-gray-500">Últimos 4:</label><input maxLength={4} value={cardLast4} onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))} placeholder="0000" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" /></div>
                  <div className="flex-1"><label className="text-xs text-gray-500">Aprobación:</label><input value={cardApproval} onChange={(e) => setCardApproval(e.target.value)} placeholder="######" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" /></div>
                </div>
                <div><label className="text-xs text-gray-500">Propina:</label><input type="number" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" /></div>
              </div>
            )}
            {paymentMethod === 'transfer' && (
              <div className="space-y-1">
                <div><label className="text-xs text-gray-500">No. Transferencia:</label><input value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)} placeholder="Número de referencia" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" /></div>
                <div><label className="text-xs text-gray-500">Propina:</label><input type="number" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" /></div>
              </div>
            )}
          </div>
        )}
        {/* Total + Actions */}
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-2xl font-bold text-gray-900">{fmt(total)}</span>
          </div>
          {!sentToKitchen && !showPayment ? (
            <button onClick={sendToKitchen} disabled={!canSubmit()} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">{submitting ? 'Enviando...' : '🍳 Enviar a cocina'}</button>
          ) : showPayment ? (
            <div className="space-y-2">
              <button onClick={() => setShowTicket(true)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm">🧾 Imprimir cuenta</button>
              <button onClick={closeOrder} disabled={!canClose()} className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">✓ Cobrar {fmt(total + tip)}</button>
            </div>
          ) : (
            <div className="space-y-2">
              <button onClick={sendToKitchen} disabled={!canSubmit()} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">🍳 Agregar más</button>
              <button onClick={() => setShowPayment(true)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm">💰 Pedir cuenta</button>
            </div>
          )}
        </div>
      </div>

      {/* PaymentModal for takeout/delivery/counter/express orders */}
      {showPaymentModal && (
        <PaymentModal
          total={total}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default POS;

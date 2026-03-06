import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useKitchenOrders } from '../../hooks/useKitchenOrders';

const Kitchen: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { orders, loading, isPolling, updateStatus, markItemPrepared } = useKitchenOrders();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const getElapsedTime = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return diff < 1 ? '<1 min' : `${diff} min`;
  };

  const getTimerColor = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff >= 30) return 'text-red-600 bg-red-50';
    if (diff >= 15) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const confirmed = orders.filter(o => o.status === 'confirmed');
  const preparing = orders.filter(o => o.status === 'preparing');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Polling mode indicator */}
      {isPolling && (
        <div className="bg-yellow-900/50 border border-yellow-600/50 text-yellow-300 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          Modo offline — actualizando cada 5s
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Cocina &mdash; KDS</h1>
          <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
            {orders.length} orden{orders.length !== 1 ? 'es' : ''} activa{orders.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white text-sm">
          ← Volver al admin
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nuevas (Confirmadas) */}
        <div>
          <h2 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            Nuevas ({confirmed.length})
          </h2>
          <div className="space-y-4">
            {confirmed.map(order => (
              <div key={order._id} className="bg-gray-800 rounded-xl border-2 border-yellow-500/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-yellow-400">{order.order_number || order._id.slice(-6).toUpperCase()}</span>
                    <span className="text-xs text-gray-400 capitalize">{order.source} · {order.type}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getTimerColor(order.created_at)}`}>
                    {getElapsedTime(order.created_at)}
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2">
                      <span className="text-sm">
                        <span className="font-bold text-yellow-300">{item.quantity}x</span> {item.name}
                        {item.notes && <span className="text-xs text-gray-400 ml-2">({item.notes})</span>}
                      </span>
                    </div>
                  ))}
                </div>
                {order.notes && <p className="text-xs text-gray-400 mb-3">Nota: {order.notes}</p>}
                <button
                  onClick={() => updateStatus(order._id, 'preparing')}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 rounded-lg transition-colors"
                >
                  Empezar a Preparar
                </button>
              </div>
            ))}
            {confirmed.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay órdenes nuevas</p>
            )}
          </div>
        </div>

        {/* En Preparación */}
        <div>
          <h2 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
            En Preparación ({preparing.length})
          </h2>
          <div className="space-y-4">
            {preparing.map(order => (
              <div key={order._id} className="bg-gray-800 rounded-xl border-2 border-blue-500/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-blue-400">{order.order_number || order._id.slice(-6).toUpperCase()}</span>
                    <span className="text-xs text-gray-400 capitalize">{order.source} · {order.type}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getTimerColor(order.created_at)}`}>
                    {getElapsedTime(order.created_at)}
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {order.items.map((item, i) => {
                    const isPrepared = (order.prepared_items || []).includes(i);
                    return (
                      <div
                        key={i}
                        onClick={() => !isPrepared && markItemPrepared(order._id, i)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                          isPrepared ? 'bg-green-900/30 line-through text-gray-500' : 'bg-gray-700/50 hover:bg-gray-600/50'
                        }`}
                      >
                        <span className="text-sm">
                          <span className="font-bold text-blue-300">{item.quantity}x</span> {item.name}
                        </span>
                        {isPrepared ? (
                          <span className="text-green-400 text-xs">✓ Listo</span>
                        ) : (
                          <span className="text-gray-500 text-xs">Tap para marcar</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => updateStatus(order._id, 'ready')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-colors"
                >
                  Orden Lista
                </button>
              </div>
            ))}
            {preparing.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay órdenes en preparación</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kitchen;

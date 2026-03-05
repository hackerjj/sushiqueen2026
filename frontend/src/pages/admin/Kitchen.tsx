import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import type { Order, ApiResponse } from '../../types';

const Kitchen: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login'); return; }
  }, [isAuthenticated, navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Order[]>>('/admin/orders/kitchen');
      const list = Array.isArray(data.data) ? data.data : [];
      // Play sound if new orders arrived
      if (list.length > prevCountRef.current && prevCountRef.current > 0) {
        playAlert();
      }
      prevCountRef.current = list.length;
      setOrders(list);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, isAuthenticated]);

  const playAlert = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkZeXk4x/cGRcW2N0hJOdoZ2Ui3tnVk1OWm+ImKWmoJOEcl1PR1Bkf5ijn5mNfGlXTk5cdIqcpqSbjHtmVExOX3aOoKajmYl3YlNOVGh+k6KlnpGBbVtTVGJ3jJ2ko5mKd2NWUlhpgJWipJ2QgG1cVlhkd4ycoJ2UiHhrXVlcaH2Pmp+bk4Z2ZVxaYW5+jZiclI2CdGZeXGNufI2Yl5KLgHJlX15ka3qKlJiUjoN2aWJgZWx5h5GVk46DdmliYGVseYeRlZOOg3ZpYmBla3mHkZWTjoN2aWJgZWt5h5GVk46DdmliYA==');
      }
      audioRef.current.play().catch(() => {});
    } catch { /* ignore */ }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status });
      fetchOrders();
    } catch { /* ignore */ }
  };

  const markItemPrepared = async (orderId: string, itemIndex: number) => {
    try {
      await api.patch(`/admin/orders/${orderId}/items/${itemIndex}/prepared`, { item_index: itemIndex });
      fetchOrders();
    } catch { /* ignore */ }
  };

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

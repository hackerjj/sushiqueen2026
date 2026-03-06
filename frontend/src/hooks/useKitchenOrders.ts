import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import type { Order, OrderStatus, ApiResponse } from '../types';

export interface UseKitchenOrdersReturn {
  orders: Order[];
  loading: boolean;
  isPolling: boolean;
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  markItemPrepared: (orderId: string, itemIndex: number) => Promise<void>;
}

const POLL_INTERVAL = 5000;

const ACTIVE_STATUSES: OrderStatus[] = ['confirmed', 'preparing'];

const ALERT_SOUND_DATA =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkZeXk4x/cGRcW2N0hJOdoZ2Ui3tnVk1OWm+ImKWmoJOEcl1PR1Bkf5ijn5mNfGlXTk5cdIqcpqSbjHtmVExOX3aOoKajmYl3YlNOVGh+k6KlnpGBbVtTVGJ3jJ2ko5mKd2NWUlhpgJWipJ2QgG1cVlhkd4ycoJ2UiHhrXVlcaH2Pmp+bk4Z2ZVxaYW5+jZiclI2CdGZeXGNufI2Yl5KLgHJlX15ka3qKlJiUjoN2aWJgZWx5h5GVk46DdmliYGVseYeRlZOOg3ZpYmBla3mHkZWTjoN2aWJgZWt5h5GVk46DdmliYA==';

function playAlertSound(audioRef: React.MutableRefObject<HTMLAudioElement | null>) {
  try {
    if (!audioRef.current) {
      audioRef.current = new Audio(ALERT_SOUND_DATA);
    }
    audioRef.current.play().catch(() => {});
  } catch {
    // Ignore audio errors (e.g. autoplay policy)
  }
}

export function useKitchenOrders(): UseKitchenOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const prevCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsConnectedRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Order[]>>('/admin/orders/kitchen');
      const list = Array.isArray(data.data) ? data.data : [];

      // Client-side safety filter: only keep active statuses
      const filtered = list.filter((o) => ACTIVE_STATUSES.includes(o.status));

      // Play alert sound when new orders arrive
      if (filtered.length > prevCountRef.current && prevCountRef.current > 0) {
        playAlertSound(audioRef);
      }
      prevCountRef.current = filtered.length;
      setOrders(filtered);
    } catch {
      // Keep existing orders on fetch error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Try WebSocket (Pusher) connection
    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    try {
      // Check if Pusher is available globally (configured via Laravel Echo)
      const pusherAvailable =
        typeof window !== 'undefined' &&
        'Pusher' in window &&
        (window as any).Pusher;

      if (pusherAvailable) {
        const PusherClass = (window as any).Pusher;
        const pusherKey = (import.meta as any).env?.VITE_PUSHER_APP_KEY;
        const pusherCluster = (import.meta as any).env?.VITE_PUSHER_APP_CLUSTER || 'us2';

        if (pusherKey) {
          const pusher = new PusherClass(pusherKey, { cluster: pusherCluster });
          const channel = pusher.subscribe('kitchen');

          channel.bind('order.created', (event: { order: Order }) => {
            if (ACTIVE_STATUSES.includes(event.order.status)) {
              setOrders((prev) => [event.order, ...prev]);
              playAlertSound(audioRef);
            }
          });

          channel.bind('order.updated', (event: { order: Order }) => {
            setOrders((prev) =>
              prev
                .map((o) => (o._id === event.order._id ? event.order : o))
                .filter((o) => ACTIVE_STATUSES.includes(o.status))
            );
          });

          wsConnectedRef.current = true;
          setIsPolling(false);

          return () => {
            pusher.unsubscribe('kitchen');
            pusher.disconnect();
          };
        }
      }
    } catch {
      // WebSocket not available, fall through to polling
    }

    // Fallback: polling every 5 seconds
    if (!wsConnectedRef.current) {
      setIsPolling(true);
      pollingInterval = setInterval(fetchOrders, POLL_INTERVAL);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [fetchOrders]);

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        await api.patch(`/admin/orders/${orderId}`, { status });
        // Optimistic update: update local state immediately
        setOrders((prev) =>
          prev
            .map((o) => (o._id === orderId ? { ...o, status } : o))
            .filter((o) => ACTIVE_STATUSES.includes(o.status))
        );
        // Also refetch to ensure consistency
        fetchOrders();
      } catch {
        // Refetch on error to restore correct state
        fetchOrders();
      }
    },
    [fetchOrders]
  );

  const markItemPrepared = useCallback(
    async (orderId: string, itemIndex: number) => {
      try {
        await api.patch(`/admin/orders/${orderId}/items/${itemIndex}/prepared`, {
          item_index: itemIndex,
        });
        // Optimistic update
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? { ...o, prepared_items: [...(o.prepared_items || []), itemIndex] }
              : o
          )
        );
        fetchOrders();
      } catch {
        fetchOrders();
      }
    },
    [fetchOrders]
  );

  return { orders, loading, isPolling, updateStatus, markItemPrepared };
}

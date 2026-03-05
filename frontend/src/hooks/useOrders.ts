import { useState } from 'react';
import api from '../services/api';
import type { Order, CreateOrderPayload, ApiResponse } from '../types';

export function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const createOrder = async (payload: CreateOrderPayload): Promise<Order | null> => {
    try {
      setLoading(true);
      setError(null);

      // Map to the format the backend expects
      const backendPayload = {
        customer: {
          name: payload.customer.name,
          phone: payload.customer.phone,
          email: payload.customer.email || undefined,
          address: payload.customer.address || undefined,
        },
        items: payload.items.map((item) => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          modifiers: item.modifiers || [],
          notes: item.notes || '',
        })),
        notes: payload.notes || '',
        delivery_address: payload.customer.address || '',
        source: payload.source || 'web',
      };

      const { data } = await api.post<ApiResponse<Order>>('/orders', backendPayload);
      setOrder(data.data);
      return data.data;
    } catch (err: any) {
      const message = err?.response?.data?.message
        || err?.response?.data?.error
        || 'Error al crear el pedido. Intentá de nuevo.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const trackOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<ApiResponse<Order>>(`/orders/${orderId}`);
      setOrder(data.data);
      return data.data;
    } catch {
      setError('No se pudo obtener el estado del pedido.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { order, loading, error, createOrder, trackOrder };
}

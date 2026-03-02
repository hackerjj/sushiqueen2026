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
      const { data } = await api.post<ApiResponse<Order>>('/orders', payload);
      setOrder(data.data);
      return data.data;
    } catch {
      setError('Error al crear el pedido. Intentá de nuevo.');
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

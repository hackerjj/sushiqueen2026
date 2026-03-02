import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { MenuItem, ApiResponse } from '../types';
import { menuData } from '../data/menuData';

export function useMenu(category?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = category ? { category } : {};
      const { data } = await api.get<ApiResponse<MenuItem[]>>('/menu', { params });
      setItems(data.data);
    } catch {
      setError(null); // Don't show error, use fallback data
      // Use real menu data as fallback
      const filtered = category
        ? menuData.filter(item => item.category === category)
        : menuData;
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return { items, loading, error, refetch: fetchMenu };
}

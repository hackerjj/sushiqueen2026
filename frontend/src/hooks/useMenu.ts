import { useState, useEffect, useCallback } from 'react';
import type { MenuItem } from '../types';
import { menuData } from '../data/menuData';

export function useMenu(category?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Always use local menuData as primary source (has correct images)
      // API is used for orders/admin, not for public menu display
      const filtered = category
        ? menuData.filter(item => item.category === category)
        : menuData;
      setItems(filtered);
    } catch {
      setError(null);
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

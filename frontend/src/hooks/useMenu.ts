import { useState, useEffect, useCallback } from 'react';
import type { MenuItem } from '../types';
import { menuData } from '../data/menuData';
import api from '../services/api';

/**
 * Flatten the grouped API response into a flat MenuItem array.
 * The public /menu endpoint returns: { data: { "Category": [...items], ... }, total: N }
 */
function flattenGroupedMenu(grouped: Record<string, MenuItem[]>): MenuItem[] {
  return Object.values(grouped).flat();
}

export function useMenu(category?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/menu');
      const grouped = response.data?.data;

      if (!grouped || typeof grouped !== 'object') {
        throw new Error('Invalid API response format');
      }

      let allItems = flattenGroupedMenu(grouped as Record<string, MenuItem[]>);

      if (category) {
        allItems = allItems.filter(item => item.category === category);
      }

      setItems(allItems);
    } catch {
      setError('Error loading menu');
      // Fallback to static menuData if API fails
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

import { useState, useEffect, useCallback } from 'react';
import type { MenuItem } from '../types';
import { menuData } from '../data/menuData';
import api from '../services/api';

export function useMenu(category?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from API first (has real MongoDB IDs needed for orders)
      const endpoint = category ? `/menu/${encodeURIComponent(category)}` : '/menu';
      const { data: response } = await api.get(endpoint);

      // API returns { data: { category: [...] } } or { data: [...] }
      let apiItems: MenuItem[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          apiItems = response.data;
        } else {
          // Grouped by category - flatten
          Object.values(response.data).forEach((catItems: any) => {
            if (Array.isArray(catItems)) {
              apiItems.push(...catItems);
            }
          });
        }
      }

      if (apiItems.length > 0) {
        // Merge API data with local image URLs (API items may lack images)
        const merged = apiItems.map((apiItem) => {
          const localMatch = menuData.find(
            (local) => local.name.toLowerCase() === apiItem.name.toLowerCase()
          );
          return {
            ...apiItem,
            _id: apiItem._id,
            image_url: apiItem.image_url || localMatch?.image_url || '/images/menu/default.jpeg',
          };
        });
        setItems(merged);
      } else {
        // No API items, use local data
        const filtered = category
          ? menuData.filter(item => item.category === category)
          : menuData;
        setItems(filtered);
      }
    } catch {
      // API unavailable, fall back to local data
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

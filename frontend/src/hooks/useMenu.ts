import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { MenuItem, ApiResponse } from '../types';

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
      setError('Error al cargar el menú');
      // Fallback mock data for development
      setItems(getMockMenuItems());
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return { items, loading, error, refetch: fetchMenu };
}

function getMockMenuItems(): MenuItem[] {
  return [
    {
      _id: '1', fudo_id: 'f1', name: 'Dragon Roll', description: 'Tempura de langostino, palta, queso crema, cubierto con salmón y salsa teriyaki', price: 2800, category: 'Rolls', image_url: '/images/sushi-roll-1.jpg', modifiers: [{ name: 'Extra salmón', price: 500 }], available: true, sort_order: 1, created_at: '', updated_at: ''
    },
    {
      _id: '2', fudo_id: 'f2', name: 'Philadelphia Roll', description: 'Salmón, queso crema, palta. Clásico e irresistible', price: 2400, category: 'Rolls', image_url: '/images/sushi-roll-2.jpg', modifiers: [], available: true, sort_order: 2, created_at: '', updated_at: ''
    },
    {
      _id: '3', fudo_id: 'f3', name: 'Nigiri Salmón x5', description: 'Cinco piezas de nigiri de salmón fresco sobre arroz', price: 2200, category: 'Nigiri', image_url: '/images/hero-sushi.jpg', modifiers: [{ name: 'Wasabi extra', price: 100 }], available: true, sort_order: 3, created_at: '', updated_at: ''
    },
    {
      _id: '4', fudo_id: 'f4', name: 'Sashimi Mixto', description: 'Selección de 12 cortes de salmón, atún y langostino', price: 3500, category: 'Sashimi', image_url: '/images/promo-1.jpg', modifiers: [], available: true, sort_order: 4, created_at: '', updated_at: ''
    },
    {
      _id: '5', fudo_id: 'f5', name: 'Combo Familiar', description: '40 piezas variadas: rolls, nigiris y sashimi para compartir', price: 7500, category: 'Combos', image_url: '/images/promo-2.jpg', modifiers: [{ name: 'Agregar gyozas x6', price: 1200 }], available: true, sort_order: 5, created_at: '', updated_at: ''
    },
    {
      _id: '6', fudo_id: 'f6', name: 'Limonada Jengibre', description: 'Limonada casera con jengibre fresco y menta', price: 800, category: 'Bebidas', image_url: '/images/about-sushi.jpg', modifiers: [], available: true, sort_order: 6, created_at: '', updated_at: ''
    },
    {
      _id: '7', fudo_id: 'f7', name: 'Edamame', description: 'Vainas de soja al vapor con sal marina', price: 600, category: 'Extras', image_url: '/images/sushi-roll-1.jpg', modifiers: [], available: true, sort_order: 7, created_at: '', updated_at: ''
    },
    {
      _id: '8', fudo_id: 'f8', name: 'Spicy Tuna Roll', description: 'Atún picante, pepino, palta con topping de cebolla crispy', price: 2600, category: 'Rolls', image_url: '/images/sushi-roll-2.jpg', modifiers: [{ name: 'Extra picante', price: 0 }], available: true, sort_order: 8, created_at: '', updated_at: ''
    },
  ];
}

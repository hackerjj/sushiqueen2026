import { describe, it, expect } from 'vitest';
import { menuData } from '../../data/menuData';
import type { MenuItem } from '../../types';

/**
 * Tests for POS image restoration logic (Task 6.1)
 * Validates: Requirements 5.1, 5.2
 */

// Replicate the enrichImages logic from POS.tsx for testing
const imageByName: Record<string, string> = Object.fromEntries(
  menuData.filter(i => i.image_url).map(i => [i.name.toLowerCase(), i.image_url])
);

function enrichImages(list: MenuItem[]): MenuItem[] {
  return list.map(item =>
    !item.image_url && imageByName[item.name.toLowerCase()]
      ? { ...item, image_url: imageByName[item.name.toLowerCase()] }
      : item
  );
}

describe('POS Image Restoration', () => {
  it('enriches items with empty image_url from menuData lookup', () => {
    const items: MenuItem[] = [
      { _id: '1', name: 'Gohan Especial', description: '', price: 127, category: 'Especialidades', image_url: '', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
    ];
    const result = enrichImages(items);
    expect(result[0].image_url).toBe('/images/menu/Gohan/gohan-especial.jpeg');
  });

  it('preserves existing image_url when already set', () => {
    const items: MenuItem[] = [
      { _id: '1', name: 'Gohan Especial', description: '', price: 127, category: 'Especialidades', image_url: 'https://cdn.example.com/gohan.jpg', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
    ];
    const result = enrichImages(items);
    expect(result[0].image_url).toBe('https://cdn.example.com/gohan.jpg');
  });

  it('leaves image_url empty when no match in menuData', () => {
    const items: MenuItem[] = [
      { _id: '1', name: 'Unknown Product XYZ', description: '', price: 50, category: 'Test', image_url: '', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
    ];
    const result = enrichImages(items);
    expect(result[0].image_url).toBe('');
  });

  it('matches product names case-insensitively', () => {
    const items: MenuItem[] = [
      { _id: '1', name: 'gohan especial', description: '', price: 127, category: 'Especialidades', image_url: '', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
    ];
    const result = enrichImages(items);
    expect(result[0].image_url).toBe('/images/menu/Gohan/gohan-especial.jpeg');
  });

  it('enriches multiple items in a single call', () => {
    const items: MenuItem[] = [
      { _id: '1', name: 'Gohan Especial', description: '', price: 127, category: 'Especialidades', image_url: '', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
      { _id: '2', name: 'Ramen Especial', description: '', price: 164, category: 'Sopas y Ramen', image_url: '', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
      { _id: '3', name: 'Edamames', description: '', price: 89, category: 'Entradas', image_url: 'https://existing.com/img.jpg', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
    ];
    const result = enrichImages(items);
    expect(result[0].image_url).toBe('/images/menu/Gohan/gohan-especial.jpeg');
    expect(result[1].image_url).toBe('/images/menu/Sopas y Ramen/ramen-especial.jpeg');
    expect(result[2].image_url).toBe('https://existing.com/img.jpg');
  });

  it('menuData lookup map has entries for known products', () => {
    expect(imageByName['gohan especial']).toBeTruthy();
    expect(imageByName['ramen especial']).toBeTruthy();
    expect(imageByName['edamames']).toBeTruthy();
  });
});

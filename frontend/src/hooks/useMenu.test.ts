import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMenu } from './useMenu';
import api from '../services/api';
import { menuData } from '../data/menuData';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const mockApiGet = vi.mocked(api.get);

const sampleGroupedResponse = {
  data: {
    data: {
      'Especialidades': [
        { _id: '1', name: 'Gohan Especial', price: 127, category: 'Especialidades', image_url: '/img/gohan.jpg', description: '', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
      ],
      'Sopas y Ramen': [
        { _id: '2', name: 'Ramen Especial', price: 164, category: 'Sopas y Ramen', image_url: '/img/ramen.jpg', description: '', modifiers: [], available: true, sort_order: 1, created_at: '', updated_at: '' },
      ],
    },
    total: 2,
  },
};

describe('useMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches menu from API and flattens grouped response', async () => {
    mockApiGet.mockResolvedValueOnce(sampleGroupedResponse);

    const { result } = renderHook(() => useMenu());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApiGet).toHaveBeenCalledWith('/menu');
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].name).toBe('Gohan Especial');
    expect(result.current.items[1].name).toBe('Ramen Especial');
    expect(result.current.error).toBeNull();
  });

  it('filters by category when provided', async () => {
    mockApiGet.mockResolvedValueOnce(sampleGroupedResponse);

    const { result } = renderHook(() => useMenu('Especialidades'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].category).toBe('Especialidades');
  });

  it('falls back to menuData on API error', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useMenu());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Error loading menu');
    expect(result.current.items).toEqual(menuData);
  });

  it('falls back to filtered menuData on API error with category', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useMenu('Entradas'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const expected = menuData.filter(i => i.category === 'Entradas');
    expect(result.current.items).toEqual(expected);
    expect(result.current.items.length).toBeGreaterThan(0);
  });

  it('falls back on invalid API response format', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { data: null } });

    const { result } = renderHook(() => useMenu());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Error loading menu');
    expect(result.current.items).toEqual(menuData);
  });

  it('starts with loading true', () => {
    mockApiGet.mockReturnValueOnce(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useMenu());

    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
  });
});

/**
 * ============================================
 * Sushi Queen - Cart Store Tests
 * Tests for Zustand cart store logic
 * ============================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCartStore } from '../store/cartStore';
import type { CartItem } from '../types';

// ─── Test Helpers ───────────────────────────

const createCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  menu_item_id: 'item-001',
  name: 'California Roll',
  quantity: 1,
  price: 15.99,
  modifiers: [],
  ...overrides,
});

const createCartItemWithModifiers = (): CartItem => ({
  menu_item_id: 'item-002',
  name: 'Dragon Roll',
  quantity: 1,
  price: 18.50,
  modifiers: [
    { name: 'Extra Avocado', price: 2.00 },
    { name: 'Spicy Mayo', price: 1.50 },
  ],
});

// ─── Tests ──────────────────────────────────

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useCartStore.getState().clearCart();
    });
  });

  // ─── addItem ────────────────────────────────

  describe('addItem', () => {
    it('should add a new item to empty cart', () => {
      const item = createCartItem();

      act(() => {
        useCartStore.getState().addItem(item);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].menu_item_id).toBe('item-001');
      expect(items[0].name).toBe('California Roll');
      expect(items[0].quantity).toBe(1);
    });

    it('should increment quantity when adding existing item', () => {
      const item = createCartItem({ quantity: 1 });

      act(() => {
        useCartStore.getState().addItem(item);
        useCartStore.getState().addItem(item);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('should add multiple different items', () => {
      const item1 = createCartItem({ menu_item_id: 'item-001', name: 'California Roll' });
      const item2 = createCartItem({ menu_item_id: 'item-002', name: 'Salmon Nigiri' });

      act(() => {
        useCartStore.getState().addItem(item1);
        useCartStore.getState().addItem(item2);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
    });

    it('should add item with custom quantity', () => {
      const item = createCartItem({ quantity: 3 });

      act(() => {
        useCartStore.getState().addItem(item);
      });

      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(3);
    });

    it('should accumulate quantity for same item added multiple times', () => {
      const item = createCartItem({ quantity: 2 });

      act(() => {
        useCartStore.getState().addItem(item);
        useCartStore.getState().addItem(createCartItem({ quantity: 3 }));
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });
  });

  // ─── removeItem ─────────────────────────────

  describe('removeItem', () => {
    it('should remove an item from cart', () => {
      const item = createCartItem();

      act(() => {
        useCartStore.getState().addItem(item);
        useCartStore.getState().removeItem('item-001');
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it('should only remove the specified item', () => {
      const item1 = createCartItem({ menu_item_id: 'item-001' });
      const item2 = createCartItem({ menu_item_id: 'item-002', name: 'Salmon Nigiri' });

      act(() => {
        useCartStore.getState().addItem(item1);
        useCartStore.getState().addItem(item2);
        useCartStore.getState().removeItem('item-001');
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].menu_item_id).toBe('item-002');
    });

    it('should handle removing non-existent item gracefully', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem());
        useCartStore.getState().removeItem('non-existent-id');
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
    });
  });

  // ─── updateQuantity ─────────────────────────

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem());
        useCartStore.getState().updateQuantity('item-001', 5);
      });

      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem());
        useCartStore.getState().updateQuantity('item-001', 0);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it('should remove item when quantity is negative', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem());
        useCartStore.getState().updateQuantity('item-001', -1);
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it('should not affect other items when updating quantity', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-001' }));
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-002', name: 'Nigiri' }));
        useCartStore.getState().updateQuantity('item-001', 10);
      });

      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(10);
      expect(items[1].quantity).toBe(1);
    });
  });

  // ─── clearCart ──────────────────────────────

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-001' }));
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-002' }));
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-003' }));
        useCartStore.getState().clearCart();
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it('should handle clearing an already empty cart', () => {
      act(() => {
        useCartStore.getState().clearCart();
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });

  // ─── getTotal ───────────────────────────────

  describe('getTotal', () => {
    it('should return 0 for empty cart', () => {
      const total = useCartStore.getState().getTotal();
      expect(total).toBe(0);
    });

    it('should calculate total for single item', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem({ price: 15.99, quantity: 1 }));
      });

      const total = useCartStore.getState().getTotal();
      expect(total).toBeCloseTo(15.99);
    });

    it('should calculate total with quantity', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem({ price: 10.00, quantity: 3 }));
      });

      const total = useCartStore.getState().getTotal();
      expect(total).toBeCloseTo(30.00);
    });

    it('should include modifier prices in total', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItemWithModifiers());
      });

      // price: 18.50 + modifiers: 2.00 + 1.50 = 22.00 * quantity: 1
      const total = useCartStore.getState().getTotal();
      expect(total).toBeCloseTo(22.00);
    });

    it('should calculate total for multiple items with modifiers', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem({ price: 10.00, quantity: 2 }));
        useCartStore.getState().addItem(createCartItemWithModifiers());
      });

      // Item 1: 10.00 * 2 = 20.00
      // Item 2: (18.50 + 2.00 + 1.50) * 1 = 22.00
      // Total: 42.00
      const total = useCartStore.getState().getTotal();
      expect(total).toBeCloseTo(42.00);
    });
  });

  // ─── getItemCount ───────────────────────────

  describe('getItemCount', () => {
    it('should return 0 for empty cart', () => {
      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(0);
    });

    it('should return total quantity across all items', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-001', quantity: 2 }));
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-002', quantity: 3 }));
      });

      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(5);
    });

    it('should update count after removing item', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-001', quantity: 2 }));
        useCartStore.getState().addItem(createCartItem({ menu_item_id: 'item-002', quantity: 3 }));
        useCartStore.getState().removeItem('item-001');
      });

      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(3);
    });

    it('should update count after quantity change', () => {
      act(() => {
        useCartStore.getState().addItem(createCartItem({ quantity: 1 }));
        useCartStore.getState().updateQuantity('item-001', 5);
      });

      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(5);
    });
  });
});

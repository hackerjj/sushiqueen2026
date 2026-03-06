import { describe, it, expect } from 'vitest';
import { computePredominantOrderType } from './customerMetrics';

describe('computePredominantOrderType', () => {
  it('returns null for empty orders', () => {
    expect(computePredominantOrderType([])).toBeNull();
  });

  it('returns null for undefined/null input', () => {
    expect(computePredominantOrderType(null as any)).toBeNull();
  });

  it('returns "local" when most orders are dine_in/takeout from POS', () => {
    const orders = [
      { type: 'dine_in', source: 'pos' },
      { type: 'takeout', source: 'pos' },
      { type: 'dine_in', source: 'pos' },
      { type: 'delivery', source: 'pos' },
    ];
    expect(computePredominantOrderType(orders)).toBe('local');
  });

  it('returns "delivery" when most orders are delivery type', () => {
    const orders = [
      { type: 'delivery', source: 'pos' },
      { type: 'delivery', source: 'web' },
      { type: 'dine_in', source: 'pos' },
    ];
    expect(computePredominantOrderType(orders)).toBe('delivery');
  });

  it('returns "app" when most orders come from web/whatsapp/facebook sources', () => {
    const orders = [
      { type: 'takeout', source: 'web' },
      { type: 'takeout', source: 'whatsapp' },
      { type: 'takeout', source: 'facebook' },
      { type: 'dine_in', source: 'pos' },
    ];
    expect(computePredominantOrderType(orders)).toBe('app');
  });

  it('delivery type takes priority over app source', () => {
    // Even if source is web, type=delivery maps to delivery
    const orders = [
      { type: 'delivery', source: 'web' },
      { type: 'delivery', source: 'web' },
    ];
    expect(computePredominantOrderType(orders)).toBe('delivery');
  });

  it('handles single order correctly', () => {
    expect(computePredominantOrderType([{ type: 'dine_in', source: 'pos' }])).toBe('local');
    expect(computePredominantOrderType([{ type: 'delivery', source: 'pos' }])).toBe('delivery');
    expect(computePredominantOrderType([{ type: 'takeout', source: 'web' }])).toBe('app');
  });

  it('handles orders with missing type/source fields', () => {
    const orders = [
      { type: undefined, source: undefined },
      { type: undefined, source: 'pos' },
    ];
    // Both should map to local (default)
    expect(computePredominantOrderType(orders)).toBe('local');
  });
});

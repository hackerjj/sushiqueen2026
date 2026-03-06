import { describe, it, expect } from 'vitest';
import { mapDashboardResponse } from './mapDashboardResponse';

describe('mapDashboardResponse', () => {
  it('maps a complete backend response correctly', () => {
    const raw = {
      sales_today: 1500,
      sales_week: 8000,
      sales_month: 32000,
      orders_today: 12,
      orders_week: 65,
      new_customers_week: 5,
      top_items: [
        { name: 'Sushi Roll', count: 42 },
        { name: 'Ramen', count: 30 },
      ],
    };

    const result = mapDashboardResponse(raw);

    expect(result.sales_today).toBe(1500);
    expect(result.sales_week).toBe(8000);
    expect(result.sales_month).toBe(32000);
    expect(result.orders_today).toBe(12);
    expect(result.orders_week).toBe(65);
    expect(result.new_customers_week).toBe(5);
    expect(result.top_items).toEqual([
      { name: 'Sushi Roll', count: 42 },
      { name: 'Ramen', count: 30 },
    ]);
  });

  it('returns defaults for null input', () => {
    const result = mapDashboardResponse(null);

    expect(result.sales_today).toBe(0);
    expect(result.sales_week).toBe(0);
    expect(result.sales_month).toBe(0);
    expect(result.orders_today).toBe(0);
    expect(result.orders_week).toBe(0);
    expect(result.new_customers_week).toBe(0);
    expect(result.top_items).toEqual([]);
  });

  it('returns defaults for undefined input', () => {
    const result = mapDashboardResponse(undefined);

    expect(result.sales_today).toBe(0);
    expect(result.top_items).toEqual([]);
  });

  it('returns defaults for empty object', () => {
    const result = mapDashboardResponse({});

    expect(result.sales_today).toBe(0);
    expect(result.sales_week).toBe(0);
    expect(result.sales_month).toBe(0);
    expect(result.orders_today).toBe(0);
    expect(result.orders_week).toBe(0);
    expect(result.new_customers_week).toBe(0);
    expect(result.top_items).toEqual([]);
  });

  it('handles legacy format with today/month nested objects', () => {
    const raw = {
      today: { revenue: 2000, orders: 15 },
      month: { revenue: 50000 },
      total_customers: 8,
    };

    const result = mapDashboardResponse(raw);

    expect(result.sales_today).toBe(2000);
    expect(result.sales_month).toBe(50000);
    expect(result.orders_today).toBe(15);
    expect(result.new_customers_week).toBe(8);
  });

  it('prefers new format fields over legacy fallbacks', () => {
    const raw = {
      sales_today: 3000,
      today: { revenue: 2000, orders: 10 },
      sales_month: 40000,
      month: { revenue: 30000 },
      orders_today: 20,
      new_customers_week: 7,
      total_customers: 3,
    };

    const result = mapDashboardResponse(raw);

    expect(result.sales_today).toBe(3000);
    expect(result.sales_month).toBe(40000);
    expect(result.orders_today).toBe(20);
    expect(result.new_customers_week).toBe(7);
  });

  it('handles top_items with _id instead of name', () => {
    const raw = {
      top_items: [
        { _id: 'Tempura', count: 25 },
        { _id: 'Gyoza', quantity: 18 },
      ],
    };

    const result = mapDashboardResponse(raw);

    expect(result.top_items).toEqual([
      { name: 'Tempura', count: 25 },
      { name: 'Gyoza', count: 18 },
    ]);
  });

  it('handles top_items with quantity instead of count', () => {
    const raw = {
      top_items: [{ name: 'Edamame', quantity: 10 }],
    };

    const result = mapDashboardResponse(raw);

    expect(result.top_items[0].count).toBe(10);
  });

  it('handles non-array top_items gracefully', () => {
    const raw = { top_items: 'invalid' };
    const result = mapDashboardResponse(raw);
    expect(result.top_items).toEqual([]);
  });

  it('handles top_items as null', () => {
    const raw = { top_items: null };
    const result = mapDashboardResponse(raw);
    expect(result.top_items).toEqual([]);
  });

  it('ensures all numeric fields are >= 0 when fields are 0', () => {
    const raw = {
      sales_today: 0,
      sales_week: 0,
      sales_month: 0,
      orders_today: 0,
      orders_week: 0,
      new_customers_week: 0,
    };

    const result = mapDashboardResponse(raw);

    expect(result.sales_today).toBe(0);
    expect(result.sales_week).toBe(0);
    expect(result.sales_month).toBe(0);
    expect(result.orders_today).toBe(0);
    expect(result.orders_week).toBe(0);
    expect(result.new_customers_week).toBe(0);
  });
});

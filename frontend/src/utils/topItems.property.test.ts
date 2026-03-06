import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mapDashboardResponse } from './mapDashboardResponse';

/**
 * **Validates: Requirements 1.3**
 *
 * Property 2: Top items ordenados descendentemente
 *
 * Para cualquier lista de productos más vendidos retornada por el dashboard,
 * los productos deben estar ordenados por cantidad vendida (count) de forma
 * descendente, y la lista no debe exceder 10 elementos.
 *
 * The backend is responsible for sorting and limiting to 10 items.
 * mapDashboardResponse preserves the order from the backend.
 * This test verifies that when the backend provides pre-sorted top_items
 * (as it should), the mapping preserves that sort order and length <= 10.
 */
describe('Property: Top items ordenados descendentemente', () => {
  /**
   * Generator for a single top item as the backend would return it.
   * Backend returns { name: string, count: number } or { _id: string, count: number }.
   */
  const topItemBackendArb = fc.record({
    name: fc.string({ minLength: 1 }),
    count: fc.nat({ max: 10000 }),
  });

  /**
   * Generator for a pre-sorted (descending by count) array of top items
   * with at most 10 elements — simulating what the backend provides.
   */
  const sortedTopItemsArb = fc
    .array(topItemBackendArb, { minLength: 0, maxLength: 10 })
    .map((items) => [...items].sort((a, b) => b.count - a.count));

  /**
   * Generator for a backend response containing sorted top_items.
   */
  const rawResponseWithSortedTopItemsArb = sortedTopItemsArb.map((topItems) => ({
    sales_today: 0,
    sales_week: 0,
    sales_month: 0,
    orders_today: 0,
    orders_week: 0,
    new_customers_week: 0,
    top_items: topItems,
  }));

  it('preserves descending order by count when backend provides sorted top_items', () => {
    fc.assert(
      fc.property(rawResponseWithSortedTopItemsArb, (raw) => {
        const result = mapDashboardResponse(raw);

        for (let i = 1; i < result.top_items.length; i++) {
          expect(result.top_items[i - 1].count).toBeGreaterThanOrEqual(
            result.top_items[i].count,
          );
        }
      }),
      { numRuns: 200 },
    );
  });

  it('top_items length never exceeds 10 when backend provides <= 10 items', () => {
    fc.assert(
      fc.property(rawResponseWithSortedTopItemsArb, (raw) => {
        const result = mapDashboardResponse(raw);
        expect(result.top_items.length).toBeLessThanOrEqual(10);
      }),
      { numRuns: 200 },
    );
  });
});

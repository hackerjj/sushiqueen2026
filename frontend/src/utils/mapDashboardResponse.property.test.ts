import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mapDashboardResponse } from './mapDashboardResponse';

/**
 * **Validates: Requirements 1.1, 1.2**
 *
 * Property 1: Dashboard KPIs siempre válidos
 *
 * Para cualquier respuesta del backend (incluyendo campos nulos, faltantes o
 * con formatos antiguos), la función mapDashboardResponse debe producir un
 * objeto DashboardKPIs donde todos los campos numéricos sean >= 0 y
 * top_items sea siempre un array con items válidos.
 */
describe('Property: Dashboard KPIs siempre válidos', () => {
  /** Generator for legacy nested format fields */
  const legacyNestedArb = fc.record({
    revenue: fc.oneof(fc.nat(), fc.constant(undefined)),
    orders: fc.oneof(fc.nat(), fc.constant(undefined)),
  }, { requiredKeys: [] });

  /** Generator for top_items in various formats */
  const topItemArb = fc.oneof(
    fc.record({ name: fc.string(), count: fc.nat() }),
    fc.record({ _id: fc.string(), count: fc.nat() }),
    fc.record({ name: fc.string(), quantity: fc.nat() }),
    fc.record({ _id: fc.string(), quantity: fc.nat() }),
    fc.record({}),
  );

  const topItemsArb = fc.oneof(
    fc.array(topItemArb),
    fc.constant(null),
    fc.constant(undefined),
    fc.constant('invalid'),
    fc.constant(42),
  );

  /** Generator for arbitrary backend responses */
  const rawResponseArb = fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.constant({}),
    fc.constant('string'),
    fc.constant(42),
    fc.record({
      sales_today: fc.oneof(fc.nat(), fc.constant(null), fc.constant(undefined)),
      sales_week: fc.oneof(fc.nat(), fc.constant(null), fc.constant(undefined)),
      sales_month: fc.oneof(fc.nat(), fc.constant(null), fc.constant(undefined)),
      orders_today: fc.oneof(fc.nat(), fc.constant(null), fc.constant(undefined)),
      orders_week: fc.oneof(fc.nat(), fc.constant(null), fc.constant(undefined)),
      new_customers_week: fc.oneof(fc.nat(), fc.constant(null), fc.constant(undefined)),
      top_items: topItemsArb,
      today: fc.oneof(legacyNestedArb, fc.constant(undefined)),
      month: fc.oneof(legacyNestedArb, fc.constant(undefined)),
      total_customers: fc.oneof(fc.nat(), fc.constant(undefined)),
    }, { requiredKeys: [] }),
    fc.anything(),
  );

  it('all numeric KPI fields are >= 0 for any input', () => {
    fc.assert(
      fc.property(rawResponseArb, (raw) => {
        const result = mapDashboardResponse(raw);

        expect(result.sales_today).toBeGreaterThanOrEqual(0);
        expect(result.sales_week).toBeGreaterThanOrEqual(0);
        expect(result.sales_month).toBeGreaterThanOrEqual(0);
        expect(result.orders_today).toBeGreaterThanOrEqual(0);
        expect(result.orders_week).toBeGreaterThanOrEqual(0);
        expect(result.new_customers_week).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 200 },
    );
  });

  it('top_items is always an array for any input', () => {
    fc.assert(
      fc.property(rawResponseArb, (raw) => {
        const result = mapDashboardResponse(raw);
        expect(Array.isArray(result.top_items)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('each item in top_items has a string name and numeric count', () => {
    fc.assert(
      fc.property(rawResponseArb, (raw) => {
        const result = mapDashboardResponse(raw);

        for (const item of result.top_items) {
          expect(typeof item.name).toBe('string');
          expect(typeof item.count).toBe('number');
          expect(item.count).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 200 },
    );
  });
});

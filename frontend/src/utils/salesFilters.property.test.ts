import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterOrdersByCustomer, calculateCustomerTotal } from './salesFilters';
import type { Order } from '../types';

/**
 * **Validates: Requirements 9.1, 9.2**
 *
 * Property 11: Filtro de ventas por cliente
 *
 * Para cualquier filtro de cliente aplicado en la vista de ventas, todas las
 * órdenes retornadas deben pertenecer al cliente seleccionado, y el total
 * acumulado debe ser igual a la suma de los totales de esas órdenes.
 */

/** Minimal Order generator with relevant fields for sales filtering */
const orderArb = (customerIds: string[]): fc.Arbitrary<Order> =>
  fc.record({
    _id: fc.uuid(),
    order_number: fc.stringMatching(/^ORD-[0-9]{4}$/),
    customer_id: fc.constantFrom(...customerIds),
    items: fc.constant([]),
    subtotal: fc.double({ min: 0, max: 10000, noNaN: true }),
    tax: fc.double({ min: 0, max: 1000, noNaN: true }),
    total: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    status: fc.constantFrom(
      'pending' as const,
      'confirmed' as const,
      'preparing' as const,
      'ready' as const,
      'delivered' as const,
      'cancelled' as const,
    ),
    source: fc.constantFrom('web' as const, 'pos' as const, 'phone' as const),
    type: fc.constantFrom('dine_in' as const, 'takeout' as const, 'delivery' as const),
    notes: fc.constant(''),
    delivery_address: fc.constant(''),
    payment_method: fc.constantFrom('cash' as const, 'card' as const, 'transfer' as const),
    payment_status: fc.constantFrom('pending' as const, 'paid' as const),
    tip: fc.constant(0),
    prepared_items: fc.constant([]),
    created_at: fc.constant(new Date().toISOString()),
  }) as fc.Arbitrary<Order>;

/** Generator for a set of customer IDs (at least 2 to make filtering meaningful) */
const customerIdsArb = fc.array(fc.uuid(), { minLength: 2, maxLength: 5 });

describe('Property: Filtro de ventas por cliente', () => {
  it('all returned orders have customer_id matching the filter', () => {
    fc.assert(
      fc.property(
        customerIdsArb.chain((ids) =>
          fc.tuple(
            fc.array(orderArb(ids), { minLength: 1, maxLength: 30 }),
            fc.constantFrom(...ids),
          ),
        ),
        ([orders, customerId]) => {
          const filtered = filterOrdersByCustomer(orders, customerId);
          for (const order of filtered) {
            expect(order.customer_id).toBe(customerId);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('accumulated total equals the sum of totals of filtered orders', () => {
    fc.assert(
      fc.property(
        customerIdsArb.chain((ids) =>
          fc.tuple(
            fc.array(orderArb(ids), { minLength: 1, maxLength: 30 }),
            fc.constantFrom(...ids),
          ),
        ),
        ([orders, customerId]) => {
          const total = calculateCustomerTotal(orders, customerId);
          const filtered = filterOrdersByCustomer(orders, customerId);
          const manualSum = filtered.reduce((sum, o) => sum + o.total, 0);
          expect(total).toBeCloseTo(manualSum, 10);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('results are a subset of input orders', () => {
    fc.assert(
      fc.property(
        customerIdsArb.chain((ids) =>
          fc.tuple(
            fc.array(orderArb(ids), { minLength: 0, maxLength: 30 }),
            fc.constantFrom(...ids),
          ),
        ),
        ([orders, customerId]) => {
          const filtered = filterOrdersByCustomer(orders, customerId);
          expect(filtered.length).toBeLessThanOrEqual(orders.length);
          for (const order of filtered) {
            expect(orders).toContain(order);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('filtering by a non-existent customer returns empty array and total 0', () => {
    fc.assert(
      fc.property(
        customerIdsArb.chain((ids) =>
          fc.tuple(
            fc.array(orderArb(ids), { minLength: 0, maxLength: 20 }),
            fc.uuid().filter((id) => !ids.includes(id)),
          ),
        ),
        ([orders, nonExistentId]) => {
          const filtered = filterOrdersByCustomer(orders, nonExistentId);
          const total = calculateCustomerTotal(orders, nonExistentId);
          expect(filtered).toEqual([]);
          expect(total).toBe(0);
        },
      ),
      { numRuns: 200 },
    );
  });
});

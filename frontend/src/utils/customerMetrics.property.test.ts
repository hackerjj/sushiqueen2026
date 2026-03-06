import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeCustomerMetrics } from './customerMetrics';
import type { Order } from '../types';

/**
 * **Validates: Requirements 12.2, 12.3**
 *
 * Property 15: Consistencia de datos de cliente
 *
 * Para cualquier cliente, `total_orders` debe ser igual al conteo de órdenes
 * donde `customer_id` coincide con el ID del cliente, y `total_spent` debe ser
 * igual a la suma del campo `total` de esas órdenes.
 */

/** Generator for a minimal Order with the fields relevant to customer metrics */
const orderArb = (customerIds: string[]): fc.Arbitrary<Order> =>
  fc.record({
    _id: fc.uuid(),
    order_number: fc.string({ minLength: 1, maxLength: 10 }),
    customer_id: fc.oneof(
      fc.constantFrom(...customerIds),
      fc.uuid(), // orders from other customers
    ),
    items: fc.constant([]),
    subtotal: fc.double({ min: 0, max: 10000, noNaN: true }),
    tax: fc.double({ min: 0, max: 1000, noNaN: true }),
    total: fc.double({ min: 0, max: 10000, noNaN: true }),
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
    notes: fc.string({ maxLength: 50 }),
    delivery_address: fc.string({ maxLength: 100 }),
    payment_method: fc.constantFrom('cash' as const, 'card' as const, 'transfer' as const),
    payment_status: fc.constantFrom('pending' as const, 'paid' as const),
    tip: fc.double({ min: 0, max: 100, noNaN: true }),
    prepared_items: fc.constant([] as number[]),
    created_at: fc.constant(new Date().toISOString()),
  }) as fc.Arbitrary<Order>;

describe('Property 15: Consistencia de datos de cliente', () => {
  it('total_orders equals the count of orders with matching customer_id', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }).chain((ids) =>
          fc.array(orderArb(ids), { minLength: 0, maxLength: 30 }).map(
            (orders) => ({ targetId: ids[0], orders }),
          ),
        ),
        ({ targetId, orders }) => {
          const result = computeCustomerMetrics(targetId, orders);
          const expectedCount = orders.filter(
            (o) => o.customer_id === targetId,
          ).length;
          expect(result.total_orders).toBe(expectedCount);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('total_spent equals the sum of total of orders with matching customer_id', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }).chain((ids) =>
          fc.array(orderArb(ids), { minLength: 0, maxLength: 30 }).map(
            (orders) => ({ targetId: ids[0], orders }),
          ),
        ),
        ({ targetId, orders }) => {
          const result = computeCustomerMetrics(targetId, orders);
          const expectedSpent = orders
            .filter((o) => o.customer_id === targetId)
            .reduce((sum, o) => sum + o.total, 0);
          expect(result.total_spent).toBeCloseTo(expectedSpent, 5);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('customer with no matching orders has total_orders === 0 and total_spent === 0', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(orderArb(['other-id-1', 'other-id-2']), {
          minLength: 0,
          maxLength: 20,
        }),
        (customerId, orders) => {
          // Ensure none of the orders belong to this customer
          const filtered = orders.filter(
            (o) => o.customer_id !== customerId,
          );
          const result = computeCustomerMetrics(customerId, filtered);
          expect(result.total_orders).toBe(0);
          expect(result.total_spent).toBe(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('total_orders is always >= 0 and total_spent is always >= 0', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }).chain((ids) =>
          fc.array(orderArb(ids), { minLength: 0, maxLength: 30 }),
        ),
        (customerId, orders) => {
          const result = computeCustomerMetrics(customerId, orders);
          expect(result.total_orders).toBeGreaterThanOrEqual(0);
          expect(result.total_spent).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 200 },
    );
  });
});

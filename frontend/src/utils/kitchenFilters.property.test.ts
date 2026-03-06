import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterKitchenOrders } from './kitchenFilters';
import type { Order, OrderStatus } from '../types';

/**
 * **Validates: Requirements 2.3, 2.6**
 *
 * Property 4: Filtrado de órdenes en KDS
 *
 * Para cualquier conjunto de órdenes con estados variados, el KDS debe mostrar
 * únicamente órdenes con estado "confirmed" o "preparing", ordenadas por
 * `created_at` ascendente (la más antigua primero). Órdenes con estado "ready",
 * "delivered" o "cancelled" nunca deben aparecer.
 */

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'cancelled',
];

const KDS_VISIBLE: OrderStatus[] = ['confirmed', 'preparing'];
const KDS_EXCLUDED: OrderStatus[] = ['ready', 'delivered', 'cancelled'];

const orderStatusArb: fc.Arbitrary<OrderStatus> = fc.constantFrom(...ALL_STATUSES);

/** Generates a minimal Order with a realistic created_at timestamp */
function orderArb(): fc.Arbitrary<Order> {
  return fc.record({
    _id: fc.uuid(),
    order_number: fc.string({ minLength: 1, maxLength: 10 }),
    customer_id: fc.uuid(),
    items: fc.constant([]),
    subtotal: fc.float({ min: 0, max: 10000, noNaN: true }),
    tax: fc.float({ min: 0, max: 1000, noNaN: true }),
    total: fc.float({ min: 0, max: 10000, noNaN: true }),
    status: orderStatusArb,
    source: fc.constantFrom('web', 'whatsapp', 'facebook', 'phone', 'pos') as fc.Arbitrary<Order['source']>,
    type: fc.constantFrom('dine_in', 'takeout', 'delivery') as fc.Arbitrary<Order['type']>,
    notes: fc.string(),
    delivery_address: fc.string(),
    payment_method: fc.constantFrom('cash', 'card', 'transfer', 'pending') as fc.Arbitrary<Order['payment_method']>,
    payment_status: fc.constantFrom('pending', 'paid', 'refunded') as fc.Arbitrary<Order['payment_status']>,
    tip: fc.float({ min: 0, max: 500, noNaN: true }),
    prepared_items: fc.constant([] as number[]),
    created_at: fc
      .integer({ min: new Date('2024-01-01').getTime(), max: new Date('2025-12-31').getTime() })
      .map((ts) => new Date(ts).toISOString()),
  });
}

const ordersArb = fc.array(orderArb(), { minLength: 0, maxLength: 30 });

describe('Property 4: Filtrado de órdenes en KDS', () => {
  it('only returns orders with status "confirmed" or "preparing"', () => {
    fc.assert(
      fc.property(ordersArb, (orders) => {
        const result = filterKitchenOrders(orders);

        for (const order of result) {
          expect(KDS_VISIBLE).toContain(order.status);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('never includes orders with status "ready", "delivered", or "cancelled"', () => {
    fc.assert(
      fc.property(ordersArb, (orders) => {
        const result = filterKitchenOrders(orders);

        for (const order of result) {
          expect(KDS_EXCLUDED).not.toContain(order.status);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('result is sorted by created_at ascending (oldest first)', () => {
    fc.assert(
      fc.property(ordersArb, (orders) => {
        const result = filterKitchenOrders(orders);

        for (let i = 1; i < result.length; i++) {
          const prev = new Date(result[i - 1].created_at).getTime();
          const curr = new Date(result[i].created_at).getTime();
          expect(prev).toBeLessThanOrEqual(curr);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('result is a subset of the input (no new orders created)', () => {
    fc.assert(
      fc.property(ordersArb, (orders) => {
        const result = filterKitchenOrders(orders);
        const inputIds = new Set(orders.map((o) => o._id));

        for (const order of result) {
          expect(inputIds.has(order._id)).toBe(true);
        }

        expect(result.length).toBeLessThanOrEqual(orders.length);
      }),
      { numRuns: 200 },
    );
  });
});

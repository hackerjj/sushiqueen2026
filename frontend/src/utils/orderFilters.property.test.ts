import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterNonCancelledOrders, calculateSalesTotal } from './orderFilters';
import type { Order, OrderStatus } from '../types';

/**
 * **Validates: Requirements 1.6, 17.5**
 *
 * Property 3: Exclusión de órdenes canceladas en cálculos de ventas
 *
 * Para cualquier conjunto de órdenes con estados variados, los cálculos de
 * ventas totales (en dashboard y revenue) deben excluir todas las órdenes
 * con estado "cancelled".
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

const orderStatusArb: fc.Arbitrary<OrderStatus> = fc.constantFrom(...ALL_STATUSES);

/** Generates a minimal Order object with the fields relevant to filtering/sales */
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
    created_at: fc.constant(new Date().toISOString()),
  });
}

const ordersArb = fc.array(orderArb(), { minLength: 0, maxLength: 30 });

describe('Property 3: Exclusión de órdenes canceladas en cálculos de ventas', () => {
  it('filterNonCancelledOrders never includes orders with status "cancelled"', () => {
    fc.assert(
      fc.property(ordersArb, (orders) => {
        const filtered = filterNonCancelledOrders(orders);

        for (const order of filtered) {
          expect(order.status).not.toBe('cancelled');
        }
      }),
      { numRuns: 200 },
    );
  });

  it('calculateSalesTotal equals the sum of total for non-cancelled orders only', () => {
    fc.assert(
      fc.property(ordersArb, (orders) => {
        const salesTotal = calculateSalesTotal(orders);
        const expectedTotal = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + o.total, 0);

        expect(salesTotal).toBeCloseTo(expectedTotal, 5);
      }),
      { numRuns: 200 },
    );
  });

  it('sum of cancelled order totals + calculateSalesTotal = sum of all order totals', () => {
    fc.assert(
      fc.property(ordersArb, (orders) => {
        const salesTotal = calculateSalesTotal(orders);
        const cancelledTotal = orders
          .filter((o) => o.status === 'cancelled')
          .reduce((sum, o) => sum + o.total, 0);
        const allTotal = orders.reduce((sum, o) => sum + o.total, 0);

        expect(salesTotal + cancelledTotal).toBeCloseTo(allTotal, 5);
      }),
      { numRuns: 200 },
    );
  });
});

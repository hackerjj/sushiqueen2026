import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateRevenue, calculateRevenueFromData } from './revenueCalculation';
import type { Order, Expense, ExpenseCategory } from '../types';

/**
 * **Validates: Requirement 17.1**
 *
 * Property 19: Fórmula de revenue
 *
 * Para cualquier conjunto de órdenes (no canceladas) y gastos en un período,
 * `revenue` debe ser exactamente igual a `total_ventas - total_gastos`.
 */

const ORDER_STATUSES = [
  'pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled',
] as const;

const CATEGORIES: ExpenseCategory[] = [
  'ingredientes', 'servicios', 'personal', 'alquiler', 'marketing', 'otros',
];

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'pending'] as const;

/** Generator for a single Order */
const orderArb: fc.Arbitrary<Order> = fc.record({
  _id: fc.uuid(),
  order_number: fc.string({ minLength: 4, maxLength: 8 }),
  customer_id: fc.uuid(),
  items: fc.constant([]),
  subtotal: fc.double({ min: 0, max: 10_000, noNaN: true }),
  tax: fc.double({ min: 0, max: 1_000, noNaN: true }),
  total: fc.double({ min: 0, max: 10_000, noNaN: true }),
  status: fc.constantFrom(...ORDER_STATUSES),
  source: fc.constantFrom('web', 'whatsapp', 'facebook', 'phone', 'pos' as const),
  type: fc.constantFrom('dine_in', 'takeout', 'delivery' as const),
  notes: fc.string({ maxLength: 20 }),
  delivery_address: fc.string({ maxLength: 50 }),
  payment_method: fc.constantFrom(...PAYMENT_METHODS),
  payment_status: fc.constantFrom('pending', 'paid', 'refunded' as const),
  tip: fc.double({ min: 0, max: 100, noNaN: true }),
  prepared_items: fc.constant([] as number[]),
  created_at: fc.constant(new Date().toISOString()),
});

/** Generator for a single Expense */
const expenseArb: fc.Arbitrary<Expense> = fc.record({
  _id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  amount: fc.double({ min: 0.01, max: 100_000, noNaN: true }),
  category: fc.constantFrom(...CATEGORIES),
  date: fc.constant('2025-01-15'),
  payment_method: fc.constantFrom(...PAYMENT_METHODS),
  receipt_url: fc.option(fc.webUrl(), { nil: undefined }),
  notes: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  created_by: fc.uuid(),
  created_at: fc.constant(new Date().toISOString()),
  updated_at: fc.constant(new Date().toISOString()),
});

const ordersArb = fc.array(orderArb, { minLength: 0, maxLength: 30 });
const expensesArb = fc.array(expenseArb, { minLength: 0, maxLength: 30 });

describe('Property 19: Fórmula de revenue', () => {
  it('calculateRevenue returns total_sales - total_expenses for any inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1_000_000, max: 1_000_000, noNaN: true }),
        fc.double({ min: -1_000_000, max: 1_000_000, noNaN: true }),
        (totalSales, totalExpenses) => {
          const revenue = calculateRevenue(totalSales, totalExpenses);
          expect(revenue).toBeCloseTo(totalSales - totalExpenses, 10);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('calculateRevenueFromData revenue equals sum of non-cancelled order totals minus sum of expense amounts', () => {
    fc.assert(
      fc.property(ordersArb, expensesArb, (orders, expenses) => {
        const result = calculateRevenueFromData(orders, expenses);

        const expectedSales = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + o.total, 0);
        const expectedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        expect(result.total_sales).toBeCloseTo(expectedSales, 5);
        expect(result.total_expenses).toBeCloseTo(expectedExpenses, 5);
        expect(result.revenue).toBeCloseTo(expectedSales - expectedExpenses, 5);
      }),
      { numRuns: 300 },
    );
  });

  it('cancelled orders are excluded from the sales total', () => {
    fc.assert(
      fc.property(ordersArb, expensesArb, (orders, expenses) => {
        const result = calculateRevenueFromData(orders, expenses);

        const cancelledTotal = orders
          .filter((o) => o.status === 'cancelled')
          .reduce((sum, o) => sum + o.total, 0);
        const allOrdersTotal = orders.reduce((sum, o) => sum + o.total, 0);

        // total_sales should be allOrdersTotal minus cancelledTotal
        expect(result.total_sales).toBeCloseTo(allOrdersTotal - cancelledTotal, 5);
      }),
      { numRuns: 300 },
    );
  });

  it('revenue can be negative when expenses exceed sales', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.double({ min: 101, max: 100_000, noNaN: true }),
        (totalSales, totalExpenses) => {
          const revenue = calculateRevenue(totalSales, totalExpenses);
          expect(revenue).toBeLessThan(0);
        },
      ),
      { numRuns: 200 },
    );
  });
});

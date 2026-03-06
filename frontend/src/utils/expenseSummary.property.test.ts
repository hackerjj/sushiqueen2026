import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { summarizeExpensesByCategory } from './expenseSummary';
import type { Expense, ExpenseCategory } from '../types';

/**
 * **Validates: Requirement 16.7**
 *
 * Property 18: Resumen de gastos por categoría
 *
 * Para cualquier conjunto de gastos en un período, el resumen agrupado por
 * categoría debe producir totales donde la suma de todas las categorías sea
 * igual al total general de gastos del período.
 */

const CATEGORIES: ExpenseCategory[] = [
  'ingredientes', 'servicios', 'personal', 'alquiler', 'marketing', 'otros',
];

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'pending'] as const;

/** Generator for a single valid Expense */
const expenseArb: fc.Arbitrary<Expense> = fc.record({
  _id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  amount: fc.double({ min: 0.01, max: 100_000, noNaN: true }),
  category: fc.constantFrom(...CATEGORIES),
  date: fc.integer({ min: 0, max: 730 }).map((offset) => {
    const d = new Date(2024, 0, 1 + offset);
    return d.toISOString().split('T')[0];
  }),
  payment_method: fc.constantFrom(...PAYMENT_METHODS),
  receipt_url: fc.option(fc.webUrl(), { nil: undefined }),
  notes: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  created_by: fc.uuid(),
  created_at: fc.constant(new Date().toISOString()),
  updated_at: fc.constant(new Date().toISOString()),
});

/** Generator for an array of expenses */
const expensesArb = fc.array(expenseArb, { minLength: 0, maxLength: 50 });

describe('Property 18: Resumen de gastos por categoría', () => {
  it('the sum of all category totals equals the sum of all expense amounts', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const summary = summarizeExpensesByCategory(expenses);
        const sumOfCategories = Object.values(summary).reduce((a, b) => a + b, 0);
        const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
        expect(sumOfCategories).toBeCloseTo(totalExpenses, 5);
      }),
      { numRuns: 200 },
    );
  });

  it('each category total equals the sum of amounts for expenses in that category', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const summary = summarizeExpensesByCategory(expenses);
        for (const cat of CATEGORIES) {
          const expectedTotal = expenses
            .filter((e) => e.category === cat)
            .reduce((a, e) => a + e.amount, 0);
          expect(summary[cat]).toBeCloseTo(expectedTotal, 5);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('all categories are present in the result even when no expenses exist', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const summary = summarizeExpensesByCategory(expenses);
        for (const cat of CATEGORIES) {
          expect(summary).toHaveProperty(cat);
          expect(typeof summary[cat]).toBe('number');
        }
      }),
      { numRuns: 200 },
    );
  });

  it('category totals are >= 0 when all amounts are >= 0', () => {
    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const summary = summarizeExpensesByCategory(expenses);
        for (const cat of CATEGORIES) {
          expect(summary[cat]).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 200 },
    );
  });
});

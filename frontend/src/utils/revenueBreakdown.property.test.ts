import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateDailyBreakdown } from './revenueCalculation';
import type { DailyEntry } from './revenueCalculation';

/**
 * **Validates: Requirement 17.4**
 *
 * Property 20: Consistencia del desglose diario de revenue
 *
 * Para cualquier reporte de revenue con desglose diario, la suma de `revenue`
 * de cada día del desglose debe ser igual al `revenue` total del período.
 */

/** Generator for a YYYY-MM-DD date string */
const dateStringArb = fc
  .tuple(
    fc.integer({ min: 2024, max: 2025 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

/** Generator for a single daily entry */
const dailyEntryArb: fc.Arbitrary<DailyEntry> = fc.record({
  date: dateStringArb,
  sales: fc.double({ min: 0, max: 100_000, noNaN: true }),
  expenses: fc.double({ min: 0, max: 100_000, noNaN: true }),
});

const dailyEntriesArb = fc.array(dailyEntryArb, { minLength: 0, maxLength: 60 });

describe('Property 20: Consistencia del desglose diario de revenue', () => {
  it('sum of daily revenue values equals the total revenue', () => {
    fc.assert(
      fc.property(dailyEntriesArb, (entries) => {
        const result = calculateDailyBreakdown(entries);
        const sumOfDailyRevenues = result.breakdown.reduce(
          (sum, day) => sum + day.revenue,
          0,
        );
        expect(result.totalRevenue).toBeCloseTo(sumOfDailyRevenues, 5);
      }),
      { numRuns: 500 },
    );
  });

  it("each day's revenue equals that day's sales minus expenses", () => {
    fc.assert(
      fc.property(dailyEntriesArb, (entries) => {
        const result = calculateDailyBreakdown(entries);
        for (let i = 0; i < entries.length; i++) {
          expect(result.breakdown[i].revenue).toBeCloseTo(
            entries[i].sales - entries[i].expenses,
            10,
          );
        }
      }),
      { numRuns: 500 },
    );
  });

  it('breakdown has the same number of entries as the input', () => {
    fc.assert(
      fc.property(dailyEntriesArb, (entries) => {
        const result = calculateDailyBreakdown(entries);
        expect(result.breakdown).toHaveLength(entries.length);
      }),
      { numRuns: 500 },
    );
  });

  it('total revenue equals sum of all sales minus sum of all expenses', () => {
    fc.assert(
      fc.property(dailyEntriesArb, (entries) => {
        const result = calculateDailyBreakdown(entries);
        const totalSales = entries.reduce((sum, e) => sum + e.sales, 0);
        const totalExpenses = entries.reduce((sum, e) => sum + e.expenses, 0);
        expect(result.totalRevenue).toBeCloseTo(totalSales - totalExpenses, 5);
      }),
      { numRuns: 500 },
    );
  });
});

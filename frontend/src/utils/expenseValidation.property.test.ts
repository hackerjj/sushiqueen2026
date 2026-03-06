import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateExpense } from './expenseValidation';

const VALID_CATEGORIES = ['ingredientes', 'servicios', 'personal', 'alquiler', 'marketing', 'otros'] as const;

/**
 * **Validates: Requirements 16.2, 16.3**
 *
 * Property 17: Validación de gastos
 *
 * Para cualquier gasto, la descripción debe tener máximo 255 caracteres,
 * el monto debe ser numérico y mayor a cero, la categoría debe pertenecer
 * al conjunto {ingredientes, servicios, personal, alquiler, marketing, otros},
 * y la fecha debe estar en formato ISO válido.
 */
describe('Property 17: Validación de gastos', () => {
  /** Generator for valid description (1-255 chars) */
  const validDescriptionArb = fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.length >= 1);

  /** Generator for valid amount (> 0) */
  const validAmountArb = fc.double({ min: 0.01, max: 1_000_000, noNaN: true });

  /** Generator for valid category */
  const validCategoryArb = fc.constantFrom(...VALID_CATEGORIES);

  /** Generator for valid ISO date strings */
  const validDateArb = fc.integer({ min: 2020, max: 2030 }).chain(year =>
    fc.integer({ min: 1, max: 12 }).chain(month =>
      fc.integer({ min: 1, max: 28 }).map(day => {
        const y = String(year);
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${y}-${m}-${d}`;
      })
    )
  );

  /** Generator for a fully valid expense */
  const validExpenseArb = fc.record({
    description: validDescriptionArb,
    amount: validAmountArb,
    category: validCategoryArb,
    date: validDateArb,
  });

  it('valid expenses always pass validation', () => {
    fc.assert(
      fc.property(validExpenseArb, (expense) => {
        const result = validateExpense(expense);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 200 },
    );
  });

  it('expenses with description > 255 chars always fail', () => {
    const longDescArb = fc.string({ minLength: 256, maxLength: 500 });
    const invalidExpenseArb = fc.record({
      description: longDescArb,
      amount: validAmountArb,
      category: validCategoryArb,
      date: validDateArb,
    });

    fc.assert(
      fc.property(invalidExpenseArb, (expense) => {
        const result = validateExpense(expense);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('description'))).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('expenses with amount <= 0 always fail', () => {
    const invalidAmountArb = fc.double({ min: -1_000_000, max: 0, noNaN: true });
    const invalidExpenseArb = fc.record({
      description: validDescriptionArb,
      amount: invalidAmountArb,
      category: validCategoryArb,
      date: validDateArb,
    });

    fc.assert(
      fc.property(invalidExpenseArb, (expense) => {
        const result = validateExpense(expense);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('amount'))).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('expenses with invalid category always fail', () => {
    const invalidCategoryArb = fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => !VALID_CATEGORIES.includes(s as typeof VALID_CATEGORIES[number]));
    const invalidExpenseArb = fc.record({
      description: validDescriptionArb,
      amount: validAmountArb,
      category: invalidCategoryArb,
      date: validDateArb,
    });

    fc.assert(
      fc.property(invalidExpenseArb, (expense) => {
        const result = validateExpense(expense);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('category'))).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('expenses with invalid date always fail', () => {
    const invalidDateArb = fc.constantFrom('', 'not-a-date', '2024-13-45', 'abc123');
    const invalidExpenseArb = fc.record({
      description: validDescriptionArb,
      amount: validAmountArb,
      category: validCategoryArb,
      date: invalidDateArb,
    });

    fc.assert(
      fc.property(invalidExpenseArb, (expense) => {
        const result = validateExpense(expense);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('date'))).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});

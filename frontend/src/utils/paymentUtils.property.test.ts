import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateCashPayment } from './paymentUtils';

/**
 * **Validates: Requirements 6.2, 6.6**
 *
 * Property 8: Cálculo de cambio en pago efectivo
 *
 * Para cualquier total mayor a cero y monto recibido mayor o igual a cero,
 * el cambio calculado debe ser `max(0, monto_recibido - total)`, y el campo
 * `change_amount` debe ser siempre mayor o igual a cero.
 */
describe('Property: Cálculo de cambio en pago efectivo', () => {
  /** Generator for total > 0 (positive doubles, avoiding NaN/Infinity) */
  const totalArb = fc.double({ min: 0.01, max: 1_000_000, noNaN: true });

  /** Generator for cashReceived >= 0 */
  const cashReceivedArb = fc.double({ min: 0, max: 1_000_000, noNaN: true });

  /** Generator for noChange boolean */
  const noChangeArb = fc.boolean();

  it('change_amount is always >= 0 for any total > 0 and cashReceived >= 0', () => {
    fc.assert(
      fc.property(totalArb, cashReceivedArb, noChangeArb, (total, cashReceived, noChange) => {
        const result = calculateCashPayment(total, cashReceived, noChange);
        expect(result.change_amount).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 200 },
    );
  });

  it('change_amount equals max(0, cashReceived - total)', () => {
    fc.assert(
      fc.property(totalArb, cashReceivedArb, noChangeArb, (total, cashReceived, noChange) => {
        const result = calculateCashPayment(total, cashReceived, noChange);
        const expected = Math.max(0, cashReceived - total);
        expect(result.change_amount).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  it('method is always "cash"', () => {
    fc.assert(
      fc.property(totalArb, cashReceivedArb, noChangeArb, (total, cashReceived, noChange) => {
        const result = calculateCashPayment(total, cashReceived, noChange);
        expect(result.method).toBe('cash');
      }),
      { numRuns: 200 },
    );
  });

  it('cash_received equals the input cashReceived', () => {
    fc.assert(
      fc.property(totalArb, cashReceivedArb, noChangeArb, (total, cashReceived, noChange) => {
        const result = calculateCashPayment(total, cashReceived, noChange);
        expect(result.cash_received).toBe(cashReceived);
      }),
      { numRuns: 200 },
    );
  });
});

/**
 * **Validates: Requirement 6.4**
 *
 * Property 9: Campos de préstamo condicionales en pago
 *
 * Para cualquier pago donde `no_change` es falso, los campos `borrowed_amount`
 * y `borrowed_from` deben ser `undefined`. Cuando `no_change` es true, deben
 * reflejar los valores de entrada.
 */
describe('Property: Campos de préstamo condicionales en pago', () => {
  const totalArb = fc.double({ min: 0.01, max: 1_000_000, noNaN: true });
  const cashReceivedArb = fc.double({ min: 0, max: 1_000_000, noNaN: true });
  const borrowedAmountArb = fc.double({ min: 0.01, max: 1_000_000, noNaN: true });
  const borrowedFromArb = fc.string({ minLength: 1, maxLength: 50 });

  it('when noChange is false, borrowed_amount and borrowed_from are always undefined', () => {
    fc.assert(
      fc.property(
        totalArb,
        cashReceivedArb,
        borrowedAmountArb,
        borrowedFromArb,
        (total, cashReceived, borrowedAmount, borrowedFrom) => {
          const result = calculateCashPayment(total, cashReceived, false, borrowedAmount, borrowedFrom);
          expect(result.borrowed_amount).toBeUndefined();
          expect(result.borrowed_from).toBeUndefined();
        },
      ),
      { numRuns: 200 },
    );
  });

  it('when noChange is true, borrowed_amount and borrowed_from reflect input values', () => {
    fc.assert(
      fc.property(
        totalArb,
        cashReceivedArb,
        borrowedAmountArb,
        borrowedFromArb,
        (total, cashReceived, borrowedAmount, borrowedFrom) => {
          const result = calculateCashPayment(total, cashReceived, true, borrowedAmount, borrowedFrom);
          expect(result.borrowed_amount).toBe(borrowedAmount);
          expect(result.borrowed_from).toBe(borrowedFrom);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('the conditional is deterministic — same inputs always produce same outputs', () => {
    fc.assert(
      fc.property(
        totalArb,
        cashReceivedArb,
        fc.boolean(),
        borrowedAmountArb,
        borrowedFromArb,
        (total, cashReceived, noChange, borrowedAmount, borrowedFrom) => {
          const r1 = calculateCashPayment(total, cashReceived, noChange, borrowedAmount, borrowedFrom);
          const r2 = calculateCashPayment(total, cashReceived, noChange, borrowedAmount, borrowedFrom);
          expect(r1.borrowed_amount).toBe(r2.borrowed_amount);
          expect(r1.borrowed_from).toBe(r2.borrowed_from);
        },
      ),
      { numRuns: 200 },
    );
  });
});

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateGridColumns } from './tableGrid';

/**
 * **Validates: Requirement 3.2**
 *
 * Property 6: Cálculo de columnas del grid de mesas
 *
 * Para cualquier número positivo de mesas en una zona, el número de columnas
 * del grid debe ser igual a min(6, ceil(sqrt(n))) donde n es el total de mesas
 * en la zona.
 */

describe('Property 6: Cálculo de columnas del grid de mesas', () => {
  it('for any positive n, calculateGridColumns(n) === min(6, ceil(sqrt(n)))', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (n) => {
        const result = calculateGridColumns(n);
        const expected = Math.min(6, Math.ceil(Math.sqrt(n)));
        expect(result).toBe(expected);
      }),
      { numRuns: 500 },
    );
  });

  it('result is always between 1 and 6 inclusive', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (n) => {
        const result = calculateGridColumns(n);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }),
      { numRuns: 500 },
    );
  });

  it('for n <= 1, result is 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 1 }), (n) => {
        const result = calculateGridColumns(n);
        expect(result).toBe(1);
      }),
      { numRuns: 200 },
    );
  });

  it('for n > 36, result is always 6', () => {
    fc.assert(
      fc.property(fc.integer({ min: 37, max: 10000 }), (n) => {
        const result = calculateGridColumns(n);
        expect(result).toBe(6);
      }),
      { numRuns: 500 },
    );
  });
});

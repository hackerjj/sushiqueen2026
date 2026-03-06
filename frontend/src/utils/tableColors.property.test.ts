import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getTableColor } from './tableGrid';
import type { TableColor } from './tableGrid';

/**
 * **Validates: Requirement 3.3**
 *
 * Property 7: Mapeo de colores de mesas
 *
 * Para cualquier mesa, el color asignado debe ser: naranja si tiene productos
 * en el carrito, rojo si está ocupada sin productos en carrito, y verde si está
 * disponible. El mapeo debe ser determinístico y exhaustivo.
 */

const VALID_COLORS: TableColor[] = ['orange', 'red', 'green'];

const statusArb = fc.constantFrom('available', 'occupied', 'reserved', 'closed', 'maintenance');

describe('Property 7: Mapeo de colores de mesas', () => {
  it('hasItems=true always returns orange regardless of status', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const color = getTableColor(true, status);
        expect(color).toBe('orange');
      }),
      { numRuns: 200 },
    );
  });

  it('hasItems=false and status=occupied always returns red', () => {
    fc.assert(
      fc.property(fc.boolean(), (_) => {
        const color = getTableColor(false, 'occupied');
        expect(color).toBe('red');
      }),
      { numRuns: 100 },
    );
  });

  it('hasItems=false and status!=occupied always returns green', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s !== 'occupied'),
        (status) => {
          const color = getTableColor(false, status);
          expect(color).toBe('green');
        },
      ),
      { numRuns: 200 },
    );
  });

  it('result is always one of orange, red, green (exhaustive)', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.string(), (hasItems, status) => {
        const color = getTableColor(hasItems, status);
        expect(VALID_COLORS).toContain(color);
      }),
      { numRuns: 500 },
    );
  });

  it('mapping is deterministic (same inputs produce same output)', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.string(), (hasItems, status) => {
        const color1 = getTableColor(hasItems, status);
        const color2 = getTableColor(hasItems, status);
        expect(color1).toBe(color2);
      }),
      { numRuns: 500 },
    );
  });
});

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getZoneTables } from './tableGrid';
import type { TableInfo } from './tableGrid';

/**
 * **Validates: Requirements 3.1, 3.4**
 *
 * Property 5: Grid de mesas — completitud y ordenamiento
 *
 * Para cualquier zona con un conjunto de mesas, el grid debe renderizar cada
 * mesa exactamente una vez (sin duplicados ni omisiones), ordenadas por número
 * de mesa ascendente.
 */

const ZONES = ['main', 'patio', 'bar', 'vip', 'terrace'];

const tableArb: fc.Arbitrary<TableInfo> = fc.record({
  _id: fc.uuid(),
  number: fc.integer({ min: 1, max: 200 }),
  zone: fc.constantFrom(...ZONES),
  status: fc.constantFrom('available', 'occupied', 'reserved'),
  capacity: fc.integer({ min: 1, max: 20 }),
});

const tablesArb = fc.array(tableArb, { minLength: 0, maxLength: 40 });
const zoneArb = fc.constantFrom(...ZONES);

describe('Property 5: Grid de mesas — completitud y ordenamiento', () => {
  it('every table in the zone appears exactly once in the result (no duplicates, no omissions)', () => {
    fc.assert(
      fc.property(tablesArb, zoneArb, (tables, zone) => {
        const result = getZoneTables(tables, zone);
        const expected = tables.filter(t => t.zone === zone);

        // Same count — no omissions, no extras
        expect(result.length).toBe(expected.length);

        // Every expected table is present
        const resultIds = result.map(t => t._id);
        for (const t of expected) {
          expect(resultIds).toContain(t._id);
        }

        // No duplicates
        const uniqueIds = new Set(resultIds);
        expect(uniqueIds.size).toBe(result.length);
      }),
      { numRuns: 200 },
    );
  });

  it('result is sorted by number ascending', () => {
    fc.assert(
      fc.property(tablesArb, zoneArb, (tables, zone) => {
        const result = getZoneTables(tables, zone);

        for (let i = 1; i < result.length; i++) {
          expect(result[i - 1].number).toBeLessThanOrEqual(result[i].number);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('no tables from other zones appear in the result', () => {
    fc.assert(
      fc.property(tablesArb, zoneArb, (tables, zone) => {
        const result = getZoneTables(tables, zone);

        for (const t of result) {
          expect(t.zone).toBe(zone);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('result length equals the count of tables with matching zone', () => {
    fc.assert(
      fc.property(tablesArb, zoneArb, (tables, zone) => {
        const result = getZoneTables(tables, zone);
        const expectedCount = tables.filter(t => t.zone === zone).length;

        expect(result.length).toBe(expectedCount);
      }),
      { numRuns: 200 },
    );
  });
});

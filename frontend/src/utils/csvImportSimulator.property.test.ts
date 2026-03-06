import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CsvImportRow, simulateCsvImport } from './csvImportSimulator';

/**
 * **Validates: Requirements 10.4, 10.5**
 *
 * Property 13: Idempotencia de importación CSV
 *
 * Para cualquier conjunto de productos del menú, exportar a CSV e importar
 * el mismo CSV no debe crear duplicados — productos con `_id` existente se
 * actualizan, productos sin `_id` se crean.
 */

/** Generator for a valid menu item with an _id */
const menuItemWithIdArb = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  price: fc.double({ min: 0.01, max: 100000, noNaN: true }),
  description: fc.string({ minLength: 0, maxLength: 100 }),
  category: fc.constantFrom('Rolls', 'Sushi', 'Drinks', 'Desserts', 'General'),
  available: fc.boolean(),
});

/** Generator for a valid menu item without an _id */
const menuItemWithoutIdArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  price: fc.double({ min: 0.01, max: 100000, noNaN: true }),
  description: fc.string({ minLength: 0, maxLength: 100 }),
  category: fc.constantFrom('Rolls', 'Sushi', 'Drinks', 'Desserts', 'General'),
  available: fc.boolean(),
});

/** Build a Map from an array of items with _id */
function buildExistingMap(items: CsvImportRow[]): Map<string, CsvImportRow> {
  const map = new Map<string, CsvImportRow>();
  for (const item of items) {
    if (item._id) map.set(item._id, item);
  }
  return map;
}

describe('Property: Idempotencia de importación CSV', () => {
  it('importing rows with existing _ids results in updates only (no new items for those)', () => {
    fc.assert(
      fc.property(
        fc.array(menuItemWithIdArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const existing = buildExistingMap(items);
          const originalSize = existing.size;

          const result = simulateCsvImport(items, existing);

          // All rows had existing _ids, so all should be updates
          expect(result.updated).toBe(items.length);
          expect(result.created).toBe(0);
          // Menu size should not change
          expect(result.menuItems.size).toBe(originalSize);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('importing rows without _id always results in creates', () => {
    fc.assert(
      fc.property(
        fc.array(menuItemWithIdArb, { minLength: 0, maxLength: 10 }),
        fc.array(menuItemWithoutIdArb, { minLength: 1, maxLength: 10 }),
        (existingItems, newRows) => {
          const existing = buildExistingMap(existingItems);
          const originalSize = existing.size;

          const result = simulateCsvImport(newRows, existing);

          expect(result.created).toBe(newRows.length);
          expect(result.updated).toBe(0);
          expect(result.menuItems.size).toBe(originalSize + newRows.length);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('after import, total menu items = original count + created', () => {
    fc.assert(
      fc.property(
        fc.array(menuItemWithIdArb, { minLength: 0, maxLength: 10 }),
        fc.array(
          fc.oneof(menuItemWithIdArb, menuItemWithoutIdArb as fc.Arbitrary<CsvImportRow>),
          { minLength: 0, maxLength: 15 },
        ),
        (existingItems, importRows) => {
          const existing = buildExistingMap(existingItems);
          const originalSize = existing.size;

          // Tag import rows: those with _id in existing are updates, rest are creates
          const rows = importRows.map((row) => {
            if (row._id && existing.has(row._id)) return row;
            // Remove _id so it's treated as a create
            if (!row._id) return row;
            // Row has _id but it's not in existing — it's a create
            return row;
          });

          const result = simulateCsvImport(rows, existing);

          expect(result.menuItems.size).toBe(originalSize + result.created);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('importing the same rows with _id twice does not increase item count (idempotency)', () => {
    fc.assert(
      fc.property(
        fc.array(menuItemWithIdArb, { minLength: 1, maxLength: 15 }),
        (items) => {
          const existing = buildExistingMap(items);

          // First import
          const firstResult = simulateCsvImport(items, existing);
          const sizeAfterFirst = firstResult.menuItems.size;

          // Second import with same rows on the result of the first
          const secondResult = simulateCsvImport(items, firstResult.menuItems);
          const sizeAfterSecond = secondResult.menuItems.size;

          // Size should not change between imports
          expect(sizeAfterSecond).toBe(sizeAfterFirst);
          // Second import should be all updates, no creates
          expect(secondResult.created).toBe(0);
          expect(secondResult.updated).toBe(items.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});
